import { buildWebPageJsonLd, type BreadcrumbItem } from "@/app/lib/seo/json-ld";
import type { LanguageCode } from "@/app/lib/i18n/language";
import { localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl } from "@/app/lib/seo/site-url";

type PublicPageJsonLdProps = {
  path: string;
  title: string;
  description: string;
  languageCode: LanguageCode;
  breadcrumbs?: BreadcrumbItem[];
};

export function PublicPageJsonLd({
  path,
  title,
  description,
  languageCode,
  breadcrumbs,
}: PublicPageJsonLdProps) {
  const jsonLd = buildWebPageJsonLd({
    path,
    title,
    description,
    languageCode,
    websiteId: `${absoluteUrl(localePath("/", languageCode))}#website`,
    breadcrumbs,
  });

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
