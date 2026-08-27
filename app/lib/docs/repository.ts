import { cache } from "react";
import type { ActionResult } from "@/app/lib/actions/action-result";
import { isValidFileIconInput } from "@/app/lib/file-types";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { isValidDocsSlug, normalizeDocsSlug } from "@/app/lib/docs/slug";
import {
  DOCS_IMAGE_MAX_BYTES,
  DOCS_IMAGE_MAX_PER_ARTICLE,
  isAllowedDocsImageMime,
  isDocsImageId,
  sanitizeDocsImageFileName,
} from "@/app/lib/docs/images";
import type {
  DocsArticleDetail,
  DocsArticleImage,
  DocsArticleInput,
  DocsArticleSummary,
  DocsCategoryInput,
  DocsCategorySummary,
  DocsNavCategory,
  DocsTree,
} from "@/app/lib/docs/types";

const DEFAULT_ICON = "fas fa-book";
const MAX_CONTENT_LENGTH = 200000;
const MAX_SLOGAN_LENGTH = 300;

type CategoryRow = {
  id: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_visible: boolean;
};

type CategoryTranslationRow = {
  category_id: string;
  language_code: string;
  title: string;
};

type ArticleRow = {
  id: string;
  category_id: string;
  slug: string;
  sort_order: number;
  is_visible: boolean;
};

type ArticleTranslationRow = {
  article_id: string;
  language_code: string;
  title: string;
  slogan: string;
  content: string;
};

function dbNotConfigured(): { ok: false; error: string } {
  return { ok: false, error: "errors.db_not_configured" };
}

async function getClient() {
  return createUserServerClient();
}

function pickTranslation<T extends { language_code: string }>(
  rows: T[],
  preferred: string,
  fallback: string,
): T | null {
  return (
    rows.find((row) => row.language_code === preferred) ??
    rows.find((row) => row.language_code === fallback) ??
    rows[0] ??
    null
  );
}

export const getDocsDefaultLanguage = cache(async function getDocsDefaultLanguage(): Promise<string> {
  const languages = await listSiteLanguages();
  return languages.find((language) => language.isDefault)?.code ?? DEFAULT_LANGUAGE;
});

export const isDocsEnabled = cache(async function isDocsEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await getClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("docs_enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return false;
  return (data as { docs_enabled?: boolean }).docs_enabled === true;
});

function someEntityHasMultipleLanguages(
  rows: { id: string | null; language_code: string | null }[],
): boolean {
  const byId = new Map<string, Set<string>>();
  for (const row of rows) {
    const id = row.id;
    const code = row.language_code;
    if (!id || !code) continue;
    const codes = byId.get(id) ?? new Set<string>();
    codes.add(code);
    byId.set(id, codes);
    if (codes.size > 1) return true;
  }
  return false;
}

const docsHasMultipleLanguages = cache(async function docsHasMultipleLanguages(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = await getClient();
  const [{ data: categories }, { data: articles }] = await Promise.all([
    supabase.from("site_docs_category_translations").select("category_id, language_code"),
    supabase.from("site_docs_article_translations").select("article_id, language_code"),
  ]);
  return (
    someEntityHasMultipleLanguages(
      ((categories ?? []) as { category_id: string; language_code: string }[]).map((row) => ({
        id: row.category_id,
        language_code: row.language_code,
      })),
    ) ||
    someEntityHasMultipleLanguages(
      ((articles ?? []) as { article_id: string; language_code: string }[]).map((row) => ({
        id: row.article_id,
        language_code: row.language_code,
      })),
    )
  );
});

export async function setDocsEnabled(enabled: boolean): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const supabase = await getClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ docs_enabled: enabled })
    .eq("id", 1);
  if (error) return { ok: false, error: "errors.docs_enabled_save_failed" };
  return { ok: true };
}

async function nextSortOrder(
  table: "site_docs_categories" | "site_docs_articles",
  filter?: { column: string; value: string },
): Promise<number> {
  const supabase = await getClient();
  let query = supabase.from(table).select("sort_order");
  if (filter) query = query.eq(filter.column, filter.value);
  const { data } = await query.order("sort_order", { ascending: false }).limit(1);
  const max = (data?.[0] as { sort_order?: number } | undefined)?.sort_order ?? 0;
  return max + 10;
}

