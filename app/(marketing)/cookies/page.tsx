import type { Metadata } from "next";
import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { PublicPageJsonLd } from "@/app/components/public-page-json-ld";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveSystemName } from "@/app/lib/document-title";
import { getCookiePolicyContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  return canonicalMetadata("/cookies", {
    title: t("legal.cookies.title", "Sīkdatņu politika"),
    description: t(
      "legal.cookies.meta_description",
      "Kādas sīkdatnes {SYSTEM_NAME} izmanto, kuras ir obligātas, kā darbojas statistika un kā mainīt piekrišanu.",
      { SYSTEM_NAME: systemName },
    ),
    ogDescription: t(
      "legal.cookies.intro",
      "Šī politika paskaidro, kādas sīkdatnes un līdzīgas tehnoloģijas {SYSTEM_NAME} izmanto, kāpēc tās ir vajadzīgas un kā tu vari pārvaldīt piekrišanu. Tā jālasa kopā ar privātuma politiku.",
      { SYSTEM_NAME: systemName },
    ),
  });
}

export default async function CookiesPage() {
  const [{ t, languageCode }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  const title = t("legal.cookies.title", "Sīkdatņu politika");
  const description = t(
    "legal.cookies.meta_description",
    "Kādas sīkdatnes {SYSTEM_NAME} izmanto, kuras ir obligātas, kā darbojas statistika un kā mainīt piekrišanu.",
    { SYSTEM_NAME: systemName },
  );

  return (
    <>
      <PublicPageJsonLd
        path="/cookies"
        title={title}
        description={description}
        languageCode={languageCode}
        breadcrumbs={[
          { name: t("nav.home", "Sākums"), path: "/" },
          { name: title, path: "/cookies" },
        ]}
      />
      <LegalDocumentView
        content={getCookiePolicyContent(t)}
        extra={<CookieSettingsLink />}
      />
    </>
  );
}
