import { DocsArticlePager } from "@/app/components/docs-article-pager";
import { DocsMarkdown } from "@/app/components/docs-markdown";
import { DocsSidebar } from "@/app/components/docs-sidebar";
import { docsAdjacentArticles } from "@/app/lib/docs/adjacent";
import type { DocsArticleDetail, DocsNavCategory } from "@/app/lib/docs/types";

export function DocsShell({
  categories,
  article,
  logoUrl,
  logoColor,
  systemName,
  emptyLabel,
  showLanguageSwitcher = false,
}: {
  categories: DocsNavCategory[];
  article: DocsArticleDetail | null;
  logoUrl: string | null;
  logoColor: string;
  systemName: string;
  emptyLabel: string;
  showLanguageSwitcher?: boolean;
}) {
  const adjacent = article
    ? docsAdjacentArticles(categories, article.categorySlug, article.slug)
    : { previous: null, next: null };

  return (
    <div className="flex h-dvh overflow-hidden bg-zinc-100 text-zinc-900">
      <DocsSidebar
        categories={categories}
        activeCategorySlug={article?.categorySlug}
        activeArticleSlug={article?.slug}
        logoUrl={logoUrl}
        logoColor={logoColor}
        systemName={systemName}
        showLanguageSwitcher={showLanguageSwitcher}
      />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="max-w-3xl px-6 py-10 sm:px-8 sm:py-12">
          {article ? (
            <>
              <p className="text-sm text-zinc-500">
                {article.categoryTitle}
                <span className="px-2 text-zinc-300">›</span>
                {article.title}
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-zinc-900">
                {article.title}
              </h1>
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
          ) : (
            <p className="text-zinc-500">{emptyLabel}</p>
          )}
        </div>
      </main>
    </div>
  );
}
