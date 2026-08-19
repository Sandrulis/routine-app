"use client";

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

export function FilePreview({
  file,
  content,
}: {
  file: FilePreviewSource;
  content: string | null;
}) {
  const { t } = useTranslations();

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

  if (file.mimeType === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return (
      <iframe
        src={content}
        title={file.name}
        className="min-h-[50vh] w-full rounded-2xl border border-zinc-200 bg-white"
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
