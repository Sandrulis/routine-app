"use client";

import { useEffect, useRef } from "react";
import { useCookieConsent } from "@/app/components/cookie-consent-provider";

type UmamiAnalyticsProps = {
  websiteId: string;
  scriptSrc: string;
};

const SCRIPT_ATTR = "data-routine-umami";

export function UmamiAnalytics({ websiteId, scriptSrc }: UmamiAnalyticsProps) {
  const { isReady, isAllowed } = useCookieConsent();
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!isReady || !isAllowed("analytics") || loadedRef.current) {
      return;
    }
    if (document.querySelector(`script[${SCRIPT_ATTR}]`)) {
      loadedRef.current = true;
      return;
    }

    const script = document.createElement("script");
    script.defer = true;
    script.src = scriptSrc;
    script.setAttribute("data-website-id", websiteId);
    script.setAttribute(SCRIPT_ATTR, "1");
    document.head.appendChild(script);
    loadedRef.current = true;
  }, [isReady, isAllowed, websiteId, scriptSrc]);

  return null;
}
