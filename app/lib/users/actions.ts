"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import type { UserDisplayPreferences } from "@/app/lib/site-admin/display-preferences";

export async function saveUserDisplayPreferencesAction(
  input: UserDisplayPreferences,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_current_user_display_preferences", {
    p_week_start_day: input.weekStartDay,
    p_date_format: input.dateFormat,
    p_date_separator: input.dateSeparator,
    p_time_format: input.timeFormat,
  });

  if (error) {
    return { ok: false, error: "errors.user_profile_failed" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/settings/profile");
  return { ok: true };
}
