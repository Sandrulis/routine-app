"use client";

import { Tooltip } from "@/app/components/tooltip";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useNow } from "@/app/components/now-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { getLastOnlineDisplay } from "@/app/lib/last-online";

export function RelativeTime({
  at,
  className = "shrink-0 text-[11px] tabular-nums text-zinc-400",
}: {
  at: string | null | undefined;
  className?: string;
}) {
  const { t } = useTranslations();
  const { formatDateTime } = useDisplayPreferences();
  const now = useNow();
  const display = getLastOnlineDisplay(at, now);
  const exact = at ? formatDateTime(at) : "";

  if (display.kind === "unknown") return null;

  const text =
    display.kind === "online" || display.kind === "minutes"
      ? t("team.online.minutes", "{count} min", {
          count: display.kind === "minutes" ? Math.max(1, display.count) : 1,
        })
      : display.kind === "hours"
        ? t("team.online.hours", "{count} h", { count: display.count })
        : display.kind === "days"
          ? t("team.online.days", "{count} d", { count: display.count })
          : t("team.online.months", "{count} m", { count: display.count });

  const content = <span className={className}>{text}</span>;
  if (!exact) return content;

  return <Tooltip label={exact}>{content}</Tooltip>;
}
