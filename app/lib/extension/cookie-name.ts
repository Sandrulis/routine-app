import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export function supabaseAuthCookieName() {
  const env = getSupabasePublicEnv();
  if (!env) return "";
  try {
    const host = new URL(env.url).hostname;
    const ref = host.split(".")[0]?.trim();
    return ref ? `sb-${ref}-auth-token` : "";
  } catch {
    return "";
  }
}
