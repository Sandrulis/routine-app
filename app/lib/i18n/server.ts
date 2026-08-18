import { cache } from "react";
import { cookies } from "next/headers";
import { getSiteTranslationDictionary } from "@/app/lib/site-admin/repository";
import {
  DEFAULT_LANGUAGE,
  interpolate,
  messages,
  type LanguageCode,
} from "@/app/lib/i18n/messages";
import { LANGUAGE_COOKIE, resolveLanguageCode } from "@/app/lib/i18n/language";

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

export type ServerTranslations = {
  languageCode: LanguageCode;
  overlay: Record<string, string>;
  t: TranslateFn;
};

export async function getRequestLanguageCode(): Promise<LanguageCode> {
  const cookieStore = await cookies();
  return resolveLanguageCode(cookieStore.get(LANGUAGE_COOKIE)?.value);
}

export const getServerTranslations = cache(async function getServerTranslations(): Promise<ServerTranslations> {
  const languageCode = await getRequestLanguageCode();
  const overlay = await getSiteTranslationDictionary(languageCode);
  const table = messages[languageCode] ?? messages[DEFAULT_LANGUAGE];

  return {
    languageCode,
    overlay,
    t(key, fallback, params) {
      const fromOverlay = overlay[key]?.trim();
      return interpolate(fromOverlay || table[key] || fallback, params);
    },
  };
});
