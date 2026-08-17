export const COOKIE_CONSENT_COOKIE = "routine-app-cookie-consent";

export const COOKIE_CONSENT_VERSION = 1;

export const COOKIE_CONSENT_MAX_AGE_DAYS = 180;

export const COOKIE_CONSENT_CATEGORIES = [
  "necessary",
  "preferences",
  "analytics",
  "marketing",
] as const;

export type CookieConsentCategory = (typeof COOKIE_CONSENT_CATEGORIES)[number];

export const OPTIONAL_COOKIE_CONSENT_CATEGORIES = [
  "preferences",
  "analytics",
  "marketing",
] as const;

export type OptionalCookieConsentCategory =
  (typeof OPTIONAL_COOKIE_CONSENT_CATEGORIES)[number];

export type CookieConsentSelection = Record<
  OptionalCookieConsentCategory,
  boolean
>;

export type CookieConsentState = {
  version: number;
  updatedAt: string;
  categories: CookieConsentSelection;
};

export const DENIED_COOKIE_CONSENT_SELECTION: CookieConsentSelection = {
  preferences: false,
  analytics: false,
  marketing: false,
};

export const GRANTED_COOKIE_CONSENT_SELECTION: CookieConsentSelection = {
  preferences: true,
  analytics: true,
  marketing: true,
};

export function createCookieConsentState(
  selection: CookieConsentSelection,
): CookieConsentState {
  return {
    version: COOKIE_CONSENT_VERSION,
    updatedAt: new Date().toISOString(),
    categories: { ...selection },
  };
}

export function serializeCookieConsent(state: CookieConsentState): string {
  return JSON.stringify({
    v: state.version,
    ts: state.updatedAt,
    c: state.categories,
  });
}

function readSelectionFlag(source: unknown, key: string): boolean {
  if (!source || typeof source !== "object") {
    return false;
  }

  return (source as Record<string, unknown>)[key] === true;
}

export function parseCookieConsent(
  raw: string | null | undefined,
): CookieConsentState | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const record = parsed as Record<string, unknown>;
    if (record.v !== COOKIE_CONSENT_VERSION) {
      return null;
    }

    const categories = record.c;

    return {
      version: COOKIE_CONSENT_VERSION,
      updatedAt: typeof record.ts === "string" ? record.ts : "",
      categories: {
        preferences: readSelectionFlag(categories, "preferences"),
        analytics: readSelectionFlag(categories, "analytics"),
        marketing: readSelectionFlag(categories, "marketing"),
      },
    };
  } catch {
    return null;
  }
}

export function isCookieCategoryAllowed(
  state: CookieConsentState | null,
  category: CookieConsentCategory,
): boolean {
  if (category === "necessary") {
    return true;
  }

  return state?.categories[category] === true;
}

export const PREFERENCE_COOKIE_NAMES = [
  "routine-app-list-window-order",
] as const;

export function isPreferenceCookieName(name: string): boolean {
  return PREFERENCE_COOKIE_NAMES.some((entry) => entry === name);
}
