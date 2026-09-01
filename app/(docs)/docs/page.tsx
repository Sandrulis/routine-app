import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPublicDocsTree } from "@/app/lib/docs/repository";
import { resolveSystemName } from "@/app/lib/document-title";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { localePath } from "@/app/lib/seo/locale-path";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t, languageCode } = await getServerTranslations();
  const [tree, settings] = await Promise.all([
    getPublicDocsTree(languageCode),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
  const name = { name: systemName };
  return canonicalMetadata("/docs", {
    title: t("docs.title", "Dokumentācija"),
    description: t(
      "docs.seo.description",
      "{name} palīdzības centrs: sāc darbu, komandas iestatījumi, integrācijas un biežākie jautājumi.",
      name,
    ),
    index: tree.enabled,
  });
}

export default async function DocsIndexPage() {
  const { t, languageCode } = await getServerTranslations();
  const tree = await getPublicDocsTree(languageCode);

  if (!tree.enabled) {
    redirect(localePath("/", languageCode));
  }

  const first = tree.categories.find((category) => category.articles.length > 0);
  const firstArticle = first?.articles[0];
  if (first && firstArticle) {
    redirect(localePath(`/docs/${first.slug}/${firstArticle.slug}`, languageCode));
  }

  return <p className="text-zinc-500">{t("docs.empty", "Dokumentācija vēl nav sagatavota.")}</p>;
}
