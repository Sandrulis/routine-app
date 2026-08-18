"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/app/components/translations-provider";
import { setLanguageAction } from "@/app/lib/i18n/actions";
import {
  SUPPORTED_LANGUAGES,
  type LanguageCode,
} from "@/app/lib/i18n/language";

export function LanguageSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "stacked";
}) {
  const router = useRouter();
  const { languageCode, t } = useTranslations();
  const [pending, startTransition] = useTransition();

  function switchLanguage(next: LanguageCode) {
    if (next === languageCode) return;
    startTransition(async () => {
      await setLanguageAction(next);
      router.refresh();
    });
  }

  if (variant === "stacked") {
    return (
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={t("settings.language.title", "Valoda")}>
        {SUPPORTED_LANGUAGES.map((language) => {
          const active = language.code === languageCode;
          return (
            <button
              key={language.code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              onClick={() => switchLanguage(language.code)}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="font-medium">
                {t(language.nameKey, language.nameFallback)}
              </span>
              <span
                className={`font-mono text-[11px] uppercase ${
                  active ? "text-zinc-300" : "text-zinc-400"
                }`}
              >
                {language.code}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5"
      role="radiogroup"
      aria-label={t("settings.language.title", "Valoda")}
    >
      {SUPPORTED_LANGUAGES.map((language) => {
        const active = language.code === languageCode;
        return (
          <button
            key={language.code}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={pending}
            onClick={() => switchLanguage(language.code)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {language.code}
          </button>
        );
      })}
    </div>
  );
}
