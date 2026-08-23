/** Trim env values and strip wrapping quotes from Vercel/dashboard pastes. */
export function readEnv(name: string): string {
  let value = process.env[name]?.trim() ?? "";
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

export function isLikelySupabaseServiceRoleKey(key: string) {
  if (!key) return false;
  if (/your_|placeholder|changeme|example/i.test(key)) return false;
  if (key.startsWith("sb_secret_") && key.length > 20) return true;
  return key.startsWith("eyJ") && key.length > 100;
}
