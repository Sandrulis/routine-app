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
import { isBrowserPreviewableFile } from "@/app/lib/file-types";
import {
  downloadUrlAsFile,
  fetchGoogleDriveContentAsObjectUrl,
  fetchGoogleDriveContentBlob,
  triggerBrowserDownload,
} from "@/app/lib/google-drive/content-url";
import {
  fetchOneDriveContentAsObjectUrl,
  fetchOneDriveContentBlob,
} from "@/app/lib/onedrive/content-url";
import type { ListFile } from "@/app/lib/list-files";
import { ensureListFileContent, ensureTaskFileContent } from "@/app/lib/file-content";
import { taskFilePreviewUrl, type TaskFile } from "@/app/lib/task-activity";

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

function FileBusyOverlay({ busy }: { busy: BusyState | null }) {
  const { t } = useTranslations();
  if (!busy) return null;

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

async function resolveContent(
  input: FileViewerOpenInput,
): Promise<{ content: string | null; revokeOnClose: boolean }> {
  try {
    if (input.contentUrl) {
      return {
        content: input.contentUrl,
        revokeOnClose: Boolean(input.revokeContentOnClose),
      };
    }

    if (input.kind === "list") {
      if (input.hasContent) {
        const local = await ensureListFileContent(input.id);
        if (local) return { content: local, revokeOnClose: false };
      }
      if (input.googleDriveFileId) {
        const url = await fetchGoogleDriveContentAsObjectUrl("list", input.id);
        if (url) return { content: url, revokeOnClose: true };
      }
      if (input.oneDriveFileId) {
        const url = await fetchOneDriveContentAsObjectUrl("list", input.id);
        return { content: url, revokeOnClose: Boolean(url) };
      }
      return { content: null, revokeOnClose: false };
    }

    if (input.kind === "task") {
      const local = await ensureTaskFileContent(input.id);
      if (local) return { content: local, revokeOnClose: false };
      if (input.hasContent) {
        const preview = taskFilePreviewUrl({
          id: input.id,
          taskId: "",
          name: input.name,
          mimeType: input.mimeType,
          size: input.size,
          hasContent: true,
          googleDriveFileId: input.googleDriveFileId ?? null,
          oneDriveFileId: input.oneDriveFileId ?? null,
          createdAt: "",
        });
        if (preview) return { content: preview, revokeOnClose: false };
      }
      if (input.googleDriveFileId) {
        const url = await fetchGoogleDriveContentAsObjectUrl("task", input.id);
        if (url) return { content: url, revokeOnClose: true };
      }
      if (input.oneDriveFileId) {
        const url = await fetchOneDriveContentAsObjectUrl("task", input.id);
        return { content: url, revokeOnClose: Boolean(url) };
      }
      return { content: null, revokeOnClose: false };
    }

    return { content: null, revokeOnClose: false };
  } catch {
    return { content: null, revokeOnClose: false };
  }
}

async function downloadResolved(input: FileViewerOpenInput): Promise<boolean> {
  if (input.contentUrl) {
    await downloadUrlAsFile(input.contentUrl, input.name);
    return true;
  }

  if (input.kind === "list" || input.kind === "task") {
    if (input.hasContent || input.kind === "task") {
      const local =
        input.kind === "list"
          ? await ensureListFileContent(input.id)
          : await ensureTaskFileContent(input.id);
      if (local) {
        await downloadUrlAsFile(local, input.name);
        return true;
      }
    }
    if (input.googleDriveFileId) {
      const blob = await fetchGoogleDriveContentBlob(input.kind, input.id);
      if (blob) {
        const url = URL.createObjectURL(blob);
        triggerBrowserDownload(url, input.name, true);
        return true;
      }
    }
    if (input.oneDriveFileId) {
      const blob = await fetchOneDriveContentBlob(input.kind, input.id);
      if (!blob) return false;
      const url = URL.createObjectURL(blob);
      triggerBrowserDownload(url, input.name, true);
      return true;
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

      if (isBrowserPreviewableFile(input.name, input.mimeType)) {
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
        return;
      }

      setBusy({ mode: "download", fileName: input.name });
      void downloadResolved(input)
        .then((ok) => {
          if (!ok) {
            showFeedback({
              type: "error",
              text: t("files.download.failed", "Neizdevās lejupielādēt failu."),
            });
          }
        })
        .finally(() => {
          setBusy(null);
        });
    },
    [busy, showFeedback, t],
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

  const value = useMemo(
    () => ({ openFile, openListFile, openTaskFile, busy }),
    [openFile, openListFile, openTaskFile, busy],
  );

  return (
    <FileViewerContext.Provider value={value}>
      {children}
      <FileBusyOverlay busy={busy} />
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
