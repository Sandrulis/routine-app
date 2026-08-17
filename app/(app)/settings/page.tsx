"use client";

import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";

export default function SettingsPage() {
  const { t } = useTranslations();

  return (
    <SectionPage
      title={t("settings.page.title", "Uzstādījumi")}
      subtitle={t(
        "settings.page.subtitle",
        "Komandas un lietotāja iestatījumi. Šo sadaļu pielāgosi vēlāk.",
      )}
    >
      <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6 text-sm text-zinc-500">
        {t(
          "settings.page.placeholder",
          "Šeit vēlāk būs valoda, paziņojumi un komandas iestatījumi.",
        )}
      </div>
    </SectionPage>
  );
}
