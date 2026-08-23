import type { Metadata } from "next";
import { AdminSettingsForm } from "@/app/components/admin-settings-form";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { getSiteSettings, listSiteLanguages } from "@/app/lib/site-admin/repository";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import { fetchSimpleIntegrationStatus } from "@/app/lib/integrations/simple/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.settings", "Uzstādījumi");
}

export default async function AdminSettingsPage() {
  await requireAdmin();
  const [settings, languages, resend] = await Promise.all([
    getSiteSettings(),
    listSiteLanguages(),
    fetchSimpleIntegrationStatus(SITE_INTEGRATION_KEYS.resend),
  ]);

  return (
    <AdminSettingsForm
      initialSettings={settings}
      languages={languages}
      resend={resend}
    />
  );
}
