import { AdminSettingsForm } from "@/app/components/admin-settings-form";
import { getSiteSettings, listSiteLanguages } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, languages] = await Promise.all([
    getSiteSettings(),
    listSiteLanguages(),
  ]);

  return <AdminSettingsForm initialSettings={settings} languages={languages} />;
}
