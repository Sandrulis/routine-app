import type { Metadata } from "next";
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

export function canonicalMetadata(
  path: string,
  extras?: { title?: string; description?: string },
): Metadata {
  const url = absoluteUrl(path);
  return {
    ...(extras?.title ? { title: extras.title } : {}),
    ...(extras?.description ? { description: extras.description } : {}),
    alternates: { canonical: url },
    robots: INDEX_ROBOTS,
    openGraph: {
      url,
      ...(extras?.title ? { title: extras.title } : {}),
      ...(extras?.description ? { description: extras.description } : {}),
    },
  };
}
