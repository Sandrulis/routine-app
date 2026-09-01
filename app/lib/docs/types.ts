export type DocsCategorySummary = {
  id: string;
  slug: string;
  icon: string;
  title: string;
  titlesByLanguage: Record<string, string>;
  sortOrder: number;
  articleCount: number;
  isVisible: boolean;
};

export type DocsCategoryInput = {
  title: string;
  icon: string;
  slug?: string;
  languageCode?: string;
  titles?: Record<string, string>;
};

export type DocsArticleSummary = {
  id: string;
  categoryId: string;
  slug: string;
  title: string;
  sortOrder: number;
  isVisible: boolean;
};

export type DocsArticleTranslation = {
  title: string;
  slogan: string;
  content: string;
};

export type DocsArticleDetail = DocsArticleSummary & {
  slogan: string;
  content: string;
  categorySlug: string;
  categoryTitle: string;
  categoryIcon: string;
  translations: Record<string, DocsArticleTranslation>;
};

export type DocsArticleInput = {
  title: string;
  slogan?: string;
  content: string;
  slug?: string;
  languageCode?: string;
  translations?: Record<string, DocsArticleTranslation>;
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
