import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/app/lib/i18n/language";
import { getPublicDocsTree } from "@/app/lib/docs/repository";
import { hreflangMap, localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl, PUBLIC_SITEMAP_PATHS } from "@/app/lib/seo/site-url";

function sitemapEntry(
  path: string,
  extras?: {
    changeFrequency?: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority?: number;
    lastModified?: Date;
  },
): MetadataRoute.Sitemap {
  const languages = hreflangMap(path, absoluteUrl);
  const lastModified = extras?.lastModified ?? new Date();
  return SUPPORTED_LANGUAGES.map((language) => {
    const localized = localePath(path, language.code);
    return {
      url: absoluteUrl(localized),
      lastModified,
      changeFrequency: extras?.changeFrequency ?? (path === "/" ? "weekly" : "monthly"),
      priority: extras?.priority ?? (path === "/" ? 1 : 0.5),
      alternates: { languages },
    };
  });
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tree = await getPublicDocsTree();
  const docsPaths = tree.enabled
    ? [
        "/docs",
        ...tree.categories.flatMap((category) =>
          category.articles.map((article) => `/docs/${category.slug}/${article.slug}`),
        ),
      ]
    : [];

  return [
    ...PUBLIC_SITEMAP_PATHS.flatMap((path) => sitemapEntry(path)),
    ...docsPaths.flatMap((path) =>
      sitemapEntry(path, { changeFrequency: "weekly", priority: path === "/docs" ? 0.6 : 0.5 }),
    ),
  ];
}
