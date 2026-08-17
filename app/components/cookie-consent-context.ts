"use client";

import { createContext, useContext } from "react";
import type {
  CookieConsentCategory,
  CookieConsentSelection,
  CookieConsentState,
} from "@/app/lib/consent/cookie-consent";

export type CookieConsentContextValue = {
  isReady: boolean;
  consent: CookieConsentState | null;
  hasDecision: boolean;
  isAllowed: (category: CookieConsentCategory) => boolean;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  saveConsent: (selection: CookieConsentSelection) => void;
  acceptAll: () => void;
  rejectAll: () => void;
};

export const CookieConsentContext =
  createContext<CookieConsentContextValue | null>(null);

export function useCookieConsent(): CookieConsentContextValue {
  const value = useContext(CookieConsentContext);

  if (!value) {
    throw new Error(
      "useCookieConsent must be used inside CookieConsentProvider",
    );
  }

  return value;
}
