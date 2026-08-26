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
    const timer = window.setTimeout(onReady, 12000);
    return () => {
      window.removeEventListener("routine-gmail-plugin-ready", onReady);
      window.clearTimeout(timer);
    };
  }, [ready]);

  return <p className="mt-3 text-sm text-zinc-600">{text}</p>;
}
