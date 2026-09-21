import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import {
  DEFAULT_USER_UI_PREFERENCES,
  STATUS_GROUP_SORT_COOKIE,
  TABLE_COLUMN_VISIBILITY_COOKIE,
  mergeUiPreferencesWithCookies,
  parseStoredUiPreferences,
  type UserUiPreferences,
} from "@/app/lib/users/ui-preferences";

export const getCurrentUserUiPreferences = cache(
  async function getCurrentUserUiPreferences(): Promise<UserUiPreferences> {
    const empty = { ...DEFAULT_USER_UI_PREFERENCES };
    if (!isSupabaseConfigured()) {
      return empty;
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return empty;
      }

      const { data, error } = await supabase
        .from("users")
        .select("ui_preferences")
        .eq("id", user.id)
        .maybeSingle();

      const stored =
        error || !data
          ? {}
          : parseStoredUiPreferences(
              (data as { ui_preferences?: unknown }).ui_preferences,
            );

      const cookieStore = await cookies();
      return mergeUiPreferencesWithCookies(
        stored,
        cookieStore.get(STATUS_GROUP_SORT_COOKIE)?.value ?? null,
        cookieStore.get(TABLE_COLUMN_VISIBILITY_COOKIE)?.value ?? null,
      );
    } catch (error) {
      console.error("getCurrentUserUiPreferences failed:", error);
      return empty;
    }
  },
);
