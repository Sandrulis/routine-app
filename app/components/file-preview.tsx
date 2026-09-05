"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { FileIcon } from "@/app/components/file-icon";
import { LoadingSpinner } from "@/app/components/loading-state";
import { buildEmailPreviewDocument } from "@/app/lib/email-file-preview";
import {
  decodeDataUrlText,
  isTextFile,
} from "@/app/lib/list-files";

export type FilePreviewSource = {
  name: string;
  mimeType: string;
  size: number;
};

/** Decode data: or blob:/http(s) content as UTF-8 text for `.txt` preview. */
function usePreviewText(content: string | null, enabled: boolean) {
  const [text, setText] = useState<string | null>(null);
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled || !content) {
      setText(null);
      setReady(true);
      return;
    }

    if (content.startsWith("data:")) {
      setText(decodeDataUrlText(content));
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);
    void fetch(content, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("text preview fetch failed");
        return response.text();
      })
      .then((value) => {
        if (!cancelled) {
          setText(value);
          setReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setText(null);
          setReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [content, enabled]);

  return { text, ready };
}

/** Chrome blocks `data:` in iframes; CSP needs `blob:`. Sandbox blocks the PDF viewer. */
function dataUrlToObjectUrl(dataUrl: string, fallbackMime: string): string | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;
    const meta = dataUrl.slice(5, comma); // after "data:"
    const payload = dataUrl.slice(comma + 1);
    const mime = meta.split(";")[0]?.trim() || fallbackMime;
    const bytes = meta.includes(";base64")
      ? Uint8Array.from(atob(payload), (char) => char.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(payload));
    return URL.createObjectURL(new Blob([bytes], { type: mime || fallbackMime }));
  } catch {
    return null;
  }
}

function useEmbeddableUrl(
  content: string | null,
  preferBlob: boolean,
  mimeType: string,
) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!content) {
      setUrl(null);
      setFailed(false);
      return;
    }
    if (!preferBlob) {
      setUrl(content);
      setFailed(false);
      return;
    }
    if (content.startsWith("blob:")) {
      setUrl(content);
      setFailed(false);
      return;
    }
    if (content.startsWith("data:")) {
      const objectUrl = dataUrlToObjectUrl(content, mimeType);
      if (!objectUrl) {
        setUrl(null);
        setFailed(true);
        return;
      }
      setUrl(objectUrl);
      setFailed(false);
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    let objectUrl: string | null = null;
    let cancelled = false;
    setFailed(false);
    void fetch(content)
      .then((response) => {
        if (!response.ok) throw new Error("embed fetch failed");
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        const typed =
          mimeType && (!blob.type || blob.type === "application/octet-stream")
            ? new Blob([blob], { type: mimeType })
            : blob;
        objectUrl = URL.createObjectURL(typed);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setUrl(null);
          setFailed(true);
        }
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [content, preferBlob, mimeType]);

  return { url, failed };
}

/** Render email export / HTML-in-txt as a sandboxed HTML document. */
function useEmailPreviewUrl(text: string | null, enabled: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !text) {
      setUrl(null);
      return;
    }

    const doc = buildEmailPreviewDocument(text);
    if (!doc) {
      setUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(
      new Blob([doc], { type: "text/html;charset=utf-8" }),
    );
    setUrl(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [text, enabled]);

  return url;
}

