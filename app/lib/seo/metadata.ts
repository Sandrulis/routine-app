import type { Metadata } from "next";
import { getRequestLanguageCode } from "@/app/lib/i18n/server";
import { type LanguageCode } from "@/app/lib/i18n/language";
import {
  hreflangMap as buildHreflangMap,
  localePath,
  ogAlternateLocales,
  ogLocale,
  PUBLIC_LOCALIZED_PATHS,
} from "@/app/lib/seo/locale-path";
import { absoluteUrl } from "@/app/lib/seo/site-url";

export const NO_INDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

export const INDEX_ROBOTS: Metadata["robots"] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

export function hreflangMap(path: string): Record<string, string> {
  return buildHreflangMap(path, absoluteUrl);
}

export async function canonicalMetadata(
  path: string,
  extras?: {
    title?: string;
    titleAbsolute?: string;
    description?: string;
    keywords?: string | string[];
    languageCode?: LanguageCode;
    index?: boolean;
  },
): Promise<Metadata> {
  const languageCode = extras?.languageCode ?? (await getRequestLanguageCode());
  const localizedPath = localePath(path, languageCode);
  const url = absoluteUrl(localizedPath);
  const languages = hreflangMap(path);
  const keywords =
    extras?.keywords == null
      ? undefined
      : Array.isArray(extras.keywords)
        ? extras.keywords
        : extras.keywords
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean);

  return {
    ...(extras?.titleAbsolute
      ? { title: { absolute: extras.titleAbsolute } }
      : extras?.title
        ? { title: extras.title }
        : {}),
    ...(extras?.description ? { description: extras.description } : {}),
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: {
      canonical: url,
      languages,
    },
    robots: extras?.index === false ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
    openGraph: {
      url,
      locale: ogLocale(languageCode),
      alternateLocale: ogAlternateLocales(languageCode),
      ...(extras?.titleAbsolute || extras?.title
        ? { title: extras.titleAbsolute || extras.title }
        : {}),
      ...(extras?.description ? { description: extras.description } : {}),
    },
    twitter: {
      card: "summary_large_image",
      ...(extras?.titleAbsolute || extras?.title
        ? { title: extras.titleAbsolute || extras.title }
        : {}),
      ...(extras?.description ? { description: extras.description } : {}),
    },
  };
}

export { PUBLIC_LOCALIZED_PATHS };
