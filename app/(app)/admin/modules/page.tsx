import type { Metadata } from "next";
import { AdminFrontendModulesForm } from "@/app/components/admin-frontend-modules-form";
import { listFrontendModules } from "@/app/lib/frontend-modules/repository";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { isMicrosoftOAuthEnabled } from "@/app/lib/integrations/microsoft-oauth/repository";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("nav.modules", "Moduļi");
}

export default async function AdminModulesPage() {
  await requireAdmin();
  const [modules, googleOAuthEnabled, microsoftOAuthEnabled] = await Promise.all([
    listFrontendModules(),
    isGoogleSignInEnabled(),
    isMicrosoftOAuthEnabled(),
  ]);

  return (
    <AdminFrontendModulesForm
      initialModules={modules}
      googleOAuthEnabled={googleOAuthEnabled}
      microsoftOAuthEnabled={microsoftOAuthEnabled}
    />
  );
}
