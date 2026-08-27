import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { DocsShell } from "@/app/components/docs-shell";
import { resolveSystemName } from "@/app/lib/document-title";
import { getPublicDocsTree } from "@/app/lib/docs/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { localePath } from "@/app/lib/seo/locale-path";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, tree] = await Promise.all([
    getServerTranslations(),
    getPublicDocsTree(),
  ]);
  return canonicalMetadata("/docs", {
    title: t("docs.title", "Dokumentācija"),
    index: tree.enabled,
  });
}

export default async function DocsIndexPage() {
  const [{ t, languageCode }, tree, settings] = await Promise.all([
    getServerTranslations(),
    getPublicDocsTree(),
    getSiteSettings(),
  ]);

  if (!tree.enabled) {
    redirect(localePath("/", languageCode));
  }

  const first = tree.categories.find((category) => category.articles.length > 0);
  const firstArticle = first?.articles[0];
  if (first && firstArticle) {
    redirect(localePath(`/docs/${first.slug}/${firstArticle.slug}`, languageCode));
  }

  return (
    <DocsShell
      categories={tree.categories}
      article={null}
      logoUrl={settings.logoUrl}
      logoColor={settings.logoColor}
      systemName={resolveSystemName(settings.systemName)}
      emptyLabel={t("docs.empty", "Dokumentācija vēl nav sagatavota.")}
      showLanguageSwitcher={tree.hasMultipleLanguages}
    />
  );
}
