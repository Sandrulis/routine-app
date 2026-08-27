export const LANGUAGE_CODES = [
  "lv",
  "en",
  "ru",
  "de",
  "fr",
  "es",
  "nl",
  "da",
  "no",
  "fi",
  "pl",
  "lt",
  "et",
  "it",
  "sv",
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const DEFAULT_LANGUAGE: LanguageCode = "lv";

export const LANGUAGE_COOKIE = "routine-app-language";

export const LANGUAGE_CHOSEN_COOKIE = "routine-app-language-chosen";

export const LANGUAGE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const LANGUAGE_CODE_SET = new Set<string>(LANGUAGE_CODES);

export const NATIVE_LANGUAGE_NAMES: Record<LanguageCode, string> = {
  lv: "Latviešu",
  en: "English",
  ru: "Русский",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  nl: "Nederlands",
  da: "Dansk",
  no: "Norsk bokmål",
  fi: "Suomi",
  pl: "Polski",
  lt: "Lietuvių",
  et: "Eesti",
  it: "Italiano",
  sv: "Svenska",
};

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
  isDefault?: boolean;
};

const LANGUAGE_FLAG_REGIONS: Record<LanguageCode, string> = {
  lv: "LV",
  en: "GB",
  ru: "RU",
  de: "DE",
  fr: "FR",
  es: "ES",
  nl: "NL",
  da: "DK",
  no: "NO",
  fi: "FI",
  pl: "PL",
  lt: "LT",
  et: "EE",
  it: "IT",
  sv: "SE",
};

export function languageFlagEmoji(code: LanguageCode): string {
  const region = LANGUAGE_FLAG_REGIONS[code];
  const first = region.codePointAt(0);
  const second = region.codePointAt(1);
  if (first == null || second == null) return "🌐";
  return String.fromCodePoint(0x1f1e6 + first - 65, 0x1f1e6 + second - 65);
}

export function sortSwitcherLanguages(
  languages: UiLanguageOption[],
): UiLanguageOption[] {
  const defaultLanguage =
    languages.find((language) => language.isDefault) ??
    languages.find((language) => language.code === DEFAULT_LANGUAGE);
  const rest = languages
    .filter((language) => language.code !== defaultLanguage?.code)
    .slice()
    .sort((left, right) =>
      left.name.localeCompare(right.name, defaultLanguage?.code ?? DEFAULT_LANGUAGE, {
        sensitivity: "base",
      }),
    );
  return defaultLanguage ? [defaultLanguage, ...rest] : rest;
}

export const SUPPORTED_LANGUAGES: {
  code: LanguageCode;
  nameKey: string;
  nameFallback: string;
}[] = LANGUAGE_CODES.map((code) => ({
  code,
  nameKey: `lang.${code}`,
  nameFallback: NATIVE_LANGUAGE_NAMES[code],
}));

export function isLanguageCode(
  value: string | null | undefined,
): value is LanguageCode {
  return !!value && LANGUAGE_CODE_SET.has(value);
}

export function resolveLanguageCode(
  value: string | null | undefined,
): LanguageCode {
  return isLanguageCode(value) ? value : DEFAULT_LANGUAGE;
}

const ACCEPT_LANGUAGE_ALIASES: Record<string, LanguageCode> = {
  nb: "no",
  nn: "no",
};

const LANGUAGE_NEGOTIATION_BOT_RE =
  /googlebot|adsbot-google|bingbot|yandex(?:bot|images)|baiduspider|duckduckbot|slurp|facebookexternalhit|linkedinbot|twitterbot|applebot|semrushbot|ahrefsbot/i;

export function isLanguageNegotiationBot(
  userAgent: string | null | undefined,
): boolean {
  return !!userAgent && LANGUAGE_NEGOTIATION_BOT_RE.test(userAgent);
}

function allowedLanguageSet(codes: Iterable<string>): Set<LanguageCode> {
  const allowed = new Set<LanguageCode>();
  for (const code of codes) {
    if (isLanguageCode(code)) allowed.add(code);
  }
  return allowed;
}

function languageFromAcceptTag(
  tag: string,
  allowed: Set<LanguageCode>,
): LanguageCode | null {
  if (tag === "*") return null;
  const lowered = tag.trim().toLowerCase();
  if (!lowered) return null;
  if (isLanguageCode(lowered) && allowed.has(lowered)) return lowered;
  const primary = lowered.split("-")[0] ?? "";
  const aliased = ACCEPT_LANGUAGE_ALIASES[primary];
  if (aliased && allowed.has(aliased)) return aliased;
  if (isLanguageCode(primary) && allowed.has(primary)) return primary;
  return null;
}

export function matchAcceptLanguage(
  header: string | null | undefined,
  allowedCodes: Iterable<string> = LANGUAGE_CODES,
): LanguageCode | null {
  const allowed = allowedLanguageSet(allowedCodes);
  if (allowed.size === 0 || !header?.trim()) return null;

  const ranked = header.split(",").flatMap((part) => {
    const [rawTag, ...params] = part.trim().split(";");
    const tag = rawTag?.trim().toLowerCase();
    if (!tag) return [];
    let q = 1;
    for (const param of params) {
      const [key, value] = param.trim().split("=");
      if (key?.trim() !== "q" || !value) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed)) q = parsed;
    }
    if (q <= 0) return [];
    return [{ tag, q }];
  });
  ranked.sort((left, right) => right.q - left.q);

  for (const { tag } of ranked) {
    const matched = languageFromAcceptTag(tag, allowed);
    if (matched) return matched;
  }
  return null;
}

export function resolveGuestLanguage(input: {
  acceptLanguage: string | null | undefined;
  cookieLanguage: string | null | undefined;
  chosenCookie: string | null | undefined;
  allowedCodes?: Iterable<string>;
}): LanguageCode | null {
  const allowed = allowedLanguageSet(input.allowedCodes ?? LANGUAGE_CODES);
  if (
    hasExplicitLanguageChoice(input.chosenCookie) &&
    isLanguageCode(input.cookieLanguage) &&
    allowed.has(input.cookieLanguage)
  ) {
    return input.cookieLanguage;
  }
  return matchAcceptLanguage(input.acceptLanguage, allowed);
}
