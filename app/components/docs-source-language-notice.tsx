"use client";

import { useTranslations } from "@/app/components/translations-provider";
import {
  DEFAULT_LANGUAGE,
  NATIVE_LANGUAGE_NAMES,
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

export function DocsSourceLanguageCode() {
  const language = useDocsSourceLanguage();
  return (
    <span className="ml-1 font-mono text-xs uppercase text-zinc-400">({language.code})</span>
  );
}

export function DocsSourceLanguageNotice() {
  const { t } = useTranslations();
  const language = useDocsSourceLanguage();

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {t("common.language", "Valoda")}
      </p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white">
        <span>{language.name}</span>
        <span className="font-mono text-[11px] uppercase text-zinc-300">{language.code}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-zinc-500">
        {t(
          "admin.docs.source_language",
          "Saturs tiek pievienots valodā {name} ({code}). Vēlāk šis teksts tiks tulkots pārējās valodās.",
          { name: language.name, code: language.code },
        )}
      </p>
    </div>
  );
}
