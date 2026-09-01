"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";

type PluginWindow = Window & { __routineGmailPluginReady?: boolean };

const CLOSE_AFTER_SEC = 5;

function requestPluginTabClose() {
  window.dispatchEvent(new Event("routine-gmail-plugin-close"));
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
    const pluginWindow = window as PluginWindow;
    if (pluginWindow.__routineGmailPluginReady) {
      onReady();
    }
    window.addEventListener("routine-gmail-plugin-ready", onReady);
    const poll = window.setInterval(() => {
      if ((window as PluginWindow).__routineGmailPluginReady) onReady();
    }, 100);
    return () => {
      window.removeEventListener("routine-gmail-plugin-ready", onReady);
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
