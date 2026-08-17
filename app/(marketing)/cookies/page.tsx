"use client";

import { CookieSettingsLink } from "@/app/components/cookie-settings-link";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { useTranslations } from "@/app/components/translations-provider";
import { getCookiePolicyContent } from "@/app/lib/legal/documents";

export default function CookiesPage() {
  const { t } = useTranslations();
  return (
    <LegalDocumentView
      content={getCookiePolicyContent(t)}
      extra={<CookieSettingsLink />}
    />
  );
}
