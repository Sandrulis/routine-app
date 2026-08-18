"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  DEFAULT_LANGUAGE,
  interpolate,
  messages,
  type LanguageCode,
} from "@/app/lib/i18n/messages";

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

type TranslationsContextValue = {
  languageCode: LanguageCode;
  t: TranslateFn;
};

const TranslationsContext = createContext<TranslationsContextValue | null>(null);

export function TranslationsProvider({
  languageCode = DEFAULT_LANGUAGE,
  overlay = {},
  children,
}: {
  languageCode?: LanguageCode;
  overlay?: Record<string, string>;
  children: ReactNode;
}) {
  const value = useMemo<TranslationsContextValue>(() => {
    const table = messages[languageCode] ?? messages[DEFAULT_LANGUAGE];

    return {
      languageCode,
      t(key, fallback, params) {
        const fromOverlay = overlay[key]?.trim();
        return interpolate(fromOverlay || table[key] || fallback, params);
      },
    };
  }, [languageCode, overlay]);

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
