import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getTermsContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/terms", {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
    description: t(
      "legal.terms.intro",
      "Šie noteikumi regulē {SYSTEM_NAME} vietnes, lietotnes un Chrome Gmail spraudņa lietošanu. Reģistrējoties, ienākot ar e-pastu vai OAuth (Google/Microsoft), tu apstiprini, ka esi tos izlasījis un piekrīti. Ja nepiekrīti, lūdzu, nelieto pakalpojumu.",
    ),
  });
}

export default async function TermsPage() {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  return (
    <LegalDocumentView
      content={getTermsContent(t, {
        legalEmail: settings.legalEmail,
        legalEntityName: settings.legalEntityName,
        legalEntityRegNo: settings.legalEntityRegNo,
        legalEntityAddress: settings.legalEntityAddress,
      })}
    />
  );
}
