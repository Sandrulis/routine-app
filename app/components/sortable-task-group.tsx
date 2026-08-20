"use client";

import { memo, useId, type CSSProperties, type ReactNode } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useLists } from "@/app/lib/lists-store";

export type SortableTaskHandle = {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
};

export function SortableTaskGroup({
  itemIds,
  contextId,
  onReorder,
  children,
}: {
  itemIds: string[];
  contextId?: string;
  onReorder?: (orderedIds: string[]) => void;
  children: ReactNode;
}) {
  const generatedId = useId();
  const { reorderTasks } = useLists();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = itemIds.indexOf(String(active.id));
    const newIndex = itemIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(itemIds, oldIndex, newIndex);
    (onReorder ?? reorderTasks)(next);
  }

  if (itemIds.length === 0) return children;

  return (
    <DndContext
      id={contextId ?? generatedId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export const SortableTaskItem = memo(function SortableTaskItem({
  id,
  as: Component = "div",
  className,
  disabled = false,
  children,
}: {
  id: string;
  as?: "div" | "li";
  className?: string;
  disabled?: boolean;
  children: (handle: SortableTaskHandle) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Component
      ref={setNodeRef}
      style={style}
      className={`${className ?? ""} ${isDragging ? "relative z-20" : ""}`.trim()}
    >
      {children({ attributes, listeners, isDragging })}
    </Component>
  );
});
