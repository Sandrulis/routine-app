import type { Metadata } from "next";
import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getCookiePolicyContent } from "@/app/lib/legal/documents";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("legal.cookies.title", "Sīkdatņu politika"),
  };
}

export default async function CookiesPage() {
  const { t } = await getServerTranslations();
  return (
    <LegalDocumentView
      content={getCookiePolicyContent(t)}
      extra={<CookieSettingsLink />}
    />
  );
}
