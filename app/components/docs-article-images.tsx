"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type DragEvent } from "react";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";
import { docsImageSrc } from "@/app/lib/docs/images";
import type { DocsArticleImage } from "@/app/lib/docs/types";

export type DocsArticleImageItem = DocsArticleImage & {
  previewSrc?: string;
};

export function DocsArticleImages({
  images,
  disabled = false,
  onAddFiles,
  onInsert,
  onRemove,
}: {
  images: DocsArticleImageItem[];
  disabled?: boolean;
  onAddFiles: (files: File[]) => void;
  onInsert: (image: DocsArticleImageItem) => void;
  onRemove: (image: DocsArticleImageItem) => void;
}) {
  const { t } = useTranslations();
  const dragCountRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    onAddFiles([...fileList]);
  }

  function handleDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current += 1;
    setDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = Math.max(0, dragCountRef.current - 1);
    if (dragCountRef.current === 0) setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = 0;
    setDragging(false);
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div>
      <p className="text-sm font-medium text-zinc-800">
        {t("admin.docs.article.images", "Attēli")}
      </p>
      <label
        className={`mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-4 text-center text-sm transition ${
          dragging
            ? "border-blue-400 bg-blue-50 text-blue-700"
            : "border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400"
        } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp,.png,.jpg,.jpeg,.gif,.webp"
          multiple
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <i className="far fa-image text-lg text-zinc-300" aria-hidden="true" />
        <span>
          {t("site_settings.form.image.drop", "Ievelc attēlu šeit vai")}{" "}
          <span className="font-medium text-zinc-700 underline decoration-dotted underline-offset-4">
            {t("subtasks.attachments.browse", "pārlūko")}
          </span>
        </span>
      </label>
      <p className="mt-1.5 text-xs text-zinc-500">
        {t(
          "admin.docs.article.images.hint",
          "Ievelc attēlus šeit. Pēc tam klikšķini uz attēla, lai ievietotu to saturā.",
        )}
      </p>
      {images.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((image) => (
            <li
              key={image.id}
              className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onInsert(image)}
                className="block aspect-square w-full overflow-hidden"
                title={t("admin.docs.article.images.insert", "Ievietot saturā")}
              >
                <img
                  src={image.previewSrc ?? docsImageSrc(image.id)}
                  alt={image.fileName}
                  className="size-full object-cover"
                />
              </button>
              <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-zinc-900/60 px-1.5 py-1 text-[10px] text-white">
                {image.fileName}
              </span>
              <div className="absolute top-1 right-1">
                <span className="inline-flex rounded-lg bg-white/90 shadow-sm">
                  <IconActionButton
                    label={t("actions.delete", "Dzēst")}
                    icon="fas fa-xmark"
                    variant="delete"
                    disabled={disabled}
                    onClick={() => onRemove(image)}
                  />
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
