"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import {
  useStatusGroupSortDirection,
  type StatusGroupSortDirection,
} from "@/app/lib/status-group-sort";

const OPTIONS: StatusGroupSortDirection[] = ["asc", "desc"];

export function StatusGroupSortBadge() {
  const { t } = useTranslations();
  const [direction, setDirection] = useStatusGroupSortDirection();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  const prefix = t("status.sort.label", "Statusi");
  const labels: Record<StatusGroupSortDirection, string> = {
    asc: t("status.sort.asc", "Augošā secībā"),
    desc: t("status.sort.desc", "Dilstošā secībā"),
  };

  function labeled(option: StatusGroupSortDirection) {
    return `${prefix}: ${labels[option]}`;
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    if (!triggerRef.current) return;

    function update() {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 120;
      setMenuPos(
        openUp
          ? { left: rect.left, bottom: window.innerHeight - rect.top + 6 }
          : { left: rect.left, top: rect.bottom + 6 },
      );
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative inline-flex">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onPointerDown={(event) => event.stopPropagation()}
        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
          open
            ? "bg-zinc-200 text-zinc-800"
            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-800"
        }`}
      >
        <span>{labeled(direction)}</span>
        <i
          className={`fas fa-chevron-down text-[8px] text-zinc-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              data-app-modal-ignore-backdrop=""
              style={{
                left: menuPos.left,
                top: menuPos.top,
                bottom: menuPos.bottom,
              }}
              className="fixed z-[80] min-w-[11.5rem] rounded-2xl bg-white p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
              onMouseDown={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {OPTIONS.map((option) => {
                const active = option === direction;
                return (
                  <button
                    key={option}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setDirection(option);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-zinc-800 transition hover:bg-zinc-100"
                  >
                    <span className="min-w-0 flex-1">{labeled(option)}</span>
                    {active ? (
                      <i
                        className="fas fa-check text-[11px] text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="inline-block w-3" aria-hidden="true" />
                    )}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
