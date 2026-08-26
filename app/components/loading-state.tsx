"use client";

import { useTranslations } from "@/app/components/translations-provider";

export function LoadingSpinner({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <i
      className={`fas fa-circle-notch ui-spinner ${size === "sm" ? "text-xs" : "text-lg"} ${className}`}
      aria-hidden="true"
    />
  );
}

export function LoadingState({
  label,
  compact = false,
  className = "",
}: {
  label?: string;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslations();
  const text = label ?? t("common.loading", "Ielādē…");

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-2 py-1.5 text-[12px] text-zinc-400 ${className}`}
        role="status"
        aria-live="polite"
      >
        <LoadingSpinner size="sm" className="text-zinc-400" />
        <span>{text}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex min-h-48 flex-col items-center justify-center gap-3 px-6 py-12 text-sm text-zinc-500 ${className}`}
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner className="text-zinc-400" />
      <p>{text}</p>
    </div>
  );
}
