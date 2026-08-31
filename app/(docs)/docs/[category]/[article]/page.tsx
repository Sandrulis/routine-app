import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DocsArticleContent } from "@/app/components/docs-article-content";
import { getPublicDocsArticle, getPublicDocsTree } from "@/app/lib/docs/repository";
import { applyDocsPlaceholders } from "@/app/lib/docs/placeholders";
import { resolveSystemName } from "@/app/lib/document-title";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { localePath } from "@/app/lib/seo/locale-path";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

type DocsArticleParams = {
  category: string;
  article: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<DocsArticleParams>;
}): Promise<Metadata> {
  const { category, article } = await params;
  const [{ t }, detail, tree, settings] = await Promise.all([
    getServerTranslations(),
    getPublicDocsArticle(category, article),
    getPublicDocsTree(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  return canonicalMetadata(`/docs/${category}/${article}`, {
    title: applyDocsPlaceholders(detail?.title || t("docs.title", "Dokumentācija"), systemName),
    index: tree.enabled && Boolean(detail),
  });
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<DocsArticleParams>;
}) {
  const { category, article } = await params;
  const [{ t, languageCode }, tree, detail] = await Promise.all([
    getServerTranslations(),
    getPublicDocsTree(),
    getPublicDocsArticle(category, article),
  ]);

  if (!tree.enabled) {
    redirect(localePath("/", languageCode));
  }
  if (!detail) {
    redirect(localePath("/docs", languageCode));
  }

  return (
    <DocsArticleContent
      article={detail}
      categories={tree.categories}
      emptyLabel={t("docs.empty", "Dokumentācija vēl nav sagatavota.")}
    />
  );
}
