import { cookies } from "next/headers";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import {
  hasExplicitLanguageChoice,
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
} from "@/app/lib/i18n/language";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export async function ensureCurrentUserProfile() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  const display = mapUserDisplay(user);
  const { error } = await supabase.rpc("ensure_user_profile", {
    p_name: display.name,
    p_avatar: display.avatarUrl ?? "",
  });

  if (error) {
    console.error("ensure_user_profile failed:", error.message);
    return;
  }

  await persistGuestLanguageChoice(supabase, user.id);
}

async function persistGuestLanguageChoice(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data } = await supabase
    .from("users")
    .select("language_code")
    .eq("id", userId)
    .maybeSingle();

  if (data?.language_code) {
    return;
  }

  const cookieStore = await cookies();
  const cookieCode = cookieStore.get(LANGUAGE_COOKIE)?.value;
  const chosen = cookieStore.get(LANGUAGE_CHOSEN_COOKIE)?.value;
  if (
    !hasExplicitLanguageChoice(chosen) ||
    !cookieCode ||
    !isLanguageCode(cookieCode)
  ) {
    return;
  }

  const { error } = await supabase.rpc("set_current_user_language", {
    p_code: cookieCode,
  });
  if (error) {
    console.error("set_current_user_language failed:", error.message);
  }
}
