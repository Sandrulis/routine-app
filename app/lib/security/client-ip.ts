import { headers } from "next/headers";

export function ipFromHeaders(headerStore: Headers): string {
  const forwarded = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded.slice(0, 128);
  const realIp = headerStore.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 128);
  return "unknown";
}

export async function getClientIp(): Promise<string> {
  return ipFromHeaders(await headers());
}

export function requestClientIp(request: Request): string {
  return ipFromHeaders(request.headers);
}
