"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AppModal,
  appModalSplitPanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { FilePreview } from "@/app/components/file-preview";
import { LoadingSpinner, LoadingState } from "@/app/components/loading-state";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { cloudFileDownloadHref, workFileContentHref } from "@/app/lib/cloud-storage/content-url";
import { isBrowserPreviewableFile } from "@/app/lib/file-types";
import {
  downloadUrlAsFile,
  fetchGoogleDriveContentBlob,
  triggerBrowserDownload,
} from "@/app/lib/google-drive/content-url";
import { fetchOneDriveContentBlob } from "@/app/lib/onedrive/content-url";
import type { ListFile } from "@/app/lib/list-files";
import { isTextFile } from "@/app/lib/list-files";
import { ensureListFileContent, ensureTaskFileContent } from "@/app/lib/file-content";
import { type TaskFile } from "@/app/lib/task-activity";

export type FileViewerOpenInput = {
  kind: "list" | "task" | "local";
  id: string;
  name: string;
  mimeType: string;
  size: number;
  hasContent?: boolean;
  googleDriveFileId?: string | null;
  oneDriveFileId?: string | null;
  /** Pending / already resolved content (data or blob URL). */
  contentUrl?: string | null;
  revokeContentOnClose?: boolean;
};

type PreviewState = {
  file: FileViewerOpenInput;
  content: string | null;
  loading: boolean;
  revokeOnClose: boolean;
};

type BusyState = {
  mode: "preview" | "download";
  fileName: string;
};

type FileViewerContextValue = {
  openFile: (input: FileViewerOpenInput) => void;
  openListFile: (file: ListFile) => void;
  openTaskFile: (file: TaskFile) => void;
  busy: BusyState | null;
};

const FileViewerContext = createContext<FileViewerContextValue | null>(null);

