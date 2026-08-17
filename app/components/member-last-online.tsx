"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { getLastOnlineDisplay } from "@/app/lib/last-online";

export function MemberLastOnline({
  lastOnlineAt,
}: {
  lastOnlineAt: string | null;
}) {
  const { t } = useTranslations();
  const [now, setNow] = useState(() => Date.now());
  const display = getLastOnlineDisplay(lastOnlineAt, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  if (display.kind === "unknown") return null;

  if (display.kind === "online") {
    return (
      <Tooltip label={t("team.online.now", "Tiešsaistē")}>
        <span
          className="inline-flex size-2 shrink-0 rounded-full bg-emerald-500"
          aria-label={t("team.online.now", "Tiešsaistē")}
        />
      </Tooltip>
    );
  }

  const text =
    display.kind === "minutes"
      ? t("team.online.minutes", "{count} min", { count: display.count })
      : display.kind === "hours"
        ? t("team.online.hours", "{count} h", { count: display.count })
        : display.kind === "days"
          ? t("team.online.days", "{count} d", { count: display.count })
          : t("team.online.months", "{count} m", { count: display.count });

  return (
    <Tooltip label={t("team.online.last", "Pēdējoreiz tiešsaistē")}>
      <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
        {text}
      </span>
    </Tooltip>
  );
}
