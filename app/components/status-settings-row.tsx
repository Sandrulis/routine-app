"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  closestCenter,
  pointerWithin,
  useDroppable,
  type CollisionDetection,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from "@/app/components/drag-handle";
import { StatusGlyph } from "@/app/components/status-control";
import { StatusIconPickerModal } from "@/app/components/status-icon-picker-modal";
import type { ListStatusGroup } from "@/app/lib/list-statuses";
import { STATUS_GROUP_DROPPABLE_PREFIX } from "@/app/lib/list-statuses";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

export const statusDnDCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const groupHit = pointerHits.find((hit) =>
    String(hit.id).startsWith(STATUS_GROUP_DROPPABLE_PREFIX),
  );
  if (groupHit) return [groupHit];
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args);
};

export const STATUS_GROUP_OPTIONS = [
  { value: "not_started", labelKey: "status.group.not_started", fallback: "Nav sākts" },
  { value: "active", labelKey: "status.group.active", fallback: "Aktīvs" },
  { value: "done", labelKey: "status.group.done", fallback: "Pabeigts" },
  { value: "closed", labelKey: "status.group.closed", fallback: "Slēgts" },
] as const;

export function statusGroupLabel(
  groupKey: string,
  t: (key: string, fallback: string) => string,
) {
  const option = STATUS_GROUP_OPTIONS.find((item) => item.value === groupKey);
  return option ? t(option.labelKey, option.fallback) : groupKey;
}

export function GroupSeparator({
  id,
  label,
  empty,
  emptyLabel,
}: {
  id: string;
  label: string;
  empty: boolean;
  emptyLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-zinc-200 bg-zinc-50 px-4 py-2 ${
        isOver ? "bg-sky-50 ring-2 ring-inset ring-sky-200" : ""
      } ${empty ? "min-h-14" : "min-h-9"}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      {empty ? (
        <p className="pt-1 text-sm text-zinc-400">{emptyLabel}</p>
      ) : null}
    </div>
  );
}

type StatusMenuAction = {
  rename?: boolean;
  changeColor?: boolean;
  changeIcon?: boolean;
  resetLabel?: boolean;
  delete?: boolean;
};

