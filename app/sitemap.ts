import type { MetadataRoute } from "next";
import { SUPPORTED_LANGUAGES } from "@/app/lib/i18n/language";
import { isDocsEnabled } from "@/app/lib/docs/repository";
import { hreflangMap, localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl, PUBLIC_SITEMAP_PATHS } from "@/app/lib/seo/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docsEnabled = await isDocsEnabled();
  const paths = docsEnabled
    ? [...PUBLIC_SITEMAP_PATHS, "/docs"]
    : [...PUBLIC_SITEMAP_PATHS];
  return paths.flatMap((path) => {
    const languages = hreflangMap(path, absoluteUrl);
    return SUPPORTED_LANGUAGES.map((language) => {
      const localized = localePath(path, language.code);
      return {
        url: absoluteUrl(localized),
        changeFrequency: path === "/" ? "weekly" : "monthly",
        priority: path === "/" ? 1 : 0.5,
        alternates: { languages },
      };
    });
  });
}
