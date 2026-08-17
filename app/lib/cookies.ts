export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split("; ");
  const match = parts.find((part) => part.startsWith(prefix));
  if (!match) return null;

  try {
    return decodeURIComponent(match.slice(prefix.length));
  } catch {
    return match.slice(prefix.length);
  }
}

export function writeCookie(
  name: string,
  value: string,
  maxAgeSeconds = 60 * 60 * 24 * 365,
) {
  if (typeof document === "undefined") return;

  document.cookie = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `Max-Age=${maxAgeSeconds}`,
    "Path=/",
    "SameSite=Lax",
  ].join("; ");
}

export function deleteCookie(name: string) {
  writeCookie(name, "", 0);
}
