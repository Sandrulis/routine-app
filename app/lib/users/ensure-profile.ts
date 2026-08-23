import { cache } from "react";
import { cookies } from "next/headers";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import {
  hasExplicitLanguageChoice,
  isLanguageCode,
  LANGUAGE_CHOSEN_COOKIE,
  LANGUAGE_COOKIE,
} from "@/app/lib/i18n/language";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

type ProfileSupabaseClient = Awaited<ReturnType<typeof createClient>>;

async function ensureProfileWithClient(
  supabase: ProfileSupabaseClient,
  userId: string,
  name: string,
  avatarUrl: string | null,
) {
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (!existing?.id) {
    const { error } = await supabase.rpc("ensure_user_profile", {
      p_name: name,
      p_avatar: avatarUrl ?? "",
    });
    if (error) {
      console.error("ensure_user_profile failed:", error.message);
      return;
    }
  }

  await persistGuestLanguageChoice(supabase, userId);
}

const ensureCurrentUserProfileCached = cache(async function ensureCurrentUserProfileCached() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const user = await getCurrentUser();
  if (!user) {
    return;
  }

  const supabase = await createClient();
  const display = mapUserDisplay(user);
  await ensureProfileWithClient(
    supabase,
    user.id,
    display.name,
    display.avatarUrl,
  );
});

export async function ensureCurrentUserProfile(
  client?: ProfileSupabaseClient,
) {
  if (!isSupabaseConfigured()) {
    return;
  }

  if (!client) {
    await ensureCurrentUserProfileCached();
    return;
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    return;
  }

  const display = mapUserDisplay(user);
  await ensureProfileWithClient(client, user.id, display.name, display.avatarUrl);
}

async function persistGuestLanguageChoice(
  supabase: ProfileSupabaseClient,
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
