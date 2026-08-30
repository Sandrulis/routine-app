import { DocsArticlePager } from "@/app/components/docs-article-pager";
import { DocsMarkdown } from "@/app/components/docs-markdown";
import { docsAdjacentArticles } from "@/app/lib/docs/adjacent";
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
  const adjacent = docsAdjacentArticles(categories, article.categorySlug, article.slug);

  return (
    <>
      <p className="text-sm text-zinc-500">
        {article.categoryTitle}
        <span className="px-2 text-zinc-300">›</span>
        {article.title}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">{article.title}</h1>
      {article.slogan.trim() ? (
        <p className="mt-3 text-lg font-normal text-zinc-500">{article.slogan}</p>
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
