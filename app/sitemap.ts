import type { MetadataRoute } from "next";
import { absoluteUrl, PUBLIC_SITEMAP_PATHS } from "@/app/lib/seo/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/login" || path === "/signup" ? 0.6 : 0.5,
  }));
}
