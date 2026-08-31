"use client";

import Link from "next/link";
import { useTranslations } from "@/app/components/translations-provider";
import type { DocsPagerTarget } from "@/app/lib/docs/adjacent";
import { renderDocsPlaceholders } from "@/app/lib/docs/placeholders";
import { localePath } from "@/app/lib/seo/locale-path";

function PagerLink({
  target,
  direction,
}: {
  target: DocsPagerTarget;
  direction: "previous" | "next";
}) {
  const { t, languageCode, systemName } = useTranslations();
  const isNext = direction === "next";
  const label = isNext
    ? t("docs.next", "Nākamais")
    : t("docs.previous", "Iepriekšējais");

  return (
    <Link
      href={localePath(`/docs/${target.categorySlug}/${target.articleSlug}`, languageCode)}
      className={`flex min-w-0 max-w-[calc(50%-0.5rem)] cursor-pointer flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-50 ${
        isNext ? "ml-auto items-end text-right" : "items-start text-left"
      }`}
    >
      <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400">
        {isNext ? null : <i className="fas fa-arrow-left text-[10px]" aria-hidden="true" />}
        {label}
        {isNext ? <i className="fas fa-arrow-right text-[10px]" aria-hidden="true" /> : null}
      </span>
      <span className="w-full truncate text-sm font-medium text-zinc-900">
        {renderDocsPlaceholders(target.title, systemName)}
      </span>
    </Link>
  );
}

export function DocsArticlePager({
  previous,
  next,
}: {
  previous: DocsPagerTarget | null;
  next: DocsPagerTarget | null;
}) {
  if (!previous && !next) return null;

  return (
    <nav className="mt-16 flex items-start justify-between gap-4 border-t border-zinc-200 pt-8">
      {previous ? <PagerLink target={previous} direction="previous" /> : <span />}
      {next ? <PagerLink target={next} direction="next" /> : null}
    </nav>
  );
}
