"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import { FileIcon } from "@/app/components/file-icon";
import {
  decodeDataUrlText,
  isTextFile,
} from "@/app/lib/list-files";

export type FilePreviewSource = {
  name: string;
  mimeType: string;
  size: number;
};

/** Chrome blocks `data:` in iframes; CSP needs `blob:` in frame-src. */
function useEmbeddableUrl(content: string | null, preferBlob: boolean) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!content) {
      setUrl(null);
      return;
    }
    if (!preferBlob || !content.startsWith("data:")) {
      setUrl(content);
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    void fetch(content)
      .then((response) => response.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setUrl(content);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [content, preferBlob]);

  return url;
}

export function FilePreview({
  file,
  content,
}: {
  file: FilePreviewSource;
  content: string | null;
}) {
  const { t } = useTranslations();
  const isPdf =
    file.mimeType === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf");
  const embedUrl = useEmbeddableUrl(content, isPdf);

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
        <FileIcon name={file.name} className="text-3xl" />
        <p className="text-sm text-zinc-500">
          {file.size > 0
            ? t(
                "files.detail.too_large",
                "Faila saturu nevar parādīt. Tas ir pārāk liels vai nav saglabāts.",
              )
            : t(
                "files.detail.empty_content",
                "Šim failam nav saglabāts saturs.",
              )}
        </p>
      </div>
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
    if (!embedUrl) {
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
        src={embedUrl}
        title={file.name}
        sandbox=""
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

  if (isTextFile(file)) {
    const text = decodeDataUrlText(content);
    if (text !== null) {
      return (
        <pre className="max-h-[50vh] overflow-auto rounded-2xl border border-zinc-200 bg-white p-4 text-[13px] leading-6 text-zinc-800 whitespace-pre-wrap">
          {text}
        </pre>
      );
    }
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
      <FileIcon name={file.name} className="text-3xl" />
      <p className="text-sm text-zinc-500">
        {t(
          "files.detail.preview_unavailable",
          "Šo faila veidu nevar parādīt pārlūkā.",
        )}
      </p>
    </div>
  );
}
