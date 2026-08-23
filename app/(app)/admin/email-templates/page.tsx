import type { Metadata } from "next";
import { AdminEmailTemplatesForm } from "@/app/components/admin-email-templates-form";
import { listEmailTemplateDrafts } from "@/app/lib/email/templates-server";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.email_templates", "E-pasta šabloni");
}

export default async function AdminEmailTemplatesPage() {
  await requireAdmin();
  const [languages, resendEnabled] = await Promise.all([
    listSiteLanguages(),
    isEmailPasswordAuthEnabled(),
  ]);
  const templates = await listEmailTemplateDrafts(languages);

  return (
    <AdminEmailTemplatesForm
      resendEnabled={resendEnabled}
      initialTemplates={templates}
      languages={languages}
    />
  );
}
