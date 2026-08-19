"use client";

import { useId, useRef, type MouseEvent } from "react";
import { useTranslations } from "@/app/components/translations-provider";

type UnsavedChangesConfirmModalProps = {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
};

export function UnsavedChangesConfirmModal({
  open,
  onStay,
  onLeave,
}: UnsavedChangesConfirmModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslations();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onMouseDown={(event: MouseEvent<HTMLDivElement>) => {
        if (panelRef.current?.contains(event.target as Node)) return;
        onStay();
      }}
    >
      <div className="absolute inset-0 bg-zinc-900/50" aria-hidden="true" />
      <div
        ref={panelRef}
        className="relative w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
          {t("unsaved_changes.title", "Doties prom nesaglabājot?")}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-zinc-600">
          {t(
            "unsaved_changes.description",
            "Vai tiešām vēlies doties prom nesaglabājot? Nesaglabātās izmaiņas tiks zaudētas.",
          )}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onStay}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {t("unsaved_changes.stay", "Turpināt rediģēt")}
          </button>
          <button
            type="button"
            onClick={onLeave}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            {t("unsaved_changes.leave", "Doties prom")}
          </button>
        </div>
      </div>
    </div>
  );
}
