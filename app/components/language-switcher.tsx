"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { setLanguageAction } from "@/app/lib/i18n/actions";
import {
  languageFlagEmoji,
  sortSwitcherLanguages,
  type LanguageCode,
} from "@/app/lib/i18n/language";
import {
  hreflangValue,
  isPublicLocalizedPath,
  localePath,
} from "@/app/lib/seo/locale-path";

const MENU_WIDTH_PX = 224;

function LanguageFlag({
  code,
  className = "inline-flex shrink-0 items-center justify-center text-[1.35rem] leading-none",
}: {
  code: LanguageCode;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true" translate="no">
      {languageFlagEmoji(code)}
    </span>
  );
}

function pathForLanguage(pathname: string, next: LanguageCode): string {
  const fallback = localePath(pathname, next);
  if (typeof document === "undefined") return fallback;
  const link = document.querySelector(
    `link[rel="alternate"][hreflang="${hreflangValue(next)}"]`,
  );
  if (!(link instanceof HTMLLinkElement) || !link.href) return fallback;
  try {
    const url = new URL(link.href);
    if (url.origin !== window.location.origin) return fallback;
    return url.pathname || fallback;
  } catch {
    return fallback;
  }
}

export function LanguageSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "stacked" | "menu";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { languageCode, languages, t } = useTranslations();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);
  const options = sortSwitcherLanguages(languages);
  const current = options.find((language) => language.code === languageCode);
  const label = t("settings.language.title", "Valoda");

  function switchLanguage(next: LanguageCode) {
    if (next === languageCode) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setLanguageAction(next);
      setOpen(false);
      if (isPublicLocalizedPath(pathname)) {
        router.push(pathForLanguage(pathname, next));
      } else {
        router.refresh();
      }
    });
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
      let left = rect.left;
      if (left + MENU_WIDTH_PX > window.innerWidth - 8) {
        left = rect.right - MENU_WIDTH_PX;
      }
      left = Math.min(
        Math.max(8, left),
        window.innerWidth - MENU_WIDTH_PX - 8,
      );
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 220;
      const next: {
        left: number;
        top?: number;
        bottom?: number;
        maxHeight: number;
      } = openUp
        ? {
            left,
            bottom: window.innerHeight - rect.top + 4,
            maxHeight: Math.max(160, rect.top - 16),
          }
        : {
            left,
            top: rect.bottom + 4,
            maxHeight: Math.max(160, window.innerHeight - rect.bottom - 16),
          };
      setMenuPos((current) =>
        current &&
        current.left === next.left &&
        current.top === next.top &&
        current.bottom === next.bottom &&
        current.maxHeight === next.maxHeight
          ? current
          : next,
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
      if (menuRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
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

  if (options.length <= 1) return null;

  if (variant === "menu") {
    return (
      <div ref={menuRef} className="relative shrink-0">
        <OptionalTooltip label={open ? null : label}>
          <button
            ref={triggerRef}
            type="button"
            onClick={() => setOpen((currentOpen) => !currentOpen)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`${label}${current ? `: ${current.name}` : ""}`}
            disabled={pending}
            className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md px-1.5 leading-none transition disabled:cursor-not-allowed disabled:opacity-60 ${
              open
                ? "bg-zinc-100 text-zinc-800"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            }`}
          >
            <LanguageFlag
              code={languageCode}
              className="inline-flex size-6 items-center justify-center text-[1.45rem] leading-none"
            />
          </button>
        </OptionalTooltip>

        {open && menuPos
          ? createPortal(
              <div
                ref={dropdownRef}
                role="menu"
                style={{
                  left: menuPos.left,
                  top: menuPos.top,
                  bottom: menuPos.bottom,
                  maxHeight: menuPos.maxHeight,
                }}
                className="fixed z-[80] w-56 overflow-y-auto overscroll-contain rounded-xl bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
                onWheel={(event) => event.stopPropagation()}
              >
                {options.map((language) => {
                  const active = language.code === languageCode;
                  return (
                    <button
                      key={language.code}
                      type="button"
                      role="menuitem"
                      disabled={pending}
                      onClick={() => switchLanguage(language.code)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                        active ? "font-medium text-zinc-900" : "text-zinc-600"
                      }`}
                    >
                      <LanguageFlag
                        code={language.code}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[2rem] leading-none"
                      />
                      <span className="min-w-0 flex-1 truncate">{language.name}</span>
                      {active ? (
                        <i
                          className="fas fa-check text-[10px] text-zinc-400"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="inline-block w-2.5" aria-hidden="true" />
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

  if (variant === "stacked") {
    return (
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
        {options.map((language) => {
          const active = language.code === languageCode;
          return (
            <button
              key={language.code}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={pending}
              onClick={() => switchLanguage(language.code)}
              className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <LanguageFlag
                code={language.code}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-[2rem] leading-none"
              />
              <span className="min-w-0 flex-1 font-medium">{language.name}</span>
              {active ? (
                <i className="fas fa-check text-[10px] text-white/70" aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5"
      role="radiogroup"
      aria-label={label}
    >
      {options.map((language) => {
        const active = language.code === languageCode;
        return (
          <button
            key={language.code}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={language.name}
            disabled={pending}
            onClick={() => switchLanguage(language.code)}
            className={`inline-flex items-center justify-center rounded-md px-1.5 py-1.5 leading-none transition ${
              active ? "bg-zinc-900" : "hover:bg-zinc-200"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            <LanguageFlag code={language.code} />
          </button>
        );
      })}
    </div>
  );
}
