"use client";

import { useEffect, useRef } from "react";

type SentryInitProps = {
  dsn: string;
  environment: string;
};

export function SentryInit({ dsn, environment }: SentryInitProps) {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || !dsn.trim()) return;
    startedRef.current = true;

    void (async () => {
      try {
        const Sentry = await import("@sentry/browser");
        Sentry.init({
          dsn: dsn.trim(),
          environment: environment.trim() || "production",
          tracesSampleRate: 0.1,
        });
      } catch (error) {
        console.error("Sentry init failed:", error);
      }
    })();
  }, [dsn, environment]);

  return null;
}
