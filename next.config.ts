import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import {
  canonicalHostRedirectRules,
  robotsNoIndexHeaderSources,
} from "./app/lib/seo/site-url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    // Gmail extension sends attachments as base64 (~4/3 of 25 MB + email HTML).
    proxyClientMaxBodySize: "40mb",
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          ...(SITE_URL.startsWith("https://")
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=63072000; includeSubDomains; preload",
                },
              ]
            : []),
        ],
      },
      ...robotsNoIndexHeaderSources().map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
  async redirects() {
    return canonicalHostRedirectRules();
  },
};

export default nextConfig;
