"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Tooltip } from "@/app/components/tooltip";

type DragHandleProps = {
  label: string;
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
};

export function DragHandle({ label, attributes, listeners }: DragHandleProps) {
  return (
    <Tooltip label={label} className="inline-flex shrink-0 self-start">
      <button
        type="button"
        className="inline-flex h-7 w-6 shrink-0 cursor-grab items-center justify-center rounded text-zinc-300 transition hover:bg-white/80 hover:text-zinc-500 active:cursor-grabbing"
        aria-label={label}
        {...attributes}
        {...listeners}
      >
        <i className="fas fa-grip-vertical text-[11px]" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
