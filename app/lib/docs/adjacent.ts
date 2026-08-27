import type { DocsNavCategory } from "@/app/lib/docs/types";

export type DocsPagerTarget = {
  title: string;
  categorySlug: string;
  articleSlug: string;
};

export function docsAdjacentArticles(
  categories: DocsNavCategory[],
  categorySlug: string,
  articleSlug: string,
): { previous: DocsPagerTarget | null; next: DocsPagerTarget | null } {
  const items: DocsPagerTarget[] = [];
  for (const category of categories) {
    for (const article of category.articles) {
      items.push({
        title: article.title,
        categorySlug: category.slug,
        articleSlug: article.slug,
      });
    }
  }
  const index = items.findIndex(
    (item) => item.categorySlug === categorySlug && item.articleSlug === articleSlug,
  );
  if (index < 0) return { previous: null, next: null };
  return {
    previous: items[index - 1] ?? null,
    next: items[index + 1] ?? null,
  };
}
