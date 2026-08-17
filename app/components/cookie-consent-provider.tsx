"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CookieConsentContext,
  type CookieConsentContextValue,
} from "@/app/components/cookie-consent-context";
import { CookieConsentDialog } from "@/app/components/cookie-consent-dialog";
import {
  purgePreferenceCookies,
  readCookieConsentState,
  writeCookieConsentState,
} from "@/app/lib/consent/client";
import {
  createCookieConsentState,
  DENIED_COOKIE_CONSENT_SELECTION,
  GRANTED_COOKIE_CONSENT_SELECTION,
  isCookieCategoryAllowed,
  type CookieConsentSelection,
  type CookieConsentState,
} from "@/app/lib/consent/cookie-consent";

export { useCookieConsent } from "@/app/components/cookie-consent-context";

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [consent, setConsent] = useState<CookieConsentState | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(readCookieConsentState());
    setIsReady(true);
  }, []);

  const saveConsent = useCallback((selection: CookieConsentSelection) => {
    const nextConsent = createCookieConsentState(selection);
    writeCookieConsentState(nextConsent);

    if (!selection.preferences) {
      purgePreferenceCookies();
    }

    setConsent(nextConsent);
    setIsSettingsOpen(false);
  }, []);

  const value = useMemo<CookieConsentContextValue>(
    () => ({
      isReady,
      consent,
      hasDecision: consent !== null,
      isAllowed: (category) => isCookieCategoryAllowed(consent, category),
      isSettingsOpen,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
      saveConsent,
      acceptAll: () => saveConsent(GRANTED_COOKIE_CONSENT_SELECTION),
      rejectAll: () => saveConsent(DENIED_COOKIE_CONSENT_SELECTION),
    }),
    [consent, isReady, isSettingsOpen, saveConsent],
  );

  return (
    <CookieConsentContext.Provider value={value}>
      {children}
      <CookieConsentDialog />
    </CookieConsentContext.Provider>
  );
}
