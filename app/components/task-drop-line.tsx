"use client";

import { createPortal } from "react-dom";
import {
  closestCenter,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import type { SortingStrategy } from "@dnd-kit/sortable";
import { pointerYFromEvent } from "@/app/lib/dnd/pointer-y-from-event";

const STATUS_GROUP_PREFIX = "status-group:";

export type DropEdge = "before" | "after";

export type DropHint = {
  overId: string;
  edge: DropEdge;
  header: boolean;
  rect: { top: number; left: number; width: number; height: number };
};

export const frozenSortingStrategy: SortingStrategy = () => null;

export function statusGroupDropId(statusId: string, prefix = "") {
  return `${STATUS_GROUP_PREFIX}${prefix}${statusId}`;
}

export function parseStatusGroupDropId(
  id: UniqueIdentifier,
): string | null {
  const value = String(id);
  if (!value.startsWith(STATUS_GROUP_PREFIX)) return null;
  return value.slice(STATUS_GROUP_PREFIX.length);
}

export const groupedStatusCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  const statusHit = pointerHits.find((hit) => parseStatusGroupDropId(hit.id));
  if (statusHit) return [statusHit];
  return closestCenter(args);
};

export function dropHintFromEvent(
  event: DragMoveEvent | DragEndEvent,
): DropHint | null {
  if (!event.over || event.over.id === event.active.id) return null;
  const rect = event.over.rect;
  const header = Boolean(parseStatusGroupDropId(event.over.id));
  const y = pointerYFromEvent(event) ?? rect.top + rect.height / 2;
  const edge: DropEdge =
    header || y >= rect.top + rect.height / 2 ? "after" : "before";
  return {
    overId: String(event.over.id),
    edge,
    header,
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  };
}

export function insertAtEdge(
  ids: string[],
  activeId: string,
  overId: string | null,
  edge: DropEdge,
  atStart: boolean,
): string[] {
  const without = ids.filter((id) => id !== activeId);
  if (atStart || !overId) {
    without.unshift(activeId);
    return without;
  }
  const overIndex = without.indexOf(overId);
  const insertAt =
    overIndex < 0
      ? without.length
      : edge === "after"
        ? overIndex + 1
        : overIndex;
  without.splice(insertAt, 0, activeId);
  return without;
}

export function TaskDropLine({ hint }: { hint: DropHint }) {
  if (typeof document === "undefined") return null;
  const top =
    hint.edge === "before" ? hint.rect.top : hint.rect.top + hint.rect.height;
  return createPortal(
    <div
      className="pointer-events-none flex items-center"
      style={{
        position: "fixed",
        top,
        left: hint.rect.left + 4,
        width: Math.max(24, hint.rect.width - 8),
        height: 12,
        zIndex: 1100,
        transform: "translateY(-50%)",
      }}
      aria-hidden="true"
    >
      <span className="size-3 shrink-0 rounded-full bg-blue-500" />
      <span className="-ml-0.5 h-1.5 flex-1 rounded-full bg-blue-500" />
    </div>,
    document.body,
  );
}
