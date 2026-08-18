"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { setLanguageAction } from "@/app/lib/i18n/actions";
import type { LanguageCode } from "@/app/lib/i18n/language";

export function LanguageSwitcher({
  variant = "compact",
}: {
  variant?: "compact" | "stacked" | "menu";
}) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { languageCode, languages, t } = useTranslations();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const options = languages;
  const label = t("settings.language.title", "Valoda");

  function switchLanguage(next: LanguageCode) {
    if (next === languageCode) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await setLanguageAction(next);
      setOpen(false);
      router.refresh();
    });
  }

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={label}
            disabled={pending}
            className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-[11px] font-semibold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-60 ${
              open
                ? "bg-zinc-100 text-zinc-800"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            }`}
          >
            {languageCode}
          </button>
        </OptionalTooltip>

        {open ? (
          <div
            role="menu"
            className="absolute top-full right-0 z-[70] mt-1 min-w-[12rem] overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
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
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                    active ? "font-medium text-zinc-900" : "text-zinc-600"
                  }`}
                >
                  <span className="min-w-0 truncate">{language.name}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="font-mono text-[11px] uppercase text-zinc-400">
                      {language.code}
                    </span>
                    {active ? (
                      <i className="fas fa-check text-[10px] text-zinc-400" aria-hidden="true" />
                    ) : (
                      <span className="inline-block w-2.5" aria-hidden="true" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
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
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:bg-zinc-50"
              } disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <span className="font-medium">{language.name}</span>
              <span
                className={`font-mono text-[11px] uppercase ${
                  active ? "text-zinc-300" : "text-zinc-400"
                }`}
              >
                {language.code}
              </span>
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
            disabled={pending}
            onClick={() => switchLanguage(language.code)}
            className={`rounded-md px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:text-zinc-900"
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {language.code}
          </button>
        );
      })}
    </div>
  );
}
