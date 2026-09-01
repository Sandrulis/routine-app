import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { PublicPageJsonLd } from "@/app/components/public-page-json-ld";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveSystemName } from "@/app/lib/document-title";
import { getPrivacyPolicyContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  return canonicalMetadata("/privacy", {
    title: t("legal.privacy.title", "Privātuma politika"),
    description: t(
      "legal.privacy.meta_description",
      "{SYSTEM_NAME}: kā apstrādājam personas datus, komandas saturu un integrācijas. Tavas VDAR tiesības un saziņa ar datu pārzini.",
      { SYSTEM_NAME: systemName },
    ),
    ogDescription: t(
      "legal.privacy.intro",
      "Šajā politikā skaidrojam, kādus personas datus apstrādājam, kad tu izmanto {SYSTEM_NAME}, kāpēc to darām, ar ko datus kopīgojam un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).",
      { SYSTEM_NAME: systemName },
    ),
  });
}

export default async function PrivacyPage() {
  const [{ t, languageCode }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  const title = t("legal.privacy.title", "Privātuma politika");
  const description = t(
    "legal.privacy.meta_description",
    "{SYSTEM_NAME}: kā apstrādājam personas datus, komandas saturu un integrācijas. Tavas VDAR tiesības un saziņa ar datu pārzini.",
    { SYSTEM_NAME: systemName },
  );
  const content = getPrivacyPolicyContent(t, {
    legalEmail: settings.legalEmail,
    legalEntityName: settings.legalEntityName,
    legalEntityRegNo: settings.legalEntityRegNo,
    legalEntityAddress: settings.legalEntityAddress,
  });

  return (
    <>
      <PublicPageJsonLd
        path="/privacy"
        title={title}
        description={description}
        languageCode={languageCode}
        breadcrumbs={[
          { name: t("nav.home", "Sākums"), path: "/" },
          { name: title, path: "/privacy" },
        ]}
      />
      <LegalDocumentView content={content} />
    </>
  );
}
