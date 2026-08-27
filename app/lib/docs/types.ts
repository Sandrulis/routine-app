export type DocsCategorySummary = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  sortOrder: number;
  articleCount: number;
  isVisible: boolean;
};

export type DocsCategoryInput = {
  title: string;
  icon: string;
  slug?: string;
};

export type DocsArticleSummary = {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
};

export type DocsArticleDetail = DocsArticleSummary & {
  slogan: string;
  content: string;
  categorySlug: string;
  categoryTitle: string;
  categoryIcon: string;
};

export type DocsArticleInput = {
  title: string;
  slogan?: string;
  content: string;
  slug?: string;
};

export type DocsArticleImage = {
  id: string;
  fileName: string;
};

export type DocsNavCategory = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  articles: DocsArticleSummary[];
};

export type DocsTree = {
  enabled: boolean;
  languageCode: string;
  hasMultipleLanguages: boolean;
  categories: DocsNavCategory[];
};
