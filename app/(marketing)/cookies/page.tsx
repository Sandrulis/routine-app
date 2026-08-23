import type { Metadata } from "next";
import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getCookiePolicyContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/cookies", {
    title: t("legal.cookies.title", "Sīkdatņu politika"),
    description: t(
      "legal.cookies.intro",
      "Šī politika paskaidro, kādas sīkdatnes {SYSTEM_NAME} izmanto, kāpēc tās ir vajadzīgas un kā tu vari pārvaldīt piekrišanu. Tā jālasa kopā ar privātuma politiku.",
    ),
  });
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
