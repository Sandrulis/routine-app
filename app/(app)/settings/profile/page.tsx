import type { Metadata } from "next";
import { ProfileSettingsView } from "@/app/components/profile-settings-view";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { getCurrentUserDisplayPreferences } from "@/app/lib/users/display-preferences";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("user_menu.settings", "Personīgie uzstādījumi");
}

export default async function ProfileSettingsPage() {
  const [settings, userPreferences] = await Promise.all([
    getSiteSettings(),
    getCurrentUserDisplayPreferences(),
  ]);

  return (
    <ProfileSettingsView
      systemDefaults={settings.displayPreferences}
      initialUserPreferences={userPreferences}
    />
  );
}
