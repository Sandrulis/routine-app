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
          sendDefaultPii: false,
          beforeSend(event) {
            if (event.user) {
              delete event.user.email;
              delete event.user.ip_address;
              delete event.user.username;
            }
            const extra = event.extra;
            if (extra) {
              for (const [key, value] of Object.entries(extra)) {
                if (typeof value === "string") {
                  extra[key] = value
                    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
                    .replace(/eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9._-]+/g, "[redacted-jwt]");
                }
              }
            }
            return event;
          },
        });
      } catch (error) {
        console.error("Sentry init failed:", error);
      }
    })();
  }, [dsn, environment]);

  return null;
}
