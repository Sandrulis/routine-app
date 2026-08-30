"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DocsSidebar } from "@/app/components/docs-sidebar";
import { LoadingState } from "@/app/components/loading-state";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import type { DocsNavCategory } from "@/app/lib/docs/types";
import { stripLocalePrefix } from "@/app/lib/seo/locale-path";

function docsPathFromHref(href: string): string | null {
  try {
    return stripLocalePrefix(new URL(href, window.location.href).pathname);
  } catch {
    const path = href.split("?")[0]?.split("#")[0] ?? "";
    return path ? stripLocalePrefix(path) : null;
  }
}

function isModifiedClick(event: MouseEvent): boolean {
  return (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  );
}

export function DocsShell({
  categories,
  logoUrl,
  logoColor,
  systemName,
  showLanguageSwitcher = false,
  children,
}: {
  categories: DocsNavCategory[];
  logoUrl: string | null;
  logoColor: string;
  systemName: string;
  showLanguageSwitcher?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [articlePending, setArticlePending] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setArticlePending(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function onClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || isModifiedClick(event)) return;
    const anchor = (event.target as HTMLElement | null)?.closest("a");
    if (!anchor || anchor.target === "_blank") return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    const nextPath = docsPathFromHref(href);
    if (!nextPath?.startsWith("/docs/")) return;
    if (nextPath === stripLocalePrefix(pathname)) {
      setMenuOpen(false);
      return;
    }
    setMenuOpen(false);
    setArticlePending(true);
  }

  return (
    <div
      className="flex h-dvh overflow-hidden bg-zinc-100 text-zinc-900"
      onClickCapture={onClickCapture}
    >
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-900/40 md:hidden"
          aria-label={t("actions.close", "Aizvērt")}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <DocsSidebar
        categories={categories}
        logoUrl={logoUrl}
        logoColor={logoColor}
        systemName={systemName}
        showLanguageSwitcher={showLanguageSwitcher}
        mobileOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b border-zinc-200 bg-white px-3 py-2 md:hidden">
          <Tooltip label={t("docs.menu.open", "Atvērt izvēlni")} align="start">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              aria-label={t("docs.menu.open", "Atvērt izvēlni")}
              aria-expanded={menuOpen}
              aria-controls="docs-sidebar"
              onClick={() => setMenuOpen(true)}
            >
              <i className="fas fa-bars text-lg" aria-hidden="true" />
            </button>
          </Tooltip>
          <span className="min-w-0 truncate text-sm font-semibold text-zinc-900">
            {t("docs.title", "Dokumentācija")}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="max-w-3xl px-6 py-10 sm:px-8 sm:py-12">
            {articlePending ? <LoadingState /> : children}
          </div>
        </div>
      </main>
    </div>
  );
}
