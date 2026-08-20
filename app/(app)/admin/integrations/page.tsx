import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminIntegrationsPage } from "@/app/components/admin-integrations-page";
import { fetchGoogleOAuthIntegrationStatus } from "@/app/lib/integrations/google-oauth/repository";
import { fetchMicrosoftOAuthIntegrationStatus } from "@/app/lib/integrations/microsoft-oauth/repository";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import { fetchSimpleIntegrationStatus } from "@/app/lib/integrations/simple/repository";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.integrations", "Integrācijas");
}

export default async function AdminIntegrationsRoute() {
  await requireAdmin();
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  const [googleOAuth, microsoftOAuth, resend, umami, sentry] = await Promise.all([
    fetchGoogleOAuthIntegrationStatus(siteOrigin),
    fetchMicrosoftOAuthIntegrationStatus(siteOrigin),
    fetchSimpleIntegrationStatus(SITE_INTEGRATION_KEYS.resend),
    fetchSimpleIntegrationStatus(SITE_INTEGRATION_KEYS.umami),
    fetchSimpleIntegrationStatus(SITE_INTEGRATION_KEYS.sentry),
  ]);

  return (
    <Suspense>
      <AdminIntegrationsPage
        initialGoogleOAuth={googleOAuth}
        initialMicrosoftOAuth={microsoftOAuth}
        initialResend={resend}
        initialUmami={umami}
        initialSentry={sentry}
      />
    </Suspense>
  );
}
