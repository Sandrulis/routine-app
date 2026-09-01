import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
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
  const content = await loadTermsContent();
  return canonicalMetadata("/terms", {
    title: content.title,
    description: content.intro,
  });
}

export default async function TermsPage() {
  const content = await loadTermsContent();
  return <LegalDocumentView content={content} />;
}
