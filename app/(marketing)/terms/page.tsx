"use client";

import { LegalDocumentView } from "@/app/components/legal-document-view";
import { useTranslations } from "@/app/components/translations-provider";
import { getTermsContent } from "@/app/lib/legal/documents";

export default function TermsPage() {
  const { t } = useTranslations();
  return <LegalDocumentView content={getTermsContent(t)} />;
}
