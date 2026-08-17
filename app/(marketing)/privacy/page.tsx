"use client";

import { LegalDocumentView } from "@/app/components/legal-document-view";
import { useTranslations } from "@/app/components/translations-provider";
import { getPrivacyPolicyContent } from "@/app/lib/legal/documents";

export default function PrivacyPage() {
  const { t } = useTranslations();
  return <LegalDocumentView content={getPrivacyPolicyContent(t)} />;
}
