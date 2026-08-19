"use client";

/* eslint-disable @next/next/no-img-element */

import { useRef, useState, type DragEvent } from "react";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { readBrandImageUrl } from "@/app/lib/site-admin/branding";

const labelClassName = "text-sm font-medium text-zinc-800";
const hintClassName = "mt-1.5 text-xs text-zinc-500";

export function BrandingImageField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  label: string;
  hint: string;
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const dragCountRef = useRef(0);
  const [dragging, setDragging] = useState(false);

  async function applyFile(file: File | undefined) {
    if (!file) return;
    const next = await readBrandImageUrl(file);
    if (!next) {
      showFeedback({
        type: "error",
        text: t("teams.logo.invalid", "Augšupielādē attēlu līdz 1.5 MB."),
      });
      return;
    }
    onChange(next);
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
    void applyFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <label
        htmlFor={id}
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
          id={id}
          type="file"
          accept="image/*,.ico"
          className="hidden"
          disabled={disabled}
          onChange={(event) => {
            void applyFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {value ? (
          <span className="inline-flex size-12 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <img src={value} alt="" className="size-full object-contain" />
          </span>
        ) : (
          <i className="far fa-image text-lg text-zinc-300" aria-hidden="true" />
        )}
        <span>
          {t("site_settings.form.image.drop", "Ievelc attēlu šeit vai")}{" "}
          <span className="font-medium text-zinc-700 underline decoration-dotted underline-offset-4">
            {t("subtasks.attachments.browse", "pārlūko")}
          </span>
        </span>
      </label>
      <p className={hintClassName}>{hint}</p>
      {value ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="mt-2 text-xs font-medium text-zinc-500 transition hover:text-red-600 disabled:cursor-not-allowed"
        >
          {t("site_settings.form.image.remove", "Noņemt attēlu")}
        </button>
      ) : null}
    </div>
  );
}
