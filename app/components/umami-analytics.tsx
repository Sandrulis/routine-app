"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCookieConsent } from "@/app/components/cookie-consent-provider";
import type { UmamiPublicConfig } from "@/app/lib/integrations/umami/config";

const SCRIPT_ID = "umami-analytics";

type UmamiTracker = {
  track: (payload?: Record<string, unknown>) => void;
};

function getUmami(): UmamiTracker | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { umami?: UmamiTracker }).umami;
}

function resolveDocumentNonce(): string | undefined {
  for (const script of document.scripts) {
    if (script.nonce) return script.nonce;
  }
  return undefined;
}

function injectUmamiScript({
  websiteId,
  scriptSrc,
  integrity,
}: UmamiPublicConfig) {
  if (document.getElementById(SCRIPT_ID)) return;

  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.src = scriptSrc;
  script.defer = true;
  script.dataset.websiteId = websiteId;
  script.dataset.autoTrack = "false";
  const nonce = resolveDocumentNonce();
  if (nonce) {
    script.nonce = nonce;
  }
  if (integrity) {
    script.integrity = integrity;
    script.crossOrigin = "anonymous";
  }
  document.head.appendChild(script);
}

export function UmamiAnalytics({
  websiteId,
  scriptSrc,
  integrity,
}: UmamiPublicConfig) {
  const { isReady, isAllowed } = useCookieConsent();
  const pathname = usePathname();
  const lastTrackedRef = useRef<string | null>(null);

  useEffect(() => {
    injectUmamiScript({ websiteId, scriptSrc, integrity });
  }, [websiteId, scriptSrc, integrity]);

  useEffect(() => {
    if (!isReady || !isAllowed("analytics")) {
      return;
    }

    let cancelled = false;
    let intervalId = 0;

    const sendPageview = () => {
      if (cancelled || lastTrackedRef.current === pathname) return true;
      const umami = getUmami();
      if (!umami) return false;
      lastTrackedRef.current = pathname;
      umami.track();
      return true;
    };

    if (sendPageview()) {
      return;
    }

    intervalId = window.setInterval(() => {
      if (sendPageview() || cancelled) {
        window.clearInterval(intervalId);
      }
    }, 50);

    const timeoutId = window.setTimeout(() => {
      window.clearInterval(intervalId);
    }, 8000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [isReady, isAllowed, pathname]);

  return null;
}
