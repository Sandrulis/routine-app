import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DocsShell } from "@/app/components/docs-shell";
import { resolveSystemName } from "@/app/lib/document-title";
import {
  getPublicDocsArticle,
  getPublicDocsTree,
} from "@/app/lib/docs/repository";
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
  const [{ t }, detail, tree] = await Promise.all([
    getServerTranslations(),
    getPublicDocsArticle(category, article),
    getPublicDocsTree(),
  ]);
  return canonicalMetadata(`/docs/${category}/${article}`, {
    title: detail?.title || t("docs.title", "Dokumentācija"),
    index: tree.enabled && Boolean(detail),
  });
}

export default async function DocsArticlePage({
  params,
}: {
  params: Promise<DocsArticleParams>;
}) {
  const { category, article } = await params;
  const [{ t, languageCode }, tree, detail, settings] = await Promise.all([
    getServerTranslations(),
    getPublicDocsTree(),
    getPublicDocsArticle(category, article),
    getSiteSettings(),
  ]);

  if (!tree.enabled) {
    redirect(localePath("/", languageCode));
  }
  if (!detail) {
    redirect(localePath("/docs", languageCode));
  }

  return (
    <DocsShell
      categories={tree.categories}
      article={detail}
      logoUrl={settings.logoUrl}
      logoColor={settings.logoColor}
      systemName={resolveSystemName(settings.systemName)}
      emptyLabel={t("docs.empty", "Dokumentācija vēl nav sagatavota.")}
      showLanguageSwitcher={tree.hasMultipleLanguages}
    />
  );
}
