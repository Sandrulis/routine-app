"use client";

import {
  createContext,
  memo,
  useContext,
  useId,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type DraggableAttributes,
  type Modifier,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  SortableContext,
  useSortable,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { pointerYFromEvent } from "@/app/lib/dnd/pointer-y-from-event";
import type { NavTreeDropIntent, NavTreeItemData } from "@/app/lib/nav-tree-move";

type NavTreeDragState = {
  activeId: string | null;
  overId: string | null;
  intent: NavTreeDropIntent | null;
};

type IndicatorRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const NavTreeDragContext = createContext<NavTreeDragState>({
  activeId: null,
  overId: null,
  intent: null,
});

export function useNavTreeDrag() {
  return useContext(NavTreeDragContext);
}

const frozenStrategy: SortingStrategy = () => null;

const overlayBesideCursor: Modifier = ({
  activatorEvent,
  activeNodeRect,
  transform,
}) => {
  if (
    !activeNodeRect ||
    !activatorEvent ||
    !("clientX" in activatorEvent) ||
    !("clientY" in activatorEvent)
  ) {
    return { ...transform, x: transform.x + 16, y: transform.y + 12 };
  }
  const pointer = activatorEvent as PointerEvent;
  return {
    ...transform,
    x: transform.x + (pointer.clientX - activeNodeRect.left) + 14,
    y: transform.y + (pointer.clientY - activeNodeRect.top) + 10,
  };
};

const navTreeCollision: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length === 0) return closestCenter(args);
  return pointerHits.slice().sort((left, right) => {
    const leftRect = args.droppableRects.get(left.id);
    const rightRect = args.droppableRects.get(right.id);
    const leftArea = leftRect ? leftRect.width * leftRect.height : Number.POSITIVE_INFINITY;
    const rightArea = rightRect ? rightRect.width * rightRect.height : Number.POSITIVE_INFINITY;
    return leftArea - rightArea;
  });
};

function dropIntent(
  overRect: { top: number; height: number },
  pointerY: number | null,
  overKind: string | undefined,
): NavTreeDropIntent {
  const y = pointerY ?? overRect.top + overRect.height / 2;
  const top = overRect.top;
  const bottom = overRect.top + overRect.height;
  if (overKind === "group-end") return "before";
  if (overKind === "folder") {
    const edge = Math.max(10, Math.round(overRect.height * 0.35));
    if (y <= top + edge) return "before";
    if (y >= bottom - edge) return "after";
    return "inside";
  }
  if (overKind === "list-root") return "inside";
  return y < top + overRect.height / 2 ? "before" : "after";
}

function intentFromEvent(
  event: DragMoveEvent | DragEndEvent,
): { overId: string; intent: NavTreeDropIntent; rect: IndicatorRect } | null {
  if (!event.over) return null;
  const overKind = (event.over.data.current as { kind?: string } | undefined)?.kind;
  const rect = event.over.rect;
  return {
    overId: String(event.over.id),
    intent: dropIntent(rect, pointerYFromEvent(event), overKind),
    rect: {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    },
  };
}

function DropIndicator({
  intent,
  rect,
}: {
  intent: NavTreeDropIntent;
  rect: IndicatorRect;
}) {
  if (typeof document === "undefined") return null;

  if (intent === "inside") {
    return createPortal(
      <div
        className="pointer-events-none rounded-md ring-2 ring-inset ring-blue-500"
        style={{
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          zIndex: 1100,
        }}
        aria-hidden="true"
      />,
      document.body,
    );
  }

  const top = intent === "before" ? rect.top : rect.top + rect.height;
  return createPortal(
    <div
      className="pointer-events-none flex items-center"
      style={{
        position: "fixed",
        top,
        left: rect.left + 6,
        width: Math.max(24, rect.width - 12),
        height: 10,
        zIndex: 1100,
        transform: "translateY(-50%)",
      }}
      aria-hidden="true"
    >
      <span className="size-2.5 shrink-0 rounded-full bg-blue-500" />
      <span className="-ml-0.5 h-1 flex-1 rounded-full bg-blue-500" />
    </div>,
    document.body,
  );
}

