"use client";

import { DocsArticlePager } from "@/app/components/docs-article-pager";
import { DocsMarkdown } from "@/app/components/docs-markdown";
import { useTranslations } from "@/app/components/translations-provider";
import { docsAdjacentArticles } from "@/app/lib/docs/adjacent";
import { renderDocsPlaceholders } from "@/app/lib/docs/placeholders";
import type { DocsArticleDetail, DocsNavCategory } from "@/app/lib/docs/types";

export function DocsArticleContent({
  article,
  categories,
  emptyLabel,
}: {
  article: DocsArticleDetail;
  categories: DocsNavCategory[];
  emptyLabel: string;
}) {
  const { systemName } = useTranslations();
  const adjacent = docsAdjacentArticles(categories, article.categorySlug, article.slug);

  return (
    <>
      <p className="text-sm text-zinc-500">
        {renderDocsPlaceholders(article.categoryTitle, systemName)}
        <span className="px-2 text-zinc-300">›</span>
        {renderDocsPlaceholders(article.title, systemName)}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
        {renderDocsPlaceholders(article.title, systemName)}
      </h1>
      {article.slogan.trim() ? (
        <p className="mt-3 text-lg font-normal text-zinc-500">
          {renderDocsPlaceholders(article.slogan, systemName)}
        </p>
      ) : null}
      <div className="mt-8">
        {article.content.trim() ? (
          <DocsMarkdown content={article.content} variant="light" />
        ) : (
          <p className="text-zinc-500">{emptyLabel}</p>
        )}
      </div>
      <DocsArticlePager previous={adjacent.previous} next={adjacent.next} />
    </>
  );
}
