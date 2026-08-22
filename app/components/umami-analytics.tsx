"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCookieConsent } from "@/app/components/cookie-consent-provider";

type UmamiTracker = {
  track: (payload?: Record<string, unknown>) => void;
};

function getUmami(): UmamiTracker | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { umami?: UmamiTracker }).umami;
}

export function UmamiAnalytics() {
  const { isReady, isAllowed } = useCookieConsent();
  const pathname = usePathname();
  const lastTrackedRef = useRef<string | null>(null);

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
