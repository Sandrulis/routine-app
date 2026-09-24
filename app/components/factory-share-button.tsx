"use client";

import type { MouseEvent } from "react";
import { useTranslations } from "@/app/components/translations-provider";

export function FactoryShareButton({
  shared,
  disabled = false,
  onToggle,
  className = "",
}: {
  shared: boolean;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const { t } = useTranslations();
  const label = t("factory.share.label", "Rādīt rūpnīcas darbiniekiem");

  function stop(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  return (
    <button
      type="button"
      aria-pressed={shared}
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={stop}
      onClick={(event) => {
        stop(event);
        if (!disabled) onToggle();
      }}
      className={`inline-flex shrink-0 items-center justify-center disabled:cursor-not-allowed ${
        shared ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-600"
      } ${className}`}
    >
      <i className={`fa-solid fa-screwdriver-wrench ${className.includes("text-") ? "" : "text-[11px]"}`} aria-hidden="true" />
    </button>
  );
}