export const listDocsCategories = cache(async function listDocsCategories(
  languageCode?: string,
): Promise<DocsCategorySummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await getClient();
  const preferred = languageCode ?? (await getDocsDefaultLanguage());
  const fallback = await getDocsDefaultLanguage();

  const [{ data: categories, error: categoryError }, { data: translations }, { data: articles }] =
    await Promise.all([
      supabase
        .from("site_docs_categories")
        .select("id, slug, icon, sort_order, is_visible")
        .order("sort_order", { ascending: true })
        .order("slug", { ascending: true }),
      supabase
        .from("site_docs_category_translations")
        .select("category_id, language_code, title"),
      supabase.from("site_docs_articles").select("id, category_id"),
    ]);

  if (categoryError || !categories) return [];

  const translationByCategory = new Map<string, CategoryTranslationRow[]>();
  for (const row of (translations ?? []) as CategoryTranslationRow[]) {
    const list = translationByCategory.get(row.category_id) ?? [];
    list.push(row);
    translationByCategory.set(row.category_id, list);
  }

  const countByCategory = new Map<string, number>();
  for (const row of (articles ?? []) as { category_id: string }[]) {
    countByCategory.set(row.category_id, (countByCategory.get(row.category_id) ?? 0) + 1);
  }

  return (categories as CategoryRow[]).map((row) => {
    const translation = pickTranslation(
      translationByCategory.get(row.id) ?? [],
      preferred,
      fallback,
    );
    return {
      id: row.id,
      slug: row.slug,
      icon: row.icon,
      title: translation?.title ?? row.slug,
      sortOrder: row.sort_order,
      articleCount: countByCategory.get(row.id) ?? 0,
      isVisible: row.is_visible !== false,
    };
  });
});

export const getDocsCategory = cache(async function getDocsCategory(
  categoryId: string,
  languageCode?: string,
): Promise<DocsCategorySummary | null> {
  const categories = await listDocsCategories(languageCode);
  return categories.find((category) => category.id === categoryId) ?? null;
});

export const listDocsArticles = cache(async function listDocsArticles(
  categoryId: string,
  languageCode?: string,
): Promise<DocsArticleSummary[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await getClient();
  const preferred = languageCode ?? (await getDocsDefaultLanguage());
  const fallback = await getDocsDefaultLanguage();

  const [{ data: articles, error }, { data: translations }] = await Promise.all([
    supabase
      .from("site_docs_articles")
      .select("id, category_id, slug, sort_order, is_visible")
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true })
      .order("slug", { ascending: true }),
    supabase.from("site_docs_article_translations").select("article_id, language_code, title"),
  ]);

  if (error || !articles) return [];

  const translationByArticle = new Map<string, Pick<ArticleTranslationRow, "article_id" | "language_code" | "title">[]>();
  for (const row of (translations ?? []) as ArticleTranslationRow[]) {
    const list = translationByArticle.get(row.article_id) ?? [];
    list.push(row);
    translationByArticle.set(row.article_id, list);
  }

  return (articles as ArticleRow[]).map((row) => {
    const translation = pickTranslation(
      translationByArticle.get(row.id) ?? [],
      preferred,
      fallback,
    );
    return {
      id: row.id,
      categoryId: row.category_id,
      slug: row.slug,
      title: translation?.title ?? row.slug,
      sortOrder: row.sort_order,
      isVisible: row.is_visible !== false,
    };
  });
});

export const getDocsArticle = cache(async function getDocsArticle(
  articleId: string,
  languageCode?: string,
): Promise<DocsArticleDetail | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await getClient();
  const preferred = languageCode ?? (await getDocsDefaultLanguage());
  const fallback = await getDocsDefaultLanguage();

  const { data: article, error } = await supabase
    .from("site_docs_articles")
    .select("id, category_id, slug, sort_order, is_visible")
    .eq("id", articleId)
    .maybeSingle();
  if (error || !article) return null;
  const row = article as ArticleRow;
  const category = await getDocsCategory(row.category_id, preferred);

  const { data: translations } = await supabase
    .from("site_docs_article_translations")
    .select("article_id, language_code, title, slogan, content")
    .eq("article_id", articleId);

  const translation = pickTranslation(
    (translations ?? []) as ArticleTranslationRow[],
    preferred,
    fallback,
  );

  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    title: translation?.title ?? row.slug,
    slogan: translation?.slogan ?? "",
    sortOrder: row.sort_order,
    isVisible: row.is_visible !== false,
    content: translation?.content ?? "",
    categorySlug: category?.slug ?? "",
    categoryTitle: category?.title ?? "",
    categoryIcon: category?.icon ?? DEFAULT_ICON,
  };
});