export function NavTreeDnd({
  renderOverlay,
  onPlace,
  children,
}: {
  renderOverlay?: (activeId: string) => ReactNode;
  onPlace: (activeId: string, overId: string, intent: NavTreeDropIntent) => void;
  children: ReactNode;
}) {
  const generatedId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [intent, setIntent] = useState<NavTreeDropIntent | null>(null);
  const [indicatorRect, setIndicatorRect] = useState<IndicatorRect | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const value = useMemo(
    () => ({ activeId, overId, intent }),
    [activeId, intent, overId],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
    setOverId(null);
    setIntent(null);
    setIndicatorRect(null);
  }

  function handleDragMove(event: DragMoveEvent) {
    const next = intentFromEvent(event);
    if (!next) {
      setOverId(null);
      setIntent(null);
      setIndicatorRect(null);
      return;
    }
    setOverId(next.overId);
    setIntent(next.intent);
    setIndicatorRect(next.rect);
  }

  function handleDragEnd(event: DragEndEvent) {
    const nextActive = String(event.active.id);
    const next = intentFromEvent(event);
    setActiveId(null);
    setOverId(null);
    setIntent(null);
    setIndicatorRect(null);
    if (!next || nextActive === next.overId) return;
    onPlace(nextActive, next.overId, next.intent);
  }

  return (
    <NavTreeDragContext.Provider value={value}>
      <DndContext
        id={generatedId}
        sensors={sensors}
        collisionDetection={navTreeCollision}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragOver={handleDragMove}
        onDragCancel={() => {
          setActiveId(null);
          setOverId(null);
          setIntent(null);
          setIndicatorRect(null);
        }}
        onDragEnd={handleDragEnd}
      >
        {children}
        {intent && indicatorRect ? (
          <DropIndicator intent={intent} rect={indicatorRect} />
        ) : null}
        <DragOverlay
          dropAnimation={null}
          zIndex={999}
          modifiers={[overlayBesideCursor]}
          className="pointer-events-none"
        >
          {activeId && renderOverlay ? renderOverlay(activeId) : null}
        </DragOverlay>
      </DndContext>
    </NavTreeDragContext.Provider>
  );
}

export function NavTreeSortableGroup({
  itemIds,
  children,
}: {
  itemIds: string[];
  children: ReactNode;
}) {
  if (itemIds.length === 0) return children;
  return (
    <SortableContext items={itemIds} strategy={frozenStrategy}>
      {children}
    </SortableContext>
  );
}

export type NavTreeSortableHandle = {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
  setNodeRef: (node: HTMLElement | null) => void;
  style: CSSProperties;
};

export const NavTreeSortableItem = memo(function NavTreeSortableItem({
  id,
  data,
  disabled = false,
  children,
}: {
  id: string;
  data: NavTreeItemData;
  disabled?: boolean;
  children: (handle: NavTreeSortableHandle) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useSortable({
    id,
    data,
    disabled,
    animateLayoutChanges: () => false,
  });

  const style: CSSProperties = isDragging ? { opacity: 0.4 } : {};

  return children({ attributes, listeners, isDragging, setNodeRef, style });
});

export function NavTreeEndDrop({
  id,
  disabled = false,
}: {
  id: string;
  disabled?: boolean;
}) {
  const { setNodeRef } = useDroppable({
    id,
    disabled,
    data: { kind: "group-end" },
  });
  return (
    <div
      ref={setNodeRef}
      className="h-4"
      aria-hidden="true"
    />
  );
}

export function NavTreeRootDrop({
  id,
  disabled = false,
  children,
}: {
  id: string;
  disabled?: boolean;
  children: (args: {
    setNodeRef: (node: HTMLElement | null) => void;
    isOver: boolean;
  }) => ReactNode;
}) {
  const drag = useNavTreeDrag();
  const { setNodeRef } = useDroppable({
    id,
    disabled,
    data: { kind: "list-root" },
  });
  return children({
    setNodeRef,
    isOver: drag.overId === id && drag.intent === "inside",
  });
}
