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
    languageCode?: LanguageCode;
    index?: boolean;
  },
): Promise<Metadata> {
  const languageCode = extras?.languageCode ?? (await getRequestLanguageCode());
  const localizedPath = localePath(path, languageCode);
  const url = absoluteUrl(localizedPath);
  const languages = hreflangMap(path);
  const title = extras?.titleAbsolute || extras?.title;
  const images = shareImages(title || "TASQIN");

  return {
    ...(extras?.titleAbsolute
      ? { title: { absolute: extras.titleAbsolute } }
      : extras?.title
        ? { title: extras.title }
        : {}),
    ...(extras?.description ? { description: extras.description } : {}),
    alternates: {
      canonical: url,
      languages,
    },
    robots: extras?.index === false ? NO_INDEX_ROBOTS : INDEX_ROBOTS,
    openGraph: {
      type: "website",
      url,
      locale: ogLocale(languageCode),
      alternateLocale: ogAlternateLocales(languageCode),
      images: images.openGraph,
      ...(title ? { title } : {}),
      ...(extras?.description ? { description: extras.description } : {}),
    },
    twitter: {
      card: "summary_large_image",
      images: images.twitter,
      ...(title ? { title } : {}),
      ...(extras?.description ? { description: extras.description } : {}),
    },
  };
}

export { PUBLIC_LOCALIZED_PATHS };
