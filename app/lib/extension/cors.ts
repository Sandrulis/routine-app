import { NextResponse } from "next/server";
import { isKnownSiteOrigin } from "@/app/lib/seo/known-site-origins";

const EXTENSION_ORIGIN = /^chrome-extension:\/\//;
const CHROME_EXTENSION_ID = /^[a-p]{32}$/;

function allowOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (EXTENSION_ORIGIN.test(origin)) {
    const extensionId = origin.replace("chrome-extension://", "").split("/")[0];
    // CORS is not auth: echo any well-formed Chrome extension origin so
    // production works without CHROME_EXTENSION_IDS. Private routes still
    // require a Bearer token.
    return CHROME_EXTENSION_ID.test(extensionId) ? origin : null;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      if (new URL(site).origin === origin) return origin;
    } catch {
      // ignore
    }
  }
  if (isKnownSiteOrigin(origin)) return origin;
  return null;
}

export function extensionCorsHeaders(request: Request): HeadersInit {
  const origin = allowOrigin(request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Vary"] = "Origin";
  }
  return headers;
}

export function extensionOptionsResponse(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: extensionCorsHeaders(request),
  });
}

export function extensionJson(
  request: Request,
  body: unknown,
  init?: { status?: number },
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: extensionCorsHeaders(request),
  });
}
