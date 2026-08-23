import { isLikelySupabaseServiceRoleKey, readEnv } from "@/app/lib/env/read-env";
import { logError } from "@/app/lib/security/log-error";

export function getSupabasePublicEnv() {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!url || !anonKey || url.includes("YOUR_")) {
    return null;
  }

  return { url, anonKey };
}

export function isSupabaseConfigured() {
  return getSupabasePublicEnv() !== null;
}

export function getSupabaseServiceRoleKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY");
}

let loggedAdminMissing = false;

export function isSupabaseAdminConfigured() {
  if (!isSupabaseConfigured()) return false;
  const ok = isLikelySupabaseServiceRoleKey(getSupabaseServiceRoleKey());
  if (!ok && !loggedAdminMissing) {
    loggedAdminMissing = true;
    logError(
      "Supabase admin env",
      "SUPABASE_SERVICE_ROLE_KEY missing, quoted, or not a service_role / sb_secret key — login methods stay hidden",
    );
  }
  return ok;
}
