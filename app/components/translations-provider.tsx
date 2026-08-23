"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { DEFAULT_SYSTEM_NAME } from "@/app/lib/document-title";
import { interpolate, withSystemNameParams } from "@/app/lib/i18n/interpolate";
import {
  DEFAULT_LANGUAGE,
  type LanguageCode,
  type UiLanguageOption,
} from "@/app/lib/i18n/language";

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

type TranslationsContextValue = {
  languageCode: LanguageCode;
  languages: UiLanguageOption[];
  t: TranslateFn;
};

const TranslationsContext = createContext<TranslationsContextValue | null>(null);

export function TranslationsProvider({
  languageCode = DEFAULT_LANGUAGE,
  overlay = {},
  table = {},
  languages = [],
  systemName = DEFAULT_SYSTEM_NAME,
  children,
}: {
  languageCode?: LanguageCode;
  overlay?: Record<string, string>;
  table?: Record<string, string>;
  languages?: UiLanguageOption[];
  systemName?: string;
  children: ReactNode;
}) {
  const value = useMemo<TranslationsContextValue>(() => {
    return {
      languageCode,
      languages,
      t(key, fallback, params) {
        const fromOverlay = overlay[key]?.trim();
        return interpolate(
          fromOverlay || table[key] || fallback,
          withSystemNameParams(systemName, params),
        );
      },
    };
  }, [languageCode, languages, overlay, systemName, table]);

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (!context) {
    throw new Error("useTranslations must be used within TranslationsProvider");
  }
  return context;
}
