import type { MetadataRoute } from "next";
import { getPublicSiteUrl, ROBOTS_DISALLOW_PATHS } from "@/app/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const origin = getPublicSiteUrl();
  let host: string | undefined;
  try {
    host = new URL(origin).host;
  } catch {
    host = undefined;
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...ROBOTS_DISALLOW_PATHS],
    },
    sitemap: `${origin}/sitemap.xml`,
    host,
  };
}
