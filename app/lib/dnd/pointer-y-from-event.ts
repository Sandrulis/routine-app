import type { DragEndEvent, DragMoveEvent } from "@dnd-kit/core";

/** Pointer Y during a dnd-kit drag (activator + delta, else active rect center). */
export function pointerYFromEvent(
  event: DragMoveEvent | DragEndEvent,
): number | null {
  const activator = event.activatorEvent;
  if (
    activator &&
    "clientY" in activator &&
    typeof (activator as PointerEvent).clientY === "number"
  ) {
    return (activator as PointerEvent).clientY + event.delta.y;
  }
  const translated = event.active.rect.current.translated;
  return translated ? translated.top + translated.height / 2 : null;
}
