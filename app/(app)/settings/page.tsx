"use client";

import { SectionPage } from "@/app/components/section-page";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { useTranslations } from "@/app/components/translations-provider";

export default function SettingsPage() {
  const { t } = useTranslations();

  return (
    <SectionPage
      title={t("nav.settings", "Uzstādījumi")}
      subtitle={t(
        "settings.page.subtitle",
        "Komandas un lietotāja iestatījumi. Šo sadaļu pielāgosi vēlāk.",
      )}
    >
      <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("settings.language.title", "Valoda")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t("settings.language.description", "Lietotnes saskarnes valoda.")}
        </p>
        <div className="mt-4 max-w-sm">
          <LanguageSwitcher variant="stacked" />
        </div>
      </div>
    </SectionPage>
  );
}
