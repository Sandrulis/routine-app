"use client";

import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { useFileTypes } from "@/app/lib/file-types-context";

export function FileTypesInfoIcon({ className = "" }: { className?: string }) {
  const { t } = useTranslations();
  const { extensionsLabel } = useFileTypes();
  const label = t(
    "files.upload.allowed_types",
    "Atļautie failu tipi: {types}",
    { types: extensionsLabel },
  );

  return (
    <Tooltip label={label} align="end">
      <button
        type="button"
        aria-label={label}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md text-sky-500 transition hover:bg-sky-50 hover:text-sky-600 ${className}`}
      >
        <i className="fas fa-info-circle text-[13px]" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
