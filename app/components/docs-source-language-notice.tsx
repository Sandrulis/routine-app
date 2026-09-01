"use client";

import { useTranslations } from "@/app/components/translations-provider";
import {
  DEFAULT_LANGUAGE,
  NATIVE_LANGUAGE_NAMES,
  type LanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";

export function useDocsSourceLanguage(): UiLanguageOption {
  const { languages } = useTranslations();
  return (
    languages.find((language) => language.isDefault) ??
    languages.find((language) => language.code === DEFAULT_LANGUAGE) ??
    languages[0] ?? {
      code: DEFAULT_LANGUAGE,
      name: NATIVE_LANGUAGE_NAMES[DEFAULT_LANGUAGE],
      isDefault: true,
    }
  );
}

export function DocsLanguageCode({ code }: { code: string }) {
  return (
    <span className="ml-1 font-mono text-xs uppercase text-zinc-400">({code})</span>
  );
}

export function DocsLanguageTabs({
  value,
  onChange,
  disabled = false,
  imagesShared = false,
}: {
  value: string;
  onChange: (code: LanguageCode) => void;
  disabled?: boolean;
  imagesShared?: boolean;
}) {
  const { t, languages } = useTranslations();
  const source = useDocsSourceLanguage();
  if (languages.length <= 1) return null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {t("common.language", "Valoda")}
      </p>
      <div
        role="tablist"
        aria-label={t("admin.nav.languages", "Valodas")}
        className="mt-2 flex flex-wrap gap-2"
      >
        {languages.map((language) => {
          const active = language.code === value;
          return (
            <button
              key={language.code}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(language.code)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                active
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
              }`}
            >
              <span>{language.name}</span>
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
      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {t(
          "admin.docs.translations_help",
          "Teksts nāk no {name} ({code}). Pārslēdz valodu un pielabo tulkojumu.",
          { name: source.name, code: source.code },
        )}
        {imagesShared
          ? ` ${t("admin.docs.images.shared", "Attēli visām valodām ir kopīgi.")}`
          : ""}
      </p>
    </div>
  );
}
