import { cache } from "react";
import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import {
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  readUserDisplayPreferences,
  type SiteDisplayPreferences,
  type UserDisplayPreferences,
} from "@/app/lib/site-admin/display-preferences";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const getCurrentUserDisplayPreferences = cache(
  async function getCurrentUserDisplayPreferences(): Promise<UserDisplayPreferences> {
    if (!isSupabaseConfigured()) {
      return EMPTY_USER_DISPLAY_PREFERENCES;
    }

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return EMPTY_USER_DISPLAY_PREFERENCES;
      }

      const { data, error } = await supabase
        .from("users")
        .select("week_start_day, date_format, date_separator, time_format")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !data) {
        return EMPTY_USER_DISPLAY_PREFERENCES;
      }

      return readUserDisplayPreferences(data);
    } catch (error) {
      console.error("getCurrentUserDisplayPreferences failed:", error);
      return EMPTY_USER_DISPLAY_PREFERENCES;
    }
  },
);

export async function getEffectiveDisplayPreferences(): Promise<SiteDisplayPreferences> {
  const [settings, userPreferences] = await Promise.all([
    getSiteSettings(),
    getCurrentUserDisplayPreferences(),
  ]);
  return mergeDisplayPreferences(settings.displayPreferences, userPreferences);
}
