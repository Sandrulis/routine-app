"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";

export type CreateItemOption = {
  id: string;
  icon: string;
  iconWrapClassName?: string;
  title: string;
  description?: string;
  dividerBefore?: boolean;
  danger?: boolean;
};

export type CreateMenuAnchor = {
  top: number;
  right: number;
  bottom: number;
};

export function createMenuAnchorFromEvent(
  event: MouseEvent<HTMLElement>,
): CreateMenuAnchor {
  const rect = event.currentTarget.getBoundingClientRect();
  return { top: rect.top, right: rect.right, bottom: rect.bottom };
}

export function CreateItemMenu({
  open,
  anchor,
  title,
  items,
  onSelect,
  onClose,
}: {
  open: boolean;
  anchor: CreateMenuAnchor | null;
  title: string;
  items: CreateItemOption[];
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !anchor || !menuRef.current) {
      setPosition(null);
      return;
    }

    const width = menuRef.current.offsetWidth;
    const height = menuRef.current.offsetHeight;
    const left = Math.min(anchor.right + 8, window.innerWidth - 12 - width);
    const top = Math.min(
      Math.max(12, anchor.top),
      window.innerHeight - 12 - height,
    );
    setPosition({ top, left: Math.max(12, left) });
  }, [anchor, open]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: globalThis.MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose, open]);

  if (!open || !anchor) return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      data-app-modal-ignore-backdrop=""
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        top: position?.top ?? anchor.top,
        left: position?.left ?? anchor.right + 8,
        zIndex: 80,
        opacity: position ? 1 : 0,
      }}
      className="w-[14.4rem] rounded-xl border border-zinc-100 bg-white p-1.5 shadow-xl"
    >
      <p className="px-2 py-1 text-[10px] font-medium text-zinc-400">{title}</p>
      <div className="flex flex-col">
        {items.map((item) => (
          <div key={item.id}>
            {item.dividerBefore ? (
              <div className="my-0.5 border-t border-zinc-100" />
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => onSelect(item.id)}
              className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition ${
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "hover:bg-zinc-100"
              }`}
            >
              {item.iconWrapClassName ? (
                <span
                  className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded ${item.iconWrapClassName}`}
                >
                  <i className={`${item.icon} text-[10px]`} aria-hidden="true" />
                </span>
              ) : (
                <i
                  className={`${item.icon} mt-0.5 w-4 text-center text-[12px] ${
                    item.danger ? "text-red-600" : "text-zinc-700"
                  }`}
                  aria-hidden="true"
                />
              )}
              <span className="min-w-0">
                <span
                  className={`block text-[11px] font-semibold ${
                    item.danger ? "text-red-600" : "text-zinc-900"
                  }`}
                >
                  {item.title}
                </span>
                {item.description ? (
                  <span className="mt-0.5 block text-[10px] leading-snug text-zinc-500">
                    {item.description}
                  </span>
                ) : null}
              </span>
            </button>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
