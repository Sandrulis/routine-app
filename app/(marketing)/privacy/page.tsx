import type { Metadata } from "next";
import { LegalDocumentView } from "@/app/components/legal-document-view";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { getPrivacyPolicyContent } from "@/app/lib/legal/documents";
import { canonicalMetadata } from "@/app/lib/seo/metadata";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerTranslations();
  return canonicalMetadata("/privacy", {
    title: t("legal.privacy.title", "Privātuma politika"),
    description: t(
      "legal.privacy.intro",
      "Šajā politikā skaidrojam, kādus personas datus apstrādājam, kad tu apmeklē vietni routine.app vai izmanto Routine lietotni, kāpēc to darām un kādas ir tavas tiesības saskaņā ar Vispārīgo datu aizsardzības regulu (ES) 2016/679 (VDAR).",
    ),
  });
}

export default async function PrivacyPage() {
  const { t } = await getServerTranslations();
  return <LegalDocumentView content={getPrivacyPolicyContent(t)} />;
}