export function SortableStatusRow({
  status,
  label,
  system,
  hidden,
  renamed,
  editing,
  editValue,
  editColor,
  editDirty,
  canDelete,
  canToggleVisibility,
  visibilityDisabledLabel,
  dragLabel,
  deleteDisabledLabel,
  systemBadge,
  listBadge,
  taskBadge,
  renamedBadge,
  scopeKind = "system",
  menuActions,
  onStartEdit,
  onEditValueChange,
  onEditColorChange,
  onSaveEdit,
  onCancelEdit,
  onToggleVisibility,
  onReset,
  onDelete,
  onChangeColor,
  onChangeIcon,
  t,
}: {
  status: TaskStatusSummary;
  label: string;
  system: boolean;
  hidden: boolean;
  renamed: boolean;
  editing: boolean;
  editValue: string;
  editColor: string;
  editDirty: boolean;
  canDelete: boolean;
  canToggleVisibility: boolean;
  visibilityDisabledLabel: string;
  dragLabel: string;
  deleteDisabledLabel: string;
  systemBadge: string;
  listBadge?: string;
  taskBadge?: string;
  renamedBadge: string;
  scopeKind?: "system" | "list" | "task";
  menuActions?: StatusMenuAction;
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onEditColorChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleVisibility: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  onChangeColor?: (color: string) => void;
  onChangeIcon?: (icon: string | null) => void;
  t: (key: string, fallback: string) => string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const actions: StatusMenuAction = {
    rename: true,
    changeColor: !system,
    changeIcon: !system,
    resetLabel: Boolean(onReset),
    delete: Boolean(onDelete),
    ...menuActions,
  };

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, [editing]);

  useEffect(() => {
    if (!menuOpen || !menuButtonRef.current) {
      setMenuPosition(null);
      return;
    }
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(12, rect.right - 176),
    });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuButtonRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setMenuOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [menuId, menuOpen]);

  const showMenu =
    actions.rename ||
    actions.changeColor ||
    actions.changeIcon ||
    actions.resetLabel ||
    actions.delete;

  return (
    <>
      <li
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={`flex items-center gap-2 px-3 py-2.5 ${
          isDragging ? "relative z-10 bg-white shadow-sm" : ""
        } ${hidden ? "bg-zinc-50/80 opacity-70" : ""}`}
      >
        <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
        <label
          className="inline-flex shrink-0 items-center"
          title={
            hidden
              ? t("lists.statuses.show", "Rādīt")
              : canToggleVisibility
                ? t("lists.statuses.hide", "Paslēpt")
                : visibilityDisabledLabel
          }
          onPointerDown={(event) => event.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={!hidden}
            disabled={!hidden && !canToggleVisibility}
            onChange={onToggleVisibility}
            className="size-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={
              hidden
                ? t("lists.statuses.show", "Rādīt")
                : t("lists.statuses.hide", "Paslēpt")
            }
          />
        </label>
        {editing && !system ? (
          <label
            className="relative inline-flex shrink-0 cursor-pointer"
            title={t("admin.statuses.color", "Krāsa")}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <StatusGlyph
              color={editColor}
              groupKey={status.groupKey}
              icon={status.icon}
            />
            <input
              type="color"
              value={editColor}
              aria-label={t("admin.statuses.color", "Krāsa")}
              onChange={(event) => onEditColorChange(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
            />
          </label>
        ) : (
          <StatusGlyph
            color={status.color}
            groupKey={status.groupKey}
            icon={status.icon}
          />
        )}
        {editing ? (
          <input
            ref={inputRef}
            value={editValue}
            aria-label={label}
            onChange={(event) => onEditValueChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                if (editDirty) onSaveEdit();
                else onCancelEdit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                onCancelEdit();
              }
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate px-2 py-1 text-sm font-medium text-zinc-900">
            {label}
          </span>
        )}
        {editDirty ? (
          <button
            type="button"
            onClick={onSaveEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className="inline-flex shrink-0 items-center rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-zinc-700"
          >
            {t("actions.save", "Saglabāt")}
          </button>
        ) : null}
        {editing ? null : (
          <>
            {system ? (
              <span className="hidden text-[11px] font-medium uppercase tracking-wide text-zinc-400 sm:inline">
                {systemBadge}
              </span>
            ) : null}
            {!system && scopeKind === "list" && listBadge ? (
              <span className="hidden text-[11px] font-medium uppercase tracking-wide text-sky-600/80 sm:inline">
                {listBadge}
              </span>
            ) : null}
            {!system && scopeKind === "task" && taskBadge ? (
              <span className="hidden text-[11px] font-medium uppercase tracking-wide text-violet-600/80 sm:inline">
                {taskBadge}
              </span>
            ) : null}
            {renamed ? (
              <span className="hidden text-[11px] text-zinc-400 sm:inline">
                {renamedBadge}
              </span>
            ) : null}
          </>
        )}
        {showMenu && !editing ? (
          <button
            ref={menuButtonRef}
            type="button"
            aria-label={t("common.actions", "Darbības")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((current) => !current)}
            onPointerDown={(event) => event.stopPropagation()}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <i className="fas fa-ellipsis text-[13px]" aria-hidden="true" />
          </button>
        ) : null}
        {actions.changeColor && onChangeColor ? (
          <input
            ref={colorInputRef}
            type="color"
            className="sr-only"
            value={status.color}
            onChange={(event) => onChangeColor(event.target.value)}
          />
        ) : null}
      </li>

      {menuOpen && menuPosition
        ? createPortal(
            <div
              id={menuId}
              role="menu"
              data-app-modal-ignore-backdrop=""
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 80,
              }}
              className="w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              {actions.rename ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onStartEdit();
                  }}
                >
                  <i className="fas fa-pen w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                  {t("lists.statuses.menu.rename", "Pārsaukt")}
                </button>
              ) : null}
              {actions.changeColor && onChangeColor ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                  onClick={() => {
                    setMenuOpen(false);
                    colorInputRef.current?.click();
                  }}
                >
                  <i className="fas fa-palette w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                  {t("lists.statuses.menu.change_color", "Mainīt krāsu")}
                </button>
              ) : null}
              {actions.changeIcon && onChangeIcon ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                  onClick={() => {
                    setMenuOpen(false);
                    setIconPickerOpen(true);
                  }}
                >
                  <i className="fas fa-icons w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                  {t("lists.statuses.menu.change_icon", "Mainīt ikonu")}
                </button>
              ) : null}
              {actions.resetLabel && onReset ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                  onClick={() => {
                    setMenuOpen(false);
                    onReset();
                  }}
                >
                  <i className="fas fa-rotate-left w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                  {t("lists.statuses.reset_default", "Atjaunot noklusējuma nosaukumu")}
                </button>
              ) : null}
              {actions.delete && onDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  disabled={!canDelete}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => {
                    if (!canDelete) return;
                    setMenuOpen(false);
                    onDelete();
                  }}
                >
                  <i className="fas fa-trash w-4 text-center text-xs" aria-hidden="true" />
                  {canDelete
                    ? t("actions.delete", "Dzēst")
                    : deleteDisabledLabel}
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}

      {onChangeIcon ? (
        <StatusIconPickerModal
          open={iconPickerOpen}
          onOpenChange={setIconPickerOpen}
          color={status.color}
          groupKey={status.groupKey}
          value={status.icon ?? null}
          onSave={onChangeIcon}
        />
      ) : null}
    </>
  );
}

export type { ListStatusGroup };
