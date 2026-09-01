import {
  LOCAL_DEV_ORIGINS,
  PRODUCTION_SITE_ORIGIN,
} from "./known-site-origins";

import { DEFAULT_LANGUAGE, LANGUAGE_CODES } from "../i18n/language";
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
] as const;

/** Auth pages stay reachable, but must not be indexed. */
export const AUTH_NOINDEX_PATHS = ["/login", "/signup"] as const;

const PUBLIC_LOCALE_PREFIXES = LANGUAGE_CODES.filter(
  (code) => code !== DEFAULT_LANGUAGE,
);

export function withPublicLocalePrefixes(path: string): string[] {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return [
    normalized,
    ...PUBLIC_LOCALE_PREFIXES.map((code) => `/${code}${normalized}`),
  ];
}

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
  ...AUTH_NOINDEX_PATHS.flatMap((path) => withPublicLocalePrefixes(path)),
  "/api/",
  "/auth/",
  "/calendar/",
] as const;

function hostnameOf(origin: string): string | null {
  try {
    return new URL(origin).hostname.toLowerCase();
  } catch {
    return null;
  }
}

function apexHost(host: string): string {
  return host.replace(/^www\./i, "");
}

/** Hostname for legal text, e.g. `tasqin.com` (no protocol, no www). */
export function getPublicSiteHost(): string {
  const host = hostnameOf(getPublicSiteUrl());
  return host ? apexHost(host) : "";
}

function isLocalHost(host: string): boolean {
  return host === "localhost" || host === "127.0.0.1";
}

/** True when NEXT_PUBLIC_SITE_URL (or dev default) points at localhost. */
export function isLocalPublicSite(): boolean {
  const host = hostnameOf(getPublicSiteUrl());
  return host != null && isLocalHost(host);
}

/**
 * If the request host is the www/apex twin of NEXT_PUBLIC_SITE_URL, return
 * the canonical absolute URL (301 target). Otherwise null.
 */
export function canonicalHostRedirectUrl(
  requestUrl: string,
  requestHostHeader: string | null,
): string | null {
  const canonicalHost = hostnameOf(getPublicSiteUrl());
  if (!canonicalHost || isLocalHost(canonicalHost)) return null;

  const requestHost = (requestHostHeader ?? "").split(":")[0]?.trim().toLowerCase();
  if (!requestHost || requestHost === canonicalHost || isLocalHost(requestHost)) {
    return null;
  }
  if (apexHost(requestHost) !== apexHost(canonicalHost)) return null;

  let canonical: URL;
  try {
    canonical = new URL(getPublicSiteUrl());
  } catch {
    return null;
  }

  const next = new URL(requestUrl);
  next.protocol = canonical.protocol;
  next.hostname = canonical.hostname;
  next.port = canonical.port;
  return next.toString();
}

type HostRedirectRule = {
  source: string;
  has: { type: "host"; value: string }[];
  destination: string;
  permanent: true;
};

function canonicalHostFromTo(): { origin: string; fromHost: string } | null {
  const origin = getPublicSiteUrl().replace(/\/$/, "");
  const canonicalHost = hostnameOf(origin);
  if (!canonicalHost || isLocalHost(canonicalHost)) return null;
  const fromHost = canonicalHost.startsWith("www.")
    ? canonicalHost.slice(4)
    : `www.${canonicalHost}`;
  if (!fromHost || fromHost === canonicalHost) return null;
  return { origin, fromHost };
}

/**
 * Host redirects for next.config. Skips `/api/extension/*` so Chrome extension
 * fetches are not 301'd without CORS headers (browsers block that).
 */
export function canonicalHostRedirectRules(): HostRedirectRule[] {
  const pair = canonicalHostFromTo();
  if (!pair) return [];
  const has = [{ type: "host" as const, value: pair.fromHost }];
  return [
    {
      source: "/",
      has,
      destination: `${pair.origin}/`,
      permanent: true,
    },
    {
      source: "/:path((?!api/extension(?:/|$)).*)",
      has,
      destination: `${pair.origin}/:path`,
      permanent: true,
    },
  ];
}

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
