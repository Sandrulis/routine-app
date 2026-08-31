"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ListBadge } from "@/app/components/list-badge";
import { useTranslations } from "@/app/components/translations-provider";
import { localePath, stripLocalePrefix } from "@/app/lib/seo/locale-path";
import { DEFAULT_SITE_LOGO_COLOR } from "@/app/lib/site-admin/branding";
import { renderDocsPlaceholders } from "@/app/lib/docs/placeholders";
import type { DocsNavCategory } from "@/app/lib/docs/types";

function docsActiveSlugs(pathname: string): {
  categorySlug?: string;
  articleSlug?: string;
} {
  const parts = stripLocalePrefix(pathname).split("/").filter(Boolean);
  if (parts[0] !== "docs") return {};
  return { categorySlug: parts[1], articleSlug: parts[2] };
}

export function DocsSidebar({
  categories,
  logoUrl,
  logoColor,
  systemName,
  showLanguageSwitcher = false,
  mobileOpen = false,
  onClose,
}: {
  categories: DocsNavCategory[];
  logoUrl: string | null;
  logoColor: string;
  systemName: string;
  showLanguageSwitcher?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { categorySlug: activeCategorySlug, articleSlug: activeArticleSlug } =
    docsActiveSlugs(pathname);
  const { t, languageCode, languages } = useTranslations();
  const showSwitcher = showLanguageSwitcher && languages.length > 1;
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const category of categories) {
      initial[category.id] =
        category.slug === activeCategorySlug || categories.length <= 4;
    }
    return initial;
  });

  useEffect(() => {
    if (!activeCategorySlug) return;
    const active = categories.find((category) => category.slug === activeCategorySlug);
    if (!active) return;
    setOpenIds((current) =>
      current[active.id] ? current : { ...current, [active.id]: true },
    );
  }, [activeCategorySlug, categories]);

  function toggle(id: string) {
    setOpenIds((current) => ({ ...current, [id]: !current[id] }));
  }

  return (
    <aside
      id="docs-sidebar"
      className={`h-dvh w-[17.5rem] shrink-0 flex-col border-r border-zinc-200 bg-white ${
        mobileOpen
          ? "fixed inset-y-0 left-0 z-50 flex shadow-xl lg:static lg:z-auto lg:shadow-none"
          : "hidden lg:flex"
      }`}
    >
      <div className="border-b border-zinc-200 px-4 py-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={localePath("/", languageCode)}
            className="inline-flex min-w-0 items-center gap-2 text-sm font-semibold text-zinc-900"
          >
            <ListBadge
              name={systemName}
              icon={null}
              color={logoColor || DEFAULT_SITE_LOGO_COLOR}
              logoUrl={logoUrl}
              size="md"
            />
            <span className="min-w-0 truncate">{systemName}</span>
          </Link>
          <div className="lg:hidden">
            <IconActionButton
              label={t("actions.close", "Aizvērt")}
              icon="fas fa-xmark"
              variant="muted"
              onClick={() => onClose?.()}
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
          {t("docs.title", "Dokumentācija")}
        </p>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:thin]">
        {categories.length === 0 ? (
          <p className="px-2 text-sm text-zinc-500">
            {t("docs.empty", "Dokumentācija vēl nav sagatavota.")}
          </p>
        ) : (
          <ul className="space-y-4">
            {categories.map((category) => {
              const open = openIds[category.id] ?? false;
              const categoryActive = category.slug === activeCategorySlug;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    onClick={() => toggle(category.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[15px] font-medium transition ${
                      categoryActive
                        ? "text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                    }`}
                    aria-expanded={open}
                  >
                    <i
                      className={`${category.icon} w-4 text-center text-[13px] text-zinc-400`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate">
                      {renderDocsPlaceholders(category.title, systemName)}
                    </span>
                  </button>
                  {open ? (
                    <ul className="relative mt-1 ml-3 space-y-0.5 border-l border-zinc-200 pl-3">
                      {category.articles.length === 0 ? (
                        <li className="px-2 py-1 text-[13px] text-zinc-500">
                          {t("docs.empty_category", "Šajā sadaļā vēl nav lapu.")}
                        </li>
                      ) : (
                        category.articles.map((article) => {
                          const active =
                            category.slug === activeCategorySlug &&
                            article.slug === activeArticleSlug;
                          return (
                            <li key={article.id}>
                              <Link
                                href={localePath(
                                  `/docs/${category.slug}/${article.slug}`,
                                  languageCode,
                                )}
                                className={`relative block rounded-md px-2 py-1.5 text-[13px] transition ${
                                  active
                                    ? "bg-sky-50 font-medium text-zinc-900"
                                    : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
                                }`}
                              >
                                {active ? (
                                  <span className="absolute top-1/2 -left-[calc(0.75rem+1px)] h-5 w-0.5 -translate-y-1/2 rounded-full bg-sky-500" />
                                ) : null}
                                {renderDocsPlaceholders(article.title, systemName)}
                              </Link>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </nav>
      {showSwitcher ? (
        <div className="border-t border-zinc-200 px-4 py-3">
          <LanguageSwitcher variant="menu" />
        </div>
      ) : null}
    </aside>
  );
}
