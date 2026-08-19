import { ProfileSettingsView } from "@/app/components/profile-settings-view";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { getCurrentUserDisplayPreferences } from "@/app/lib/users/display-preferences";

export const dynamic = "force-dynamic";

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