export const getPublicDocsTree = cache(async function getPublicDocsTree(): Promise<DocsTree> {
  const [enabled, languageCode, categories] = await Promise.all([
    isDocsEnabled(),
    getDocsDefaultLanguage(),
    listDocsCategories(),
  ]);

  if (!enabled) {
    return { enabled: false, languageCode, hasMultipleLanguages: false, categories: [] };
  }

  const nav: DocsNavCategory[] = [];
  for (const category of categories) {
    if (!category.isVisible) continue;
    const articles = (await listDocsArticles(category.id, languageCode)).filter(
      (article) => article.isVisible,
    );
    if (articles.length === 0) continue;
    nav.push({
      id: category.id,
      slug: category.slug,
      icon: category.icon,
      title: category.title,
      articles,
    });
  }

  return {
    enabled: true,
    languageCode,
    hasMultipleLanguages: await docsHasMultipleLanguages(),
    categories: nav,
  };
});

export const getPublicDocsArticle = cache(async function getPublicDocsArticle(
  categorySlug: string,
  articleSlug: string,
): Promise<DocsArticleDetail | null> {
  const tree = await getPublicDocsTree();
  if (!tree.enabled) return null;
  const category = tree.categories.find((item) => item.slug === categorySlug);
  const article = category?.articles.find((item) => item.slug === articleSlug);
  if (!article) return null;
  return getDocsArticle(article.id, tree.languageCode);
});

function validateCategoryInput(
  input: DocsCategoryInput,
): { ok: false; error: string } | { ok: true; title: string; icon: string; slug: string } {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "errors.docs_title_required" };
  const icon = (input.icon.trim() || DEFAULT_ICON).toLowerCase();
  if (!isValidFileIconInput(icon)) return { ok: false, error: "errors.docs_icon_invalid" };
  const slug = normalizeDocsSlug(input.slug ?? "", title);
  if (!isValidDocsSlug(slug)) return { ok: false, error: "errors.docs_slug_invalid" };
  return { ok: true, title, icon, slug };
}

function validateArticleInput(
  input: DocsArticleInput,
): { ok: false; error: string } | { ok: true; title: string; slogan: string; content: string; slug: string } {
  const title = input.title.trim();
  if (!title) return { ok: false, error: "errors.docs_title_required" };
  const slogan = (input.slogan ?? "").trim().slice(0, MAX_SLOGAN_LENGTH);
  const content = input.content.slice(0, MAX_CONTENT_LENGTH);
  const slug = normalizeDocsSlug(input.slug ?? "", title);
  if (!isValidDocsSlug(slug)) return { ok: false, error: "errors.docs_slug_invalid" };
  return { ok: true, title, slogan, content, slug };
}

export async function createDocsCategory(
  input: DocsCategoryInput,
): Promise<ActionResult<{ category: DocsCategorySummary }>> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const parsed = validateCategoryInput(input);
  if (!parsed.ok) return parsed;
  const languageCode = await getDocsDefaultLanguage();
  const supabase = await getClient();
  const sortOrder = await nextSortOrder("site_docs_categories");

  const { data, error } = await supabase
    .from("site_docs_categories")
    .insert({
      slug: parsed.slug,
      icon: parsed.icon,
      sort_order: sortOrder,
    })
    .select("id, slug, icon, sort_order")
    .maybeSingle();

  if (error?.code === "23505") return { ok: false, error: "errors.docs_slug_exists" };
  if (error || !data) return { ok: false, error: "errors.docs_save_failed" };

  const row = data as CategoryRow;
  const { error: translationError } = await supabase
    .from("site_docs_category_translations")
    .upsert({
      category_id: row.id,
      language_code: languageCode,
      title: parsed.title,
    });
  if (translationError) return { ok: false, error: "errors.docs_save_failed" };

  return {
    ok: true,
    data: {
      category: {
        id: row.id,
        slug: row.slug,
        icon: row.icon,
        title: parsed.title,
        sortOrder: row.sort_order,
        articleCount: 0,
        isVisible: row.is_visible !== false,
      },
    },
  };
}

