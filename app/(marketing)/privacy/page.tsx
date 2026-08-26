import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getPrivacyPolicyContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/privacy", {
    title: t("legal.privacy.title", "Privātuma politika"),
    description: t(
      "legal.privacy.intro",
      "Šajā politikā skaidrojam, kādus personas datus apstrādājam, kad tu izmanto {SYSTEM_NAME}, kāpēc to darām, ar ko datus kopīgojam un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).",
    ),
  });
}

export default async function PrivacyPage() {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  return (
    <LegalDocumentView
      content={getPrivacyPolicyContent(t, {
        legalEmail: settings.legalEmail,
        legalEntityName: settings.legalEntityName,
        legalEntityRegNo: settings.legalEntityRegNo,
        legalEntityAddress: settings.legalEntityAddress,
      })}
    />
  );
}
