"use client";

import { useCookieConsent } from "@/app/components/cookie-consent-context";
import { useTranslations } from "@/app/components/translations-provider";

export function CookieSettingsLink() {
  const { t } = useTranslations();
  const { openSettings } = useCookieConsent();

  return (
    <button
      type="button"
      onClick={openSettings}
      className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
    >
      <i className="fas fa-sliders text-xs" aria-hidden="true" />
      {t("cookie_consent.settings.title", "Sīkdatņu iestatījumi")}
    </button>
  );
}
