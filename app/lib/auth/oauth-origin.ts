export function resolveOAuthOrigin(clientOrigin: string) {
  const allowed = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const trimmed = clientOrigin.trim().replace(/\/$/, "");
  if (process.env.NODE_ENV === "development" && trimmed.startsWith("http")) {
    return trimmed;
  }
  if (allowed) {
    try {
      return new URL(allowed).origin;
    } catch {
      return "";
    }
  }
  return trimmed.startsWith("http") ? trimmed : "";
}
