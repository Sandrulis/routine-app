"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "@/app/components/translations-provider";
import { listColorById, listInitials, LIST_COLORS, LIST_ICON_OPTIONS } from "@/app/lib/lists";

function iconSearchText(className: string) {
  return className.replace(/^fas fa-/, "").replace(/-/g, " ");
}

export function ListAppearancePicker({
  open,
  triggerRef,
  name,
  icon,
  color,
  showIcons = true,
  onIconChange,
  onColorChange,
  onClose,
}: {
  open: boolean;
  triggerRef: RefObject<HTMLElement | null>;
  name: string;
  icon: string | null;
  color: string;
  showIcons?: boolean;
  onIconChange: (icon: string | null) => void;
  onColorChange: (color: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslations();
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  const tone = listColorById(color);
  const isPresetColor = LIST_COLORS.some(
    (option) => option.id === color || option.bg.toLowerCase() === tone.bg.toLowerCase(),
  );

  const filteredIcons = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [...LIST_ICON_OPTIONS];
    return LIST_ICON_OPTIONS.filter((option) =>
      iconSearchText(option).includes(needle),
    );
  }, [query]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) {
      setPosition(null);
      return;
    }

    const trigger = triggerRef.current.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, trigger.left),
      window.innerWidth - 12 - panel.width,
    );
    const top = Math.min(
      trigger.bottom + 8,
      window.innerHeight - 12 - panel.height,
    );
    setPosition({ top: Math.max(12, top), left });
  }, [open, query, triggerRef]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    if (showIcons) searchRef.current?.focus();

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [onClose, open, showIcons, triggerRef]);

  if (!open) return null;

  const initials = listInitials(name);
  const colorGrid = (
    <div className={`grid gap-1.5 ${showIcons ? "grid-cols-3" : "grid-cols-6"}`}>
      {LIST_COLORS.map((option) => {
        const selected =
          option.id === color ||
          option.bg.toLowerCase() === tone.bg.toLowerCase();
        return (
          <button
            key={option.id}
            type="button"
            aria-label={t(`lists.colors.${option.id}`, option.id)}
            aria-pressed={selected}
            onClick={() => onColorChange(option.id)}
            className={`size-6 rounded-full border-2 transition ${
              selected
                ? "border-zinc-900"
                : "border-transparent hover:border-zinc-300"
            }`}
            style={{ backgroundColor: option.bg }}
          />
        );
      })}
      <label
        className={`relative inline-flex size-6 cursor-pointer overflow-hidden rounded-full border-2 ${
          isPresetColor
            ? "border-dashed border-zinc-300 hover:border-zinc-400"
            : "border-solid border-zinc-900"
        }`}
      >
        <span
          className="absolute inset-0.5 rounded-full"
          style={{
            background: isPresetColor
              ? "conic-gradient(#ef4444, #eab308, #22c55e, #3b82f6, #a855f7, #ef4444)"
              : tone.bg,
          }}
        />
        <input
          type="color"
          value={tone.bg}
          aria-label={t("lists.fields.custom_color", "Pielāgota krāsa")}
          onChange={(event) => onColorChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );

  return createPortal(
    <div
      ref={panelRef}
      data-app-modal-ignore-backdrop=""
      role="dialog"
      aria-label={
        showIcons
          ? t("lists.fields.appearance", "Izskats")
          : t("lists.fields.color", "Krāsa")
      }
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        zIndex: 80,
        opacity: position ? 1 : 0,
      }}
      className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
    >
      {showIcons ? (
        <div className="flex">
          <div className="flex h-0 min-h-full w-[18.5rem] flex-col p-2.5">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              placeholder={t("lists.fields.icon_search", "Meklēt...")}
              className="min-h-9 w-full shrink-0 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto [scrollbar-width:thin]">
              {filteredIcons.length === 0 && query.trim() ? (
                <p className="px-1 py-6 text-center text-[13px] text-zinc-400">
                  {t("lists.fields.icon_empty", "Nav atbilstošu ikonu.")}
                </p>
              ) : (
                <div className="grid grid-cols-7 gap-0.5">
                  {!query.trim() ? (
                    <button
                      type="button"
                      aria-label={t("lists.fields.icon_initials", "Iniciāļi")}
                      aria-pressed={icon === null}
                      onClick={() => onIconChange(null)}
                      className={`inline-flex size-8 items-center justify-center rounded-lg text-[11px] font-semibold transition ${
                        icon === null
                          ? "bg-zinc-900 text-white"
                          : "text-zinc-600 hover:bg-zinc-100"
                      }`}
                    >
                      {initials}
                    </button>
                  ) : null}
                  {filteredIcons.map((option) => {
                    const selected = icon === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        aria-label={iconSearchText(option)}
                        aria-pressed={selected}
                        onClick={() => onIconChange(option)}
                        className={`inline-flex size-8 items-center justify-center rounded-lg text-sm transition ${
                          selected
                            ? "bg-zinc-900 text-white"
                            : "text-zinc-600 hover:bg-zinc-100"
                        }`}
                      >
                        <i className={option} aria-hidden="true" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="w-[6.75rem] border-l border-zinc-100 p-2.5">{colorGrid}</div>
        </div>
      ) : (
        <div className="p-2.5">{colorGrid}</div>
      )}
    </div>,
    document.body,
  );
}
