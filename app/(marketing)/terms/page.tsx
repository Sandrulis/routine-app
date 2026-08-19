import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getTermsContent } from "@/app/lib/legal/documents";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("legal.terms.title", "Lietošanas noteikumi"),
  };
}

export default async function TermsPage() {
  const { t } = await getServerTranslations();
  return <LegalDocumentView content={getTermsContent(t)} />;
}
