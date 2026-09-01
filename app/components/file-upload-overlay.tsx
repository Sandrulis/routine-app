"use client";

import { createPortal } from "react-dom";
import { LoadingSpinner } from "@/app/components/loading-state";
import { useTranslations } from "@/app/components/translations-provider";

export type FileUploadProgressState = {
  fileName: string;
  current: number;
  total: number;
  /** 0–100 for the whole batch */
  percent: number;
};

export function FileUploadOverlay({
  progress,
}: {
  progress: FileUploadProgressState | null;
}) {
  const { t } = useTranslations();
  if (!progress) return null;
  if (typeof document === "undefined") return null;

  const percent = Math.max(0, Math.min(100, Math.round(progress.percent)));
  const showCount = progress.total > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-zinc-950/40 p-4"
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
      aria-label={t("files.upload.progress_title", "Augšupielādē failu")}
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-5 py-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <LoadingSpinner size="sm" className="text-zinc-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">
              {t("files.upload.progress_title", "Augšupielādē failu")}
            </p>
            <p className="mt-1 truncate text-sm text-zinc-600" title={progress.fileName}>
              {progress.fileName}
            </p>
            {showCount ? (
              <p className="mt-1 text-xs text-zinc-500">
                {t("files.upload.progress_count", "{current} no {total}", {
                  current: String(progress.current),
                  total: String(progress.total),
                })}
              </p>
            ) : null}
          </div>
          <span className="shrink-0 text-sm font-medium tabular-nums text-zinc-700">
            {t("files.upload.progress_percent", "{percent}%", {
              percent: String(percent),
            })}
          </span>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-zinc-900 transition-[width] duration-150 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
