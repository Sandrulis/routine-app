import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  LANGUAGE_CODES,
  type LanguageCode,
} from "@/app/lib/i18n/language";

/** Request header set by `proxy.ts` from the public locale prefix. */
export const UI_LANGUAGE_HEADER = "x-ui-language";

/** Public paths that get indexable language URLs. App routes stay unprefixed. */
export const PUBLIC_LOCALIZED_PATHS = [
  "/",
  "/privacy",
  "/terms",
  "/cookies",
  "/login",
  "/signup",
] as const;

const OG_LOCALE: Record<LanguageCode, string> = {
  lv: "lv_LV",
  en: "en_US",
  ru: "ru_RU",
  de: "de_DE",
  fr: "fr_FR",
  es: "es_ES",
  nl: "nl_NL",
  da: "da_DK",
  no: "nb_NO",
  fi: "fi_FI",
  pl: "pl_PL",
  lt: "lt_LT",
  et: "et_EE",
  it: "it_IT",
  sv: "sv_SE",
};

/**
 * Public URL stays `/no`. Bokmål SEO uses `nb-NO` (HTML/hreflang) and `nb_NO` (Open Graph).
 */
const HTML_LANG: Record<LanguageCode, string> = {
  lv: "lv",
  en: "en",
  ru: "ru",
  de: "de",
  fr: "fr",
  es: "es",
  nl: "nl",
  da: "da",
  no: "nb-NO",
  fi: "fi",
  pl: "pl",
  lt: "lt",
  et: "et",
  it: "it",
  sv: "sv",
};

export function htmlLang(code: LanguageCode): string {
  return HTML_LANG[code];
}

export function hreflangValue(code: LanguageCode): string {
  return HTML_LANG[code];
}

export function ogLocale(languageCode: LanguageCode): string {
  return OG_LOCALE[languageCode];
}

export function ogAlternateLocales(languageCode: LanguageCode): string[] {
  const current = ogLocale(languageCode);
  return LANGUAGE_CODES.map((code) => OG_LOCALE[code]).filter(
    (locale) => locale !== current,
  );
}

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function stripLocalePrefix(pathname: string): string {
  const normalized = normalizePathname(pathname);
  const segments = normalized.split("/").filter(Boolean);
  const first = segments[0];
  if (first && isLanguageCode(first)) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return normalized;
}

export function localePath(pathname: string, languageCode: LanguageCode): string {
  const base = stripLocalePrefix(pathname);
  if (languageCode === DEFAULT_LANGUAGE) return base;
  if (base === "/") return `/${languageCode}`;
  return `/${languageCode}${base}`;
}

export function isPublicLocalizedPath(pathname: string): boolean {
  const base = stripLocalePrefix(pathname);
  if ((PUBLIC_LOCALIZED_PATHS as readonly string[]).includes(base)) return true;
  return base === "/docs" || base.startsWith("/docs/");
}

export function urlLanguageFromPath(pathname: string): LanguageCode | null {
  const normalized = normalizePathname(pathname);
  const first = normalized.split("/").filter(Boolean)[0];
  if (first && isLanguageCode(first)) return first;
  return null;
}

export function hreflangMap(
  path: string,
  toAbsoluteUrl: (path: string) => string,
): Record<string, string> {
  const base = stripLocalePrefix(path);
  const languages: Record<string, string> = {
    "x-default": toAbsoluteUrl(localePath(base, DEFAULT_LANGUAGE)),
  };
  for (const code of LANGUAGE_CODES) {
    languages[hreflangValue(code)] = toAbsoluteUrl(localePath(base, code));
  }
  return languages;
}
