import { deleteCookie, readCookie, writeCookie } from "@/app/lib/cookies";
import {
  COOKIE_CONSENT_COOKIE,
  COOKIE_CONSENT_MAX_AGE_DAYS,
  PREFERENCE_COOKIE_NAMES,
  parseCookieConsent,
  serializeCookieConsent,
  type CookieConsentState,
} from "@/app/lib/consent/cookie-consent";

export function readCookieConsentState(): CookieConsentState | null {
  return parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
}

export function writeCookieConsentState(state: CookieConsentState) {
  writeCookie(
    COOKIE_CONSENT_COOKIE,
    serializeCookieConsent(state),
    COOKIE_CONSENT_MAX_AGE_DAYS * 24 * 60 * 60,
  );
}

export function purgePreferenceCookies() {
  for (const name of PREFERENCE_COOKIE_NAMES) {
    deleteCookie(name);
  }
}
