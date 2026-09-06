import { permanentRedirect, redirect } from "next/navigation";
import type { Metadata } from "next";
import { DocsArticleContent } from "@/app/components/docs-article-content";
import { PublicPageJsonLd } from "@/app/components/public-page-json-ld";
import { getPublicDocsArticle, getPublicDocsTree } from "@/app/lib/docs/repository";
import { applyDocsPlaceholders } from "@/app/lib/docs/placeholders";
import { resolveSystemName } from "@/app/lib/document-title";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { hreflangMapForLanguagePaths, localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl } from "@/app/lib/seo/site-url";
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
  const { t, languageCode } = await getServerTranslations();
  const [detail, tree, settings] = await Promise.all([
    getPublicDocsArticle(category, article, languageCode),
    getPublicDocsTree(languageCode),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  const articleTitle = applyDocsPlaceholders(
    detail?.title || t("docs.title", "Dokumentācija"),
    systemName,
  );
  const description = t(
    "docs.seo.article_description",
    "{title} — {name} documentation article.",
    { title: articleTitle, name: systemName },
  );
  const canonicalPath = detail
    ? `/docs/${detail.categorySlug}/${detail.slug}`
    : `/docs/${category}/${article}`;
  return canonicalMetadata(canonicalPath, {
    title: articleTitle,
    description,
    index: tree.enabled && Boolean(detail),
    languages:
      detail?.alternatePaths && tree.enabled
        ? hreflangMapForLanguagePaths(detail.alternatePaths, absoluteUrl)
        : undefined,
  });
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<DocsArticleParams>;
}) {
  const { category, article } = await params;
  const { t, languageCode } = await getServerTranslations();
  const [tree, detail] = await Promise.all([
    getPublicDocsTree(languageCode),
    getPublicDocsArticle(category, article, languageCode),
  ]);

  if (!tree.enabled) {
    redirect(localePath("/", languageCode));
  }
  if (!detail) {
    redirect(localePath("/docs", languageCode));
  }

  const localizedPath = `/docs/${detail.categorySlug}/${detail.slug}`;
  if (category !== detail.categorySlug || article !== detail.slug) {
    permanentRedirect(localePath(localizedPath, languageCode));
  }

  const settings = await getSiteSettings();
  const systemName = resolveSystemName(settings.systemName);
  const articleTitle = applyDocsPlaceholders(detail.title, systemName);
  const categoryTitle = detail.categoryTitle || category;
  const description = t(
    "docs.seo.article_description",
    "{title} — {name} documentation article.",
    { title: articleTitle, name: systemName },
  );

  return (
    <>
      <PublicPageJsonLd
        path={localizedPath}
        title={articleTitle}
        description={description}
        languageCode={languageCode}
        breadcrumbs={[
          { name: t("nav.home", "Sākums"), path: "/" },
          { name: t("docs.title", "Dokumentācija"), path: "/docs" },
          { name: categoryTitle, path: localizedPath },
        ]}
      />
      <DocsArticleContent
        article={detail}
        categories={tree.categories}
        emptyLabel={t("docs.empty", "Dokumentācija vēl nav sagatavota.")}
      />
    </>
  );
}
