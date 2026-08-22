"use client";

import { useTranslations } from "@/app/components/translations-provider";
import { fadeHexColor, type WorkProgress } from "@/app/lib/lists";

export function hasWorkProgress(progress: WorkProgress): boolean {
  return progress.total > 0 || progress.percent > 0;
}

export function WorkProgressLabel({
  progress,
  className = "shrink-0 tabular-nums text-[11px] text-zinc-400",
}: {
  progress: WorkProgress;
  className?: string;
}) {
  const { t } = useTranslations();
  if (progress.total <= 0) return null;
  return (
    <span
      className={className}
      title={t("lists.progress.completed", "Izpildīti {done} no {total}", {
        done: progress.done,
        total: progress.total,
      })}
    >
      {t("lists.windows.progress", "{done}/{total}", {
        done: progress.done,
        total: progress.total,
      })}
    </span>
  );
}

export function WorkProgressBar({
  progress,
  className = "",
}: {
  progress: WorkProgress;
  className?: string;
}) {
  if (!hasWorkProgress(progress)) return null;
  return (
    <div
      className={`h-1.5 overflow-hidden rounded-full bg-zinc-200 ${className}`.trim()}
      aria-hidden="true"
    >
      <div
        className="h-full rounded-full bg-emerald-500"
        style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
      />
    </div>
  );
}

export function WorkProgressFill({
  percent,
  color,
}: {
  percent: number;
  color?: string;
}) {
  if (percent <= 0) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-md"
      aria-hidden="true"
    >
      <div
        className={color ? "h-full" : "h-full bg-emerald-500/20"}
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          ...(color ? { backgroundColor: fadeHexColor(color, 0.78) } : undefined),
        }}
      />
    </div>
  );
}
