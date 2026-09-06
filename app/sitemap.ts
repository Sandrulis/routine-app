import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/app/lib/i18n/language";
import {
  getPublicDocsTree,
  listPublicDocsArticlePaths,
} from "@/app/lib/docs/repository";
import {
  hreflangMap,
  hreflangMapForLanguagePaths,
  localePath,
} from "@/app/lib/seo/locale-path";
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
  const [tree, articlePaths] = await Promise.all([
    getPublicDocsTree(),
    listPublicDocsArticlePaths(),
  ]);
  const docsIndex = tree.enabled
    ? sitemapEntry("/docs", { changeFrequency: "weekly", priority: 0.6 })
    : [];
  const lastModified = new Date();
  const docsArticles: MetadataRoute.Sitemap = tree.enabled
    ? articlePaths.flatMap((item) => {
        const languages = hreflangMapForLanguagePaths(item.paths, absoluteUrl);
        return SUPPORTED_LANGUAGES.flatMap((language) => {
          const path = item.paths[language.code];
          if (!path) return [];
          return [
            {
              url: absoluteUrl(localePath(path, language.code)),
              lastModified,
              changeFrequency: "weekly" as const,
              priority: 0.5,
              alternates: { languages },
            },
          ];
        });
      })
    : [];

  return [
    ...PUBLIC_SITEMAP_PATHS.flatMap((path) => sitemapEntry(path)),
    ...docsIndex,
    ...docsArticles,
  ];
}