function FileBusyOverlay({
  busy,
  hide,
}: {
  busy: BusyState | null;
  hide?: boolean;
}) {
  const { t } = useTranslations();
  if (!busy || hide) return null;

  const title =
    busy.mode === "download"
      ? t("files.download.progress_title", "Lejupielādē failu")
      : t("files.preview.progress_title", "Atver failu");

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-zinc-950/40 p-4"
      role="alertdialog"
      aria-busy="true"
      aria-live="assertive"
      aria-label={title}
    >
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white px-5 py-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
            <LoadingSpinner size="sm" className="text-zinc-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">{title}</p>
            <p
              className="mt-1 truncate text-sm text-zinc-600"
              title={busy.fileName}
            >
              {busy.fileName}
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              {busy.mode === "download"
                ? t(
                    "files.download.progress_hint",
                    "Sagatavo lejupielādi…",
                  )
                : t(
                    "files.preview.progress_hint",
                    "Ielādē priekšskatījumu…",
                  )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

async function tryLocalListContent(fileId: string): Promise<string | null> {
  try {
    return await ensureListFileContent(fileId);
  } catch {
    return null;
  }
}

async function tryLocalTaskContent(fileId: string): Promise<string | null> {
  try {
    return await ensureTaskFileContent(fileId);
  } catch {
    return null;
  }
}

async function fetchWorkFileAsObjectUrl(
  kind: "list" | "task",
  fileId: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const response = await fetch(workFileContentHref(kind, fileId), {
      credentials: "include",
    });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return null;
    const blob = await response.blob();
    if (blob.type.includes("json") && blob.size < 8_192) return null;
    const headerMime = contentType.split(";")[0]?.trim() || "";
    const resolvedMime =
      (mimeType.trim().toLowerCase().startsWith("text/") ? mimeType : "") ||
      headerMime ||
      mimeType ||
      blob.type ||
      "application/octet-stream";
    return URL.createObjectURL(new Blob([blob], { type: resolvedMime }));
  } catch {
    return null;
  }
}

/**
 * Load preview bytes. Prefer local cache, then unified work-files API
 * (DB text content → Drive → OneDrive) — same path as file forward.
 */
async function resolveContent(
  input: FileViewerOpenInput,
): Promise<{ content: string | null; revokeOnClose: boolean }> {
  if (input.contentUrl) {
    return {
      content: input.contentUrl,
      revokeOnClose: Boolean(input.revokeContentOnClose),
    };
  }

  if (input.kind !== "list" && input.kind !== "task") {
    return { content: null, revokeOnClose: false };
  }

  if (input.kind === "list" && input.hasContent) {
    const local = await tryLocalListContent(input.id);
    if (local) return { content: local, revokeOnClose: false };
  }
  if (input.kind === "task") {
    const local = await tryLocalTaskContent(input.id);
    if (local) return { content: local, revokeOnClose: false };
  }

  // Text/email: use API URL directly so FilePreview fetches UTF-8 text once.
  if (isTextFile({ name: input.name, mimeType: input.mimeType })) {
    const href = workFileContentHref(input.kind, input.id);
    try {
      const probe = await fetch(href, {
        credentials: "include",
        method: "GET",
        headers: { Accept: "text/plain, text/html, */*" },
      });
      if (probe.ok) {
        const contentType = probe.headers.get("content-type") ?? "";
        if (!contentType.includes("application/json")) {
          // Consume body into blob URL so preview does not depend on a second network trip
          // and works even if the browser treats Content-Disposition oddly.
          const blob = await probe.blob();
          const mime =
            (input.mimeType.trim().toLowerCase().startsWith("text/")
              ? input.mimeType
              : "") ||
            contentType.split(";")[0]?.trim() ||
            "text/plain";
          return {
            content: URL.createObjectURL(new Blob([blob], { type: mime })),
            revokeOnClose: true,
          };
        }
      }
    } catch {
      // fall through
    }
  }

  const url = await fetchWorkFileAsObjectUrl(input.kind, input.id, input.mimeType);
  if (url) return { content: url, revokeOnClose: true };
  return { content: null, revokeOnClose: false };
}

async function tryDownloadUrl(url: string | null | undefined, filename: string) {
  if (!url) return false;
  try {
    await downloadUrlAsFile(url, filename);
    return true;
  } catch {
    return false;
  }
}

async function downloadResolved(
  input: FileViewerOpenInput,
  previewContent?: string | null,
): Promise<boolean> {
  if (await tryDownloadUrl(previewContent, input.name)) return true;
  if (await tryDownloadUrl(input.contentUrl, input.name)) return true;

  if (input.kind === "list" || input.kind === "task") {
    if (
      await tryDownloadUrl(
        workFileContentHref(input.kind, input.id, { download: true }),
        input.name,
      )
    ) {
      return true;
    }

    const href = cloudFileDownloadHref({
      kind: input.kind,
      id: input.id,
      googleDriveFileId: input.googleDriveFileId,
      oneDriveFileId: input.oneDriveFileId,
    });
    if (await tryDownloadUrl(href, input.name)) return true;

    if (input.hasContent || input.kind === "task") {
      try {
        const local =
          input.kind === "list"
            ? await ensureListFileContent(input.id)
            : await ensureTaskFileContent(input.id);
        if (await tryDownloadUrl(local, input.name)) return true;
      } catch {
        // continue
      }
    }
    if (input.googleDriveFileId) {
      try {
        const blob = await fetchGoogleDriveContentBlob(input.kind, input.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          triggerBrowserDownload(url, input.name, true);
          return true;
        }
      } catch {
        // continue
      }
    }
    if (input.oneDriveFileId) {
      try {
        const blob = await fetchOneDriveContentBlob(input.kind, input.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          triggerBrowserDownload(url, input.name, true);
          return true;
        }
      } catch {
        return false;
      }
    }
  }

  return false;
}

export function FileViewerProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [busy, setBusy] = useState<BusyState | null>(null);

  const closePreview = useCallback(() => {
    setPreview((current) => {
      if (current?.revokeOnClose && current.content) {
        URL.revokeObjectURL(current.content);
      }
      return null;
    });
  }, []);

  const openFile = useCallback(
    (input: FileViewerOpenInput) => {
      if (busy) return;

      const canPreview = isBrowserPreviewableFile(input.name, input.mimeType);
      if (!canPreview) {
        setPreview({
          file: input,
          content: null,
          loading: false,
          revokeOnClose: false,
        });
        return;
      }

      setBusy({ mode: "preview", fileName: input.name });
      setPreview({
        file: input,
        content: null,
        loading: true,
        revokeOnClose: false,
      });
      void resolveContent(input)
        .then((resolved) => {
          setPreview({
            file: input,
            content: resolved.content,
            loading: false,
            revokeOnClose: resolved.revokeOnClose,
          });
        })
        .catch(() => {
          setPreview({
            file: input,
            content: null,
            loading: false,
            revokeOnClose: false,
          });
        })
        .finally(() => {
          setBusy(null);
        });
    },
    [busy],
  );

  const openListFile = useCallback(
    (file: ListFile) => {
      openFile({
        kind: "list",
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        hasContent: file.hasContent,
        googleDriveFileId: file.googleDriveFileId,
        oneDriveFileId: file.oneDriveFileId,
      });
    },
    [openFile],
  );

  const openTaskFile = useCallback(
    (file: TaskFile) => {
      openFile({
        kind: "task",
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        hasContent: file.hasContent,
        googleDriveFileId: file.googleDriveFileId,
        oneDriveFileId: file.oneDriveFileId,
      });
    },
    [openFile],
  );

  const handleDownload = useCallback(
    (input: FileViewerOpenInput, previewContent?: string | null) => {
      if (busy) return;
      setBusy({ mode: "download", fileName: input.name });
      showFeedback({
        type: "success",
        text: t("files.download.started", "Fails tiek lejupielādēts."),
      });
      void downloadResolved(input, previewContent)
        .then((ok) => {
          if (!ok) {
            showFeedback({
              type: "error",
              text: t("files.download.failed", "Neizdevās lejupielādēt failu."),
            });
          }
        })
        .catch(() => {
          showFeedback({
            type: "error",
            text: t("files.download.failed", "Neizdevās lejupielādēt failu."),
          });
        })
        .finally(() => {
          setBusy(null);
        });
    },
    [busy, showFeedback, t],
  );

  const value = useMemo(
    () => ({ openFile, openListFile, openTaskFile, busy }),
    [openFile, openListFile, openTaskFile, busy],
  );

  return (
    <FileViewerContext.Provider value={value}>
      {children}
      <FileBusyOverlay
        busy={busy}
        hide={preview !== null && busy?.mode === "download"}
      />
      <AppModal
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open) closePreview();
        }}
        title={preview?.file.name ?? t("actions.view", "Apskatīt")}
        panelMaxWidthClassName={appModalSplitPanelMaxWidthClassName}
        overlayZIndex={80}
      >
        {preview?.loading ? (
          <LoadingState
            label={t("files.preview.progress_hint", "Ielādē priekšskatījumu…")}
          />
        ) : preview ? (
          <FilePreview
            file={{
              name: preview.file.name,
              mimeType: preview.file.mimeType,
              size: preview.file.size,
            }}
            content={preview.content}
            downloading={busy?.mode === "download"}
            onDownload={() => handleDownload(preview.file, preview.content)}
          />
        ) : null}
      </AppModal>
    </FileViewerContext.Provider>
  );
}

export function useFileViewer() {
  const value = useContext(FileViewerContext);
  if (!value) {
    throw new Error("useFileViewer must be used within FileViewerProvider");
  }
  return value;
}
