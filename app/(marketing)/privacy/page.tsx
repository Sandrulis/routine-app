import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getPrivacyPolicyContent } from "@/app/lib/legal/documents";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return {
    title: t("legal.privacy.title", "Privātuma politika"),
  };
}

export default async function PrivacyPage() {
  const { t } = await getServerTranslations();
  return <LegalDocumentView content={getPrivacyPolicyContent(t)} />;
}
