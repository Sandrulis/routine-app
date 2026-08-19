"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CreateMenuAnchor } from "@/app/components/create-item-menu";
import { useTranslations } from "@/app/components/translations-provider";
import {
  getTaskAncestors,
  getTaskTree,
  isTaskDeleted,
  isWorkItemArchived,
  workItemIcon,
  type WorkTask,
} from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";

export function MoveSubtaskModal({
  open,
  task,
  anchor,
  onOpenChange,
}: {
  open: boolean;
  task: WorkTask | null;
  anchor: CreateMenuAnchor | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { tasks, moveSubtask } = useLists();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const destinations = task
    ? getTaskTree(tasks, task.listId).filter(
        (item) =>
          item.kind === "task" &&
          item.id !== task.parentId &&
          !isTaskDeleted(item) &&
          !isWorkItemArchived(item),
      )
    : [];

  useLayoutEffect(() => {
    if (!open || !anchor || !menuRef.current) {
      setPosition(null);
      return;
    }

    const width = menuRef.current.offsetWidth;
    const height = menuRef.current.offsetHeight;
    const left = Math.min(
      Math.max(12, anchor.right - width),
      window.innerWidth - 12 - width,
    );
    const below = anchor.bottom + 6;
    const top =
      below + height > window.innerHeight - 12
        ? Math.max(12, anchor.top - 6 - height)
        : below;
    setPosition({ top, left: Math.max(12, left) });
  }, [anchor, destinations.length, open]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onOpenChange, open]);

  function handleMove(parentId: string) {
    if (!task) return;
    moveSubtask(task.id, parentId);
    onOpenChange(false);
  }

  if (!open || !anchor) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      aria-label={t("actions.move", "Pārvietot")}
      data-app-modal-ignore-backdrop=""
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        top: position?.top ?? anchor.bottom + 6,
        left: position?.left ?? Math.max(12, anchor.right - 224),
        zIndex: 80,
        opacity: position ? 1 : 0,
      }}
      className="w-56 overflow-hidden rounded-xl border border-zinc-100 bg-white p-1.5 shadow-xl"
    >
      <p className="px-2 py-1 text-[10px] font-medium text-zinc-400">
        {t("actions.move", "Pārvietot")}
      </p>
      {destinations.length === 0 ? (
        <p className="px-2 py-2 text-[13px] text-zinc-500">
          {t("subtasks.move.empty", "Sarakstā nav citu uzdevumu.")}
        </p>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {destinations.map((item) => {
            const depth = getTaskAncestors(tasks, item).length;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => handleMove(item.id)}
                style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-700 transition hover:bg-zinc-100"
              >
                <i
                  className={`${workItemIcon(item)} w-4 text-center text-[12px] text-zinc-400`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>,
    document.body,
  );
}
