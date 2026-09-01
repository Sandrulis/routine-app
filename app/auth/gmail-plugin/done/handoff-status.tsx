"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";

const READY_ATTR = "data-routine-plugin-ready";
const CLOSE_AFTER_SEC = 5;

function pluginPageIsReady() {
  return document.documentElement.getAttribute(READY_ATTR) === "1";
}

function requestPluginTabClose() {
  document.documentElement.setAttribute("data-routine-plugin-close", "1");
  window.postMessage(
    { source: "routine-gmail-plugin", type: "close" },
    window.location.origin,
  );
  window.close();
}

export function GmailPluginHandoffBody({
  waiting,
  ready,
}: {
  waiting: string;
  ready: string;
}) {
  const { t } = useTranslations();
  const [isReady, setIsReady] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(CLOSE_AFTER_SEC);
  const startedRef = useRef(false);

  useEffect(() => {
    function onReady() {
      if (startedRef.current) return;
      startedRef.current = true;
      setIsReady(true);
      setSecondsLeft(CLOSE_AFTER_SEC);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { source?: string; type?: string } | null;
      if (data?.source === "routine-gmail-plugin" && data.type === "ready") {
        onReady();
      }
    }

    if (pluginPageIsReady()) onReady();
    window.addEventListener("routine-gmail-plugin-ready", onReady);
    window.addEventListener("message", onMessage);
    const observer = new MutationObserver(() => {
      if (pluginPageIsReady()) onReady();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: [READY_ATTR],
    });
    const poll = window.setInterval(() => {
      if (pluginPageIsReady()) onReady();
    }, 100);

    return () => {
      window.removeEventListener("routine-gmail-plugin-ready", onReady);
      window.removeEventListener("message", onMessage);
      observer.disconnect();
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!isReady) return;
    if (secondsLeft <= 0) {
      requestPluginTabClose();
      return;
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isReady, secondsLeft]);

  if (!isReady) {
    return (
      <p className="mt-3 text-sm font-medium text-red-600">{waiting}</p>
    );
  }

  return (
    <div className="mt-3 space-y-1">
      <p className="text-sm font-medium text-green-600">{ready}</p>
      {secondsLeft > 0 ? (
        <p className="text-sm font-medium text-green-600">
          {t(
            "extension.gmail.handoff.closing_in",
            "Cilne aizvērsies pēc {seconds} s.",
            { seconds: secondsLeft },
          )}
        </p>
      ) : null}
    </div>
  );
}
