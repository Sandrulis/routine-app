import { htmlLang, localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl } from "@/app/lib/seo/site-url";
import type { LanguageCode } from "@/app/lib/i18n/language";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function buildBreadcrumbListJsonLd(
  items: BreadcrumbItem[],
  languageCode: LanguageCode,
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localePath(item.path, languageCode)),
    })),
  };
}

export function buildWebPageJsonLd(input: {
  path: string;
  title: string;
  description: string;
  languageCode: LanguageCode;
  websiteId?: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  const url = absoluteUrl(localePath(input.path, input.languageCode));
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: input.title,
      description: input.description,
      inLanguage: htmlLang(input.languageCode),
    ...(input.websiteId ? { isPartOf: { "@id": input.websiteId } } : {}),
    },
  ];

  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    graph.push(buildBreadcrumbListJsonLd(input.breadcrumbs, input.languageCode));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph.filter((node) => node !== undefined),
  };
}
