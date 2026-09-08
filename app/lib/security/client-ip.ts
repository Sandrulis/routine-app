import { headers } from "next/headers";

const SKIP_COUNTRY_CODES = new Set(["XX", "T1", "A1", "A2"]);

export function ipFromHeaders(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 128);
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  return "unknown";
}

export function countryCodeFromHeaders(headerStore: Headers): string | null {
  const raw =
    headerStore.get("cf-ipcountry") ??
    headerStore.get("x-vercel-ip-country") ??
    headerStore.get("x-country-code") ??
    headerStore.get("cloudfront-viewer-country");
  const code = raw?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(code) || SKIP_COUNTRY_CODES.has(code)) {
    return null;
  }
  return code;
}

export async function getClientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

export async function getClientCountryCode(): Promise<string | null> {
  return countryCodeFromHeaders(await headers());
}

export function requestClientIp(request: Request): string {
  return ipFromHeaders(request.headers);
}
