import type { Metadata } from "next";
import { getRequestLanguageCode } from "@/app/lib/i18n/server";
import { type LanguageCode } from "@/app/lib/i18n/language";
import { resolveSystemName } from "@/app/lib/document-title";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import {
  hreflangMap as buildHreflangMap,
  localePath,
  ogAlternateLocales,
  ogLocale,
  PUBLIC_LOCALIZED_PATHS,
} from "@/app/lib/seo/locale-path";
import {
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
  OG_IMAGE_TYPE,
  TWITTER_IMAGE_PATH,
} from "@/app/lib/seo/share-image";
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

function shareImages(alt: string) {
  const ogImage = {
    url: absoluteUrl(OG_IMAGE_PATH),
    width: OG_IMAGE_SIZE.width,
    height: OG_IMAGE_SIZE.height,
    alt,
    type: OG_IMAGE_TYPE,
  };
  return {
    openGraph: [ogImage],
    twitter: [absoluteUrl(TWITTER_IMAGE_PATH)],
  };
}

export async function canonicalMetadata(
  path: string,
  extras?: {
    title?: string;
    titleAbsolute?: string;
    description?: string;
    /** Share text for Open Graph and Twitter. Falls back to `description`. */
    ogDescription?: string;
    languageCode?: LanguageCode;
    index?: boolean;
    /** Emit hreflang alternates. Default true; set false for noindex auth pages. */
    hreflang?: boolean;
  },
): Promise<Metadata> {
  const languageCode = extras?.languageCode ?? (await getRequestLanguageCode());
  const localizedPath = localePath(path, languageCode);
  const url = absoluteUrl(localizedPath);
  const includeHreflang = extras?.hreflang !== false && extras?.index !== false;
  const languages = includeHreflang ? hreflangMap(path) : undefined;
  const title = extras?.titleAbsolute || extras?.title;
  const settings = await getSiteSettings();
  const siteName = resolveSystemName(settings.systemName);
  const images = shareImages(title || siteName);
  const shareDescription = extras?.ogDescription ?? extras?.description;
  const indexed = extras?.index !== false;

  return {
    ...(extras?.titleAbsolute
      ? { title: { absolute: extras.titleAbsolute } }
      : extras?.title
        ? { title: extras.title }
        : {}),
    ...(extras?.description ? { description: extras.description } : {}),
    alternates: {
      canonical: url,
      ...(languages ? { languages } : {}),
    },
    robots: indexed ? INDEX_ROBOTS : NO_INDEX_ROBOTS,
    openGraph: {
      type: "website",
      url,
      siteName,
      locale: ogLocale(languageCode),
      alternateLocale: ogAlternateLocales(languageCode),
      images: images.openGraph,
      ...(title ? { title } : {}),
      ...(shareDescription ? { description: shareDescription } : {}),
    },
    twitter: {
      card: "summary_large_image",
      images: images.twitter,
      ...(title ? { title } : {}),
      ...(shareDescription ? { description: shareDescription } : {}),
    },
  };
}

export { PUBLIC_LOCALIZED_PATHS };