export async function updateDocsCategory(
  categoryId: string,
  input: DocsCategoryInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const parsed = validateCategoryInput(input);
  if (!parsed.ok) return parsed;
  const languageCode = await getDocsDefaultLanguage();
  const supabase = await getClient();

  const { error } = await supabase
    .from("site_docs_categories")
    .update({ slug: parsed.slug, icon: parsed.icon })
    .eq("id", categoryId);
  if (error?.code === "23505") return { ok: false, error: "errors.docs_slug_exists" };
  if (error) return { ok: false, error: "errors.docs_save_failed" };

  const { error: translationError } = await supabase
    .from("site_docs_category_translations")
    .upsert({
      category_id: categoryId,
      language_code: languageCode,
      title: parsed.title,
    });
  if (translationError) return { ok: false, error: "errors.docs_save_failed" };
  return { ok: true };
}

export async function deleteDocsCategory(categoryId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const supabase = await getClient();
  const { error } = await supabase.from("site_docs_categories").delete().eq("id", categoryId);
  if (error) return { ok: false, error: "errors.docs_delete_failed" };
  return { ok: true };
}

export async function createDocsArticle(
  categoryId: string,
  input: DocsArticleInput,
): Promise<ActionResult<{ article: DocsArticleSummary }>> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const parsed = validateArticleInput(input);
  if (!parsed.ok) return parsed;
  const languageCode = await getDocsDefaultLanguage();
  const supabase = await getClient();

  const { data: category } = await supabase
    .from("site_docs_categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();
  if (!category) return { ok: false, error: "errors.docs_category_not_found" };

  const sortOrder = await nextSortOrder("site_docs_articles", {
    column: "category_id",
    value: categoryId,
  });

  const { data, error } = await supabase
    .from("site_docs_articles")
    .insert({
      category_id: categoryId,
      slug: parsed.slug,
      sort_order: sortOrder,
    })
    .select("id, category_id, slug, sort_order")
    .maybeSingle();

  if (error?.code === "23505") return { ok: false, error: "errors.docs_slug_exists" };
  if (error || !data) return { ok: false, error: "errors.docs_save_failed" };
  const row = data as ArticleRow;

  const { error: translationError } = await supabase
    .from("site_docs_article_translations")
    .upsert({
      article_id: row.id,
      language_code: languageCode,
      title: parsed.title,
      slogan: parsed.slogan,
      content: parsed.content,
    });
  if (translationError) return { ok: false, error: "errors.docs_save_failed" };

  return {
    ok: true,
    data: {
      article: {
        id: row.id,
        categoryId: row.category_id,
        slug: row.slug,
        title: parsed.title,
        sortOrder: row.sort_order,
        isVisible: row.is_visible !== false,
      },
    },
  };
}

export async function updateDocsArticle(
  articleId: string,
  input: DocsArticleInput,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const parsed = validateArticleInput(input);
  if (!parsed.ok) return parsed;
  const languageCode = await getDocsDefaultLanguage();
  const supabase = await getClient();

  const { error } = await supabase
    .from("site_docs_articles")
    .update({ slug: parsed.slug })
    .eq("id", articleId);
  if (error?.code === "23505") return { ok: false, error: "errors.docs_slug_exists" };
  if (error) return { ok: false, error: "errors.docs_save_failed" };

  const { error: translationError } = await supabase
    .from("site_docs_article_translations")
    .upsert({
      article_id: articleId,
      language_code: languageCode,
      title: parsed.title,
      slogan: parsed.slogan,
      content: parsed.content,
    });
  if (translationError) return { ok: false, error: "errors.docs_save_failed" };
  return { ok: true };
}

export async function deleteDocsArticle(articleId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const supabase = await getClient();
  const { error } = await supabase.from("site_docs_articles").delete().eq("id", articleId);
  if (error) return { ok: false, error: "errors.docs_delete_failed" };
  return { ok: true };
}

export async function setDocsCategoryVisible(
  categoryId: string,
  isVisible: boolean,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const supabase = await getClient();
  const { error } = await supabase
    .from("site_docs_categories")
    .update({ is_visible: isVisible })
    .eq("id", categoryId);
  if (error) return { ok: false, error: "errors.docs_save_failed" };
  return { ok: true };
}

