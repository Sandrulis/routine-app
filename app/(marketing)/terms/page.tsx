import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getTermsContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/terms", {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
    description: t(
      "legal.terms.intro",
      "Šie noteikumi regulē Routine vietnes un lietotnes lietošanu. Reģistrējoties vai ienākot, tu apstiprini, ka esi tos izlasījis un piekrīti. Ja nepiekrīti, lūdzu, nelieto pakalpojumu.",
    ),
  });
}

export default async function TermsPage() {
  const { t } = await getServerTranslations();
  return <LegalDocumentView content={getTermsContent(t)} />;
}
