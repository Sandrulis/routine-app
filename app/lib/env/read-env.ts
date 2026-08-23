/**
 * Next.js inlines NEXT_PUBLIC_* into the browser bundle only for static
 * `process.env.NEXT_PUBLIC_…` access. `process.env[name]` is empty in the client.
 */
const PUBLIC_ENV: Record<string, string | undefined> = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_UMAMI_SCRIPT_INTEGRITY:
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_INTEGRITY,
  NEXT_PUBLIC_CHROME_EXTENSION_IDS: process.env.NEXT_PUBLIC_CHROME_EXTENSION_IDS,
};

export function stripEnvQuotes(value: string) {
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

/** Trim env values and strip wrapping quotes from Vercel/dashboard pastes. */
export function readEnv(name: string): string {
  const raw = PUBLIC_ENV[name] ?? process.env[name];
  return stripEnvQuotes(raw?.trim() ?? "");
}

export function isLikelySupabaseServiceRoleKey(key: string) {
  if (!key) return false;
  if (/your_|placeholder|changeme|example/i.test(key)) return false;
  if (key.startsWith("sb_publishable_") || key.startsWith("sb_anon_")) {
    return false;
  }
  if (key.startsWith("sb_secret_") && key.length > 20) return true;
  if (key.startsWith("eyJ")) {
    try {
      const payloadPart = key.split(".")[1];
      if (!payloadPart) return key.length > 100;
      const payload = JSON.parse(
        Buffer.from(payloadPart, "base64url").toString("utf8"),
      ) as { role?: string };
      if (payload.role === "anon" || payload.role === "authenticated") {
        return false;
      }
      if (payload.role === "service_role") return true;
    } catch {
      return key.length > 100;
    }
    return key.length > 100;
  }
  return key.length > 40;
}