export async function setDocsArticleVisible(
  articleId: string,
  isVisible: boolean,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  const supabase = await getClient();
  const { error } = await supabase
    .from("site_docs_articles")
    .update({ is_visible: isVisible })
    .eq("id", articleId);
  if (error) return { ok: false, error: "errors.docs_save_failed" };
  return { ok: true };
}

function sameIdSet(orderedIds: string[], existingIds: string[]): boolean {
  if (orderedIds.length !== existingIds.length) return false;
  const existing = new Set(existingIds);
  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (!existing.has(id) || seen.has(id)) return false;
    seen.add(id);
  }
  return true;
}

export async function reorderDocsCategories(
  orderedIds: string[],
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  if (orderedIds.length === 0) return { ok: true };
  const supabase = await getClient();
  const { data, error: listError } = await supabase
    .from("site_docs_categories")
    .select("id");
  if (listError) return { ok: false, error: "errors.docs_reorder_failed" };
  const existingIds = (data ?? []).map((row) => row.id as string);
  if (!sameIdSet(orderedIds, existingIds)) {
    return { ok: false, error: "errors.docs_reorder_failed" };
  }
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("site_docs_categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i]);
    if (error) return { ok: false, error: "errors.docs_reorder_failed" };
  }
  return { ok: true };
}

export async function reorderDocsArticles(
  categoryId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  if (orderedIds.length === 0) return { ok: true };
  const supabase = await getClient();
  const { data, error: listError } = await supabase
    .from("site_docs_articles")
    .select("id")
    .eq("category_id", categoryId);
  if (listError) return { ok: false, error: "errors.docs_reorder_failed" };
  const existingIds = (data ?? []).map((row) => row.id as string);
  if (!sameIdSet(orderedIds, existingIds)) {
    return { ok: false, error: "errors.docs_reorder_failed" };
  }
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("site_docs_articles")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("category_id", categoryId);
    if (error) return { ok: false, error: "errors.docs_reorder_failed" };
  }
  return { ok: true };
}

type ImageRow = {
  id: string;
  file_name: string;
};

export async function listDocsArticleImages(
  articleId: string,
): Promise<DocsArticleImage[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await getClient();
  const { data } = await supabase
    .from("site_docs_article_images")
    .select("id, file_name")
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });
  return ((data ?? []) as ImageRow[]).map((row) => ({
    id: row.id,
    fileName: row.file_name,
  }));
}

export async function createDocsArticleImage(input: {
  articleId: string;
  id?: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<ActionResult<{ image: DocsArticleImage }>> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  if (input.id && !isDocsImageId(input.id)) {
    return { ok: false, error: "errors.docs_image_invalid" };
  }
  if (
    input.bytes.byteLength <= 0 ||
    input.bytes.byteLength > DOCS_IMAGE_MAX_BYTES ||
    !isAllowedDocsImageMime(input.mimeType)
  ) {
    return { ok: false, error: "errors.docs_image_invalid" };
  }

  const fileName = sanitizeDocsImageFileName(input.fileName);
  const supabase = await getClient();

  const { data: article } = await supabase
    .from("site_docs_articles")
    .select("id")
    .eq("id", input.articleId)
    .maybeSingle();
  if (!article) return { ok: false, error: "errors.docs_article_not_found" };

  const { count } = await supabase
    .from("site_docs_article_images")
    .select("id", { count: "exact", head: true })
    .eq("article_id", input.articleId);
  if ((count ?? 0) >= DOCS_IMAGE_MAX_PER_ARTICLE) {
    return { ok: false, error: "errors.docs_image_limit" };
  }

  const content = `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`;
  const row = {
    ...(input.id ? { id: input.id } : {}),
    article_id: input.articleId,
    file_name: fileName,
    mime_type: input.mimeType,
    byte_size: input.bytes.byteLength,
    content,
  };

  const { data, error } = await supabase
    .from("site_docs_article_images")
    .insert(row)
    .select("id, file_name")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "errors.docs_image_upload_failed" };
  const saved = data as ImageRow;
  return { ok: true, data: { image: { id: saved.id, fileName: saved.file_name } } };
}

export async function deleteDocsArticleImage(imageId: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return dbNotConfigured();
  if (!isDocsImageId(imageId)) return { ok: false, error: "errors.docs_image_invalid" };
  const supabase = await getClient();
  const { error } = await supabase.from("site_docs_article_images").delete().eq("id", imageId);
  if (error) return { ok: false, error: "errors.docs_delete_failed" };
  return { ok: true };
}
