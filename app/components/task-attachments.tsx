"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  CreateItemMenu,
  createMenuAnchorFromEvent,
  type CreateMenuAnchor,
} from "@/app/components/create-item-menu";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { fileIconClassName } from "@/app/lib/list-files";

export type AttachmentItem = {
  id: string;
  name: string;
  mimeType: string;
  previewUrl?: string | null;
};

function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function overlayIconClassName(name: string, mimeType: string) {
  const extension = fileExtension(name);
  if (extension === "html" || extension === "htm" || mimeType === "text/html") {
    return "fas fa-envelope text-zinc-700";
  }
  return fileIconClassName(name);
}

export function TaskAttachments({
  files,
  onAdd,
  onView,
  onRename,
  onRemove,
  disabled = false,
}: {
  files: AttachmentItem[];
  onAdd: (files: File[]) => void;
  onView: (id: string) => void;
  onRename: (id: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);
  const [expanded, setExpanded] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [menu, setMenu] = useState<{
    fileId: string;
    anchor: CreateMenuAnchor;
  } | null>(null);

  function addFromList(list: FileList | File[] | null) {
    if (disabled) return;
    const selected = Array.from(list ?? []).filter((file) => file.size >= 0);
    if (selected.length === 0) return;
    onAdd(selected);
  }

  function handleDragEnter(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (disabled) return;
    dragCountRef.current += 1;
    setDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = Math.max(0, dragCountRef.current - 1);
    if (dragCountRef.current === 0) setDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragCountRef.current = 0;
    setDragging(false);
    addFromList(event.dataTransfer.files);
  }

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700"
        aria-expanded={expanded}
      >
        <i
          className={`fas fa-chevron-down text-[10px] text-zinc-400 transition ${
            expanded ? "" : "-rotate-90"
          }`}
          aria-hidden="true"
        />
        <span>
          {t("subtasks.attachments.title", "Pielikumi")}
          {files.length > 0 ? ` ${files.length}` : ""}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3">
          <label
            className={`flex min-h-16 cursor-pointer items-center justify-center rounded-2xl border border-dashed px-4 py-4 text-center text-sm transition ${
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
              ref={inputRef}
              type="file"
              multiple
              disabled={disabled}
              className="hidden"
              onChange={(event) => {
                addFromList(event.target.files);
                event.target.value = "";
              }}
            />
            <span>
              {t("subtasks.attachments.drop", "Ievelc failus šeit vai")}{" "}
              <span className="font-medium text-zinc-700 underline decoration-dotted underline-offset-4">
                {t("subtasks.attachments.browse", "pārlūko")}
              </span>
            </span>
          </label>

          {files.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {files.map((file) => (
                <li
                  key={file.id}
                  className="w-[10.75rem] rounded-2xl bg-zinc-50 p-2"
                >
                  <div className="relative">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onView(file.id)}
                      className="w-full text-left disabled:cursor-not-allowed"
                    >
                      <span className="relative block overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200/80">
                        {file.previewUrl ? (
                          <img
                            src={file.previewUrl}
                            alt=""
                            className="h-24 w-full object-cover object-top"
                          />
                        ) : (
                          <span className="flex h-24 flex-col justify-end gap-1.5 bg-zinc-100 p-3">
                            <span className="h-1.5 w-3/4 rounded-full bg-zinc-300" />
                            <span className="h-1.5 w-full rounded-full bg-zinc-200" />
                            <span className="h-1.5 w-2/3 rounded-full bg-zinc-200" />
                          </span>
                        )}
                        <span className="absolute top-2 left-2 inline-flex size-6 items-center justify-center rounded-full bg-white shadow-sm">
                          <i
                            className={`${overlayIconClassName(file.name, file.mimeType)} text-[11px]`}
                            aria-hidden="true"
                          />
                        </span>
                      </span>
                      <span className="mt-2 block truncate pr-6 text-[12px] text-zinc-600">
                        {file.name}
                      </span>
                    </button>
                    <Tooltip label={t("nav.more", "Vairāk")} align="end">
                      <button
                        type="button"
                        aria-label={t("nav.more", "Vairāk")}
                        aria-expanded={menu?.fileId === file.id}
                        disabled={disabled}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setMenu({
                            fileId: file.id,
                            anchor: createMenuAnchorFromEvent(event),
                          });
                        }}
                        className="absolute right-0 bottom-0 inline-flex size-6 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 disabled:cursor-not-allowed"
                      >
                        <i className="fas fa-ellipsis text-[12px]" aria-hidden="true" />
                      </button>
                    </Tooltip>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <CreateItemMenu
        open={menu !== null}
        anchor={menu?.anchor ?? null}
        title={t("nav.item_menu", "Darbības")}
        items={[
          {
            id: "view",
            icon: "fas fa-eye",
            title: t("actions.view", "Apskatīt"),
          },
          {
            id: "rename",
            icon: "fas fa-pen",
            title: t("actions.rename", "Pārsaukt"),
          },
          {
            id: "delete",
            icon: "fas fa-trash",
            title: t("actions.delete", "Dzēst"),
            danger: true,
            dividerBefore: true,
          },
        ]}
        onClose={() => setMenu(null)}
        onSelect={(id) => {
          if (!menu) return;
          const fileId = menu.fileId;
          setMenu(null);
          if (id === "view") onView(fileId);
          if (id === "rename") onRename(fileId);
          if (id === "delete") onRemove(fileId);
        }}
      />
    </section>
  );
}
