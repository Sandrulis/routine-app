export type LanguageCode = "lv" | "en" | "ru";

export const DEFAULT_LANGUAGE: LanguageCode = "lv";

export const LANGUAGE_COOKIE = "routine-app-language";

export const SUPPORTED_LANGUAGES: { code: LanguageCode; nameKey: string; nameFallback: string }[] =
  [
    { code: "lv", nameKey: "lang.lv", nameFallback: "Latviešu" },
    { code: "en", nameKey: "lang.en", nameFallback: "English" },
    { code: "ru", nameKey: "lang.ru", nameFallback: "Русский" },
  ];

export function isLanguageCode(value: string | null | undefined): value is LanguageCode {
  return value === "lv" || value === "en" || value === "ru";
}

export function resolveLanguageCode(value: string | null | undefined): LanguageCode {
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE;
}
