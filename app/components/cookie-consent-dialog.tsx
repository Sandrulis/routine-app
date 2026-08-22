"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useCookieConsent } from "@/app/components/cookie-consent-context";
import { useTranslations } from "@/app/components/translations-provider";
import {
  DENIED_COOKIE_CONSENT_SELECTION,
  OPTIONAL_COOKIE_CONSENT_CATEGORIES,
  type CookieConsentSelection,
  type OptionalCookieConsentCategory,
} from "@/app/lib/consent/cookie-consent";

type CategoryMeta = {
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
};

const OPTIONAL_CATEGORY_META: Record<
  OptionalCookieConsentCategory,
  CategoryMeta
> = {
  preferences: {
    titleKey: "cookie_consent.category.preferences.title",
    titleFallback: "Preferenču sīkdatnes",
    descriptionKey: "cookie_consent.category.preferences.description",
    descriptionFallback:
      "Atceras tavas izvēles saskarnē, piemēram, saraksta logu kārtību.",
  },
  analytics: {
    titleKey: "cookie_consent.category.analytics.title",
    titleFallback: "Statistikas sīkdatnes",
    descriptionKey: "cookie_consent.category.analytics.description",
    descriptionFallback:
      "Ļauj anonīmi mērīt lietojumu (Umami), ja administrators to ir ieslēdzis.",
  },
  marketing: {
    titleKey: "cookie_consent.category.marketing.title",
    titleFallback: "Mārketinga sīkdatnes",
    descriptionKey: "cookie_consent.category.marketing.description",
    descriptionFallback:
      "Ļauj rādīt personalizētu saturu. Šobrīd netiek izmantota neviena mārketinga sīkdatne.",
  },
};

function ConsentSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function PolicyLinks() {
  const { t } = useTranslations();

  return (
    <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
      <Link
        href="/cookies"
        className="font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-950"
      >
        {t("legal.cookies.title", "Sīkdatņu politika")}
      </Link>
      <Link
        href="/privacy"
        className="font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-950"
      >
        {t("legal.privacy.title", "Privātuma politika")}
      </Link>
    </span>
  );
}

function CookieConsentBanner() {
  const { t } = useTranslations();
  const { acceptAll, rejectAll, openSettings } = useCookieConsent();

  return (
    <div
      role="region"
      aria-label={t("cookie_consent.banner.title", "Mēs izmantojam sīkdatnes")}
      className="fixed inset-x-0 bottom-0 z-[80] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_18px_50px_rgba(24,24,27,0.18)] sm:p-6">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500"
            aria-hidden="true"
          >
            <i className="fas fa-cookie-bite" />
          </span>
          <div className="min-w-0">
            <p className="text-base font-semibold tracking-[-0.02em] text-zinc-950">
              {t("cookie_consent.banner.title", "Mēs izmantojam sīkdatnes")}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {t(
                "cookie_consent.banner.description",
                "Obligātās sīkdatnes ir nepieciešamas, lai sistēma darbotos. Preferenču, statistikas un mārketinga sīkdatnes izmantojam tikai ar tavu piekrišanu.",
              )}
            </p>
            <p className="mt-2 text-sm text-zinc-500">
              <PolicyLinks />
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={openSettings}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {t("cookie_consent.banner.customize", "Pielāgot")}
          </button>
          <button
            type="button"
            onClick={rejectAll}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
          >
            {t("cookie_consent.actions.reject_all", "Atteikt neobligātās")}
          </button>
          <button
            type="button"
            onClick={acceptAll}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            {t("cookie_consent.actions.accept_all", "Piekrist visām")}
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieConsentSettings() {
  const { t } = useTranslations();
  const { consent, closeSettings, saveConsent, acceptAll, rejectAll } =
    useCookieConsent();
  const titleId = useId();
  const descriptionId = useId();
  const [selection, setSelection] = useState<CookieConsentSelection>(
    () => consent?.categories ?? DENIED_COOKIE_CONSENT_SELECTION,
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeSettings();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSettings]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className="absolute inset-0 bg-zinc-900/40"
        aria-hidden="true"
        onMouseDown={closeSettings}
      />
      <div className="relative max-h-[calc(100%-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
                {t("cookie_consent.settings.title", "Sīkdatņu iestatījumi")}
              </h2>
              <p id={descriptionId} className="mt-1 text-sm text-zinc-500">
                {t(
                  "cookie_consent.settings.description",
                  "Izvēlies, kuras sīkdatņu kategorijas atļaut. Izvēli vari mainīt jebkurā laikā.",
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={closeSettings}
              aria-label={t("actions.close", "Aizvērt")}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            >
              <i className="fas fa-times" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {t(
                    "cookie_consent.category.necessary.title",
                    "Obligātās sīkdatnes",
                  )}
                </p>
                <span className="shrink-0 rounded-full bg-zinc-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600">
                  {t("cookie_consent.settings.always_on", "Vienmēr ieslēgtas")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                {t(
                  "cookie_consent.category.necessary.description",
                  "Nodrošina drošību un tavas piekrišanas saglabāšanu. Bez tām sistēma nedarbojas.",
                )}
              </p>
            </div>

            {OPTIONAL_COOKIE_CONSENT_CATEGORIES.map((category) => {
              const meta = OPTIONAL_CATEGORY_META[category];
              const title = t(meta.titleKey, meta.titleFallback);

              return (
                <div
                  key={category}
                  className="rounded-xl border border-zinc-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-semibold text-zinc-900">
                      {title}
                    </p>
                    <ConsentSwitch
                      checked={selection[category]}
                      label={title}
                      onChange={(checked) =>
                        setSelection((current) => ({
                          ...current,
                          [category]: checked,
                        }))
                      }
                    />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">
                    {t(meta.descriptionKey, meta.descriptionFallback)}
                  </p>
                </div>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-zinc-500">
            <PolicyLinks />
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={rejectAll}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              {t("cookie_consent.actions.reject_all", "Atteikt neobligātās")}
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
            >
              {t("cookie_consent.actions.accept_all", "Piekrist visām")}
            </button>
            <button
              type="button"
              onClick={() => saveConsent(selection)}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              {t("cookie_consent.actions.save", "Saglabāt izvēli")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookieConsentDialog() {
  const { isReady, hasDecision, isSettingsOpen } = useCookieConsent();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isReady) {
    return null;
  }

  if (isSettingsOpen) {
    return createPortal(<CookieConsentSettings />, document.body);
  }

  if (hasDecision) {
    return null;
  }

  return createPortal(<CookieConsentBanner />, document.body);
}
