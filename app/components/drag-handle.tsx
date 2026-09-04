"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import type { MouseEvent } from "react";
import { StatusGlyph } from "@/app/components/status-control";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTaskStatuses } from "@/app/lib/task-statuses";

type DragHandleProps = {
  label: string;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

export function DragHandle({ label, attributes, listeners }: DragHandleProps) {
  return (
    <OptionalTooltip label={label} className="inline-flex shrink-0 self-start">
      <button
        type="button"
        className="inline-flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 transition hover:bg-white/80 hover:text-zinc-500 active:cursor-grabbing"
        aria-label={label}
        {...attributes}
        {...listeners}
      >
        <i className="fas fa-grip-vertical text-[11px]" aria-hidden="true" />
      </button>
    </OptionalTooltip>
  );
}

type StatusReorderHandleProps = {
  status: string;
  listId?: string | null;
  parentTaskId?: string | null;
  color?: string | null;
  groupKey?: string | null;
  label: string;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  canDrag: boolean;
  isDragging?: boolean;
  pressed?: boolean;
  disabled?: boolean;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
};

export function StatusReorderHandle({
  status,
  listId = null,
  parentTaskId = null,
  color,
  groupKey,
  label,
  attributes,
  listeners,
  canDrag,
  isDragging = false,
  pressed,
  disabled = false,
  onClick,
}: StatusReorderHandleProps) {
  const { colorFor, groupKeyFor } = useTaskStatuses(listId, parentTaskId);
  const glyph = (
    <StatusGlyph
      color={color || colorFor(status) || "#a1a1aa"}
      groupKey={groupKey || groupKeyFor(status)}
    />
  );

  if (!canDrag && !onClick) {
    return (
      <span className="inline-flex size-6 shrink-0 items-center justify-center">
        {glyph}
      </span>
    );
  }

  const showGrip = canDrag && isDragging;
  const statusHiddenClassName = showGrip
    ? "opacity-0"
    : "opacity-100 group-hover/row:opacity-0 group-focus-visible/handle:opacity-0";
  const gripVisibleClassName = showGrip
    ? "opacity-100"
    : "opacity-0 group-hover/row:opacity-100 group-focus-visible/handle:opacity-100";

  return (
    <span
      className="inline-flex shrink-0 self-start"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <OptionalTooltip label={label} className="inline-flex shrink-0">
        <button
          type="button"
          className={`group/handle relative inline-flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:text-zinc-600 ${
            canDrag ? "cursor-grab active:cursor-grabbing" : ""
          } disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={disabled}
          {...(canDrag ? attributes : {})}
          {...(canDrag && !disabled ? listeners : {})}
          aria-label={label}
          aria-pressed={pressed}
          onClick={onClick}
        >
          <span
            className={`pointer-events-none inline-flex items-center justify-center transition ${statusHiddenClassName}`}
          >
            {glyph}
          </span>
          {canDrag ? (
            <span
              className={`pointer-events-none absolute inset-0 inline-flex items-center justify-center transition ${gripVisibleClassName}`}
              aria-hidden="true"
            >
              <i className="fas fa-grip-vertical text-[11px]" />
            </span>
          ) : null}
        </button>
      </OptionalTooltip>
    </span>
  );
}
