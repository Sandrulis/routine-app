import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { PublicPageJsonLd } from "@/app/components/public-page-json-ld";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveSystemName } from "@/app/lib/document-title";
import { getTermsContent, type LegalDocumentContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { getPublicSiteHost } from "@/app/lib/seo/site-url";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

async function loadTermsContent(): Promise<LegalDocumentContent> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  return getTermsContent(t, {
    legalEmail: settings.legalEmail,
    legalEntityName: settings.legalEntityName,
    legalEntityRegNo: settings.legalEntityRegNo,
    legalEntityAddress: settings.legalEntityAddress,
    siteHost: getPublicSiteHost(),
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  const content = await loadTermsContent();
  return canonicalMetadata("/terms", {
    title: content.title,
    description: t(
      "legal.terms.meta_description",
      "{SYSTEM_NAME} lietošanas noteikumi: konts, komandas dati, maksājumi, pieļaujamā lietošana, atbildība un piemērojamie tiesību akti.",
      { SYSTEM_NAME: systemName },
    ),
    ogDescription: content.intro,
  });
}

export default async function TermsPage() {
  const [{ t, languageCode }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  const content = await loadTermsContent();
  const description = t(
    "legal.terms.meta_description",
    "{SYSTEM_NAME} lietošanas noteikumi: konts, komandas dati, maksājumi, pieļaujamā lietošana, atbildība un piemērojamie tiesību akti.",
    { SYSTEM_NAME: systemName },
  );

  return (
    <>
      <PublicPageJsonLd
        path="/terms"
        title={content.title}
        description={description}
        languageCode={languageCode}
        breadcrumbs={[
          { name: t("nav.home", "Sākums"), path: "/" },
          { name: content.title, path: "/terms" },
        ]}
      />
      <LegalDocumentView content={content} />
    </>
  );
}
