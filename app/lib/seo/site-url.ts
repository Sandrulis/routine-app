import {
  LOCAL_DEV_ORIGINS,
  PRODUCTION_SITE_ORIGIN,
} from "./known-site-origins";

import { readEnv } from "../env/read-env";

export function getPublicSiteUrl(): string {
  const configured = readEnv("NEXT_PUBLIC_SITE_URL");
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return configured.replace(/\/$/, "");
    }
  }
  if (process.env.NODE_ENV === "production") return PRODUCTION_SITE_ORIGIN;
  return LOCAL_DEV_ORIGINS[0];
}

/** HTML tag `content` value for Google Search Console. Accepts a pasted meta tag. */
export function getGoogleSiteVerification(): string | undefined {
  const value = readEnv("GOOGLE_SITE_VERIFICATION");
  if (!value) return undefined;
  const fromTag = value.match(/content\s*=\s*["']([^"']+)["']/i);
  if (fromTag?.[1]) return fromTag[1].trim();
  return value.replace(/^google-site-verification=/i, "").trim() || undefined;
}

export function absoluteUrl(path = "/"): string {
  const origin = getPublicSiteUrl();
  if (!path || path === "/") return `${origin}/`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export const PUBLIC_SITEMAP_PATHS = [
  "/",
  "/privacy",
  "/terms",
  "/cookies",
  "/login",
  "/signup",
] as const;

export const ROBOTS_DISALLOW_PATHS = [
  "/dashboard",
  "/lists",
  "/team",
  "/admin",
  "/settings",
  "/templates",
  "/projects",
  "/invite",
  "/forgot-password",
  "/update-password",
  "/api/",
  "/auth/",
  "/calendar/",
] as const;

/** Next.js `headers()` sources that should send `X-Robots-Tag: noindex, nofollow`. */
export function robotsNoIndexHeaderSources(): string[] {
  const sources: string[] = [];
  for (const path of ROBOTS_DISALLOW_PATHS) {
    const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
    if (!normalized) continue;
    sources.push(normalized);
    sources.push(`${normalized}/:path*`);
  }
  return sources;
}
