import { NextResponse } from "next/server";

const EXTENSION_ORIGIN = /^chrome-extension:\/\//;

function allowedExtensionIds() {
  const raw =
    process.env.CHROME_EXTENSION_IDS?.trim() ||
    process.env.NEXT_PUBLIC_CHROME_EXTENSION_IDS?.trim() ||
    "";
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function allowOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (EXTENSION_ORIGIN.test(origin)) {
    const extensionId = origin.replace("chrome-extension://", "").split("/")[0];
    const allowlist = allowedExtensionIds();
    if (allowlist.length > 0) {
      return allowlist.includes(extensionId) ? origin : null;
    }
    if (process.env.NODE_ENV !== "production") return origin;
    return null;
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site) {
    try {
      if (new URL(site).origin === origin) return origin;
    } catch {
      // ignore
    }
  }
  if (
    origin === "http://localhost:3120" ||
    origin.startsWith("http://127.0.0.1:3120")
  ) {
    return origin;
  }
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