function PreviewFallback({
  fileName,
  message,
  hint,
  downloadLabel,
  downloading = false,
  onDownload,
}: {
  fileName: string;
  message: string;
  hint?: string | null;
  downloadLabel: string;
  downloading?: boolean;
  onDownload?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
      <FileIcon name={fileName} className="text-3xl" />
      <p className="text-sm text-zinc-500">{message}</p>
      {hint ? <p className="text-sm text-zinc-400">{hint}</p> : null}
      {onDownload ? (
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          aria-busy={downloading}
          className="mt-1 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-80"
        >
          {downloading ? (
            <>
              <LoadingSpinner size="sm" className="text-white" />
              <span>{downloadLabel}</span>
            </>
          ) : (
            <>
              <i className="fas fa-download text-xs" aria-hidden="true" />
              {downloadLabel}
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

export function FilePreview({
  file,
  content,
  downloading = false,
  onDownload,
}: {
  file: FilePreviewSource;
  content: string | null;
  downloading?: boolean;
  onDownload?: () => void;
}) {
  const { t } = useTranslations();
  const downloadLabel = t("files.detail.download", "Lejupielādēt");
  const previewUnavailable = t(
    "files.detail.preview_unavailable",
    "Šo faila veidu nevar parādīt pārlūkā.",
  );
  const downloadHint = t(
    "files.detail.download_to_open",
    "Lejupielādē failu, lai to atvērtu.",
  );
  const isPdf =
    file.mimeType === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  const wantText = isTextFile(file) && !isPdf;
  const { url: embedUrl, failed: embedFailed } = useEmbeddableUrl(
    content,
    isPdf,
    isPdf ? "application/pdf" : file.mimeType,
  );
  const { text: previewText, ready: textReady } = usePreviewText(
    content,
    Boolean(content) && wantText,
  );
  const emailPreviewDoc =
    wantText && previewText ? buildEmailPreviewDocument(previewText) : null;
  const emailPreviewUrl = useEmailPreviewUrl(
    previewText,
    Boolean(emailPreviewDoc),
  );

  if (!content) {
    return (
      <PreviewFallback
        fileName={file.name}
        message={
          onDownload
            ? previewUnavailable
            : file.size > 0
              ? t(
                  "files.detail.too_large",
                  "Faila saturu nevar parādīt. Tas ir pārāk liels vai nav saglabāts.",
                )
              : t(
                  "files.detail.empty_content",
                  "Šim failam nav saglabāts saturs.",
                )
        }
        hint={onDownload ? downloadHint : null}
        downloadLabel={downloadLabel}
        downloading={downloading}
        onDownload={onDownload}
      />
    );
  }

  if (content.startsWith("data:image/") || file.mimeType.startsWith("image/")) {
    return (
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
        <img
          src={content}
          alt={file.name}
          className="mx-auto max-h-[70vh] max-w-full object-contain"
        />
      </div>
    );
  }

  if (isPdf) {
    if (embedFailed) {
      return (
        <PreviewFallback
          fileName={file.name}
          message={previewUnavailable}
          hint={onDownload ? downloadHint : null}
          downloadLabel={downloadLabel}
          downloading={downloading}
          onDownload={onDownload}
        />
      );
    }
    if (!embedUrl) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <p className="text-sm text-zinc-400">
            {t("files.detail.loading", "Ielādē failu")}
          </p>
        </div>
      );
    }
    // No sandbox: Chrome’s PDF viewer is blocked inside sandboxed iframes
    // (“This page has been blocked by Chrome”). Content is a same-origin blob:.
    return (
      <iframe
        src={`${embedUrl}#navpanes=0`}
        title={file.name}
        className="min-h-[70vh] w-full rounded-2xl border border-zinc-200 bg-white"
      />
    );
  }

  if (file.mimeType.startsWith("video/")) {
    return (
      <video
        src={content}
        controls
        className="w-full rounded-2xl border border-zinc-200 bg-black"
      />
    );
  }

  if (file.mimeType.startsWith("audio/")) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-6">
        <audio src={content} controls className="w-full" />
      </div>
    );
  }

  if (wantText) {
    if (!textReady) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
          <p className="text-sm text-zinc-400">
            {t("files.detail.loading", "Ielādē failu")}
          </p>
        </div>
      );
    }
    if (emailPreviewDoc) {
      if (!emailPreviewUrl) {
        return (
          <div className="flex min-h-[50vh] items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <p className="text-sm text-zinc-400">
              {t("files.detail.loading", "Ielādē failu")}
            </p>
          </div>
        );
      }
      return (
        <iframe
          src={emailPreviewUrl}
          title={file.name}
          sandbox=""
          className="min-h-[70vh] w-full rounded-2xl border border-zinc-200 bg-white"
        />
      );
    }
    if (previewText !== null) {
      return (
        <pre className="max-h-[70vh] overflow-auto rounded-2xl border border-zinc-200 bg-white p-4 text-[13px] leading-6 text-zinc-800 whitespace-pre-wrap">
          {previewText}
        </pre>
      );
    }
  }

  return (
    <PreviewFallback
      fileName={file.name}
      message={previewUnavailable}
      hint={onDownload ? downloadHint : null}
      downloadLabel={downloadLabel}
      downloading={downloading}
      onDownload={onDownload}
    />
  );
}
