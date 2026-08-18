export type LanguageCode = "lv" | "en" | "ru";

export const DEFAULT_LANGUAGE: LanguageCode = "lv";

export const LANGUAGE_COOKIE = "routine-app-language";

export const LANGUAGE_CHOSEN_COOKIE = "routine-app-language-chosen";

export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function languageCookieOptions() {
  return {
    path: "/",
    maxAge: LANGUAGE_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
  };
}

export function hasExplicitLanguageChoice(
  chosenValue: string | null | undefined,
): boolean {
  return chosenValue === "1";
}

export type UiLanguageOption = {
  code: LanguageCode;
  name: string;
};

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
