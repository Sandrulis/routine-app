"use client";

import { useEffect, useState } from "react";

export function GmailPluginHandoffBody({
  waiting,
  ready,
}: {
  waiting: string;
  ready: string;
}) {
  const [text, setText] = useState(waiting);

  useEffect(() => {
    function onReady() {
      setText(ready);
    }
    window.addEventListener("routine-gmail-plugin-ready", onReady);
    return () => {
      window.removeEventListener("routine-gmail-plugin-ready", onReady);
    };
  }, [ready]);

  const isWaiting = text === waiting;
  return (
    <p
      className={
        isWaiting
          ? "mt-3 text-sm font-medium text-red-600"
          : "mt-3 text-sm text-zinc-600"
      }
    >
      {text}
    </p>
  );
}
