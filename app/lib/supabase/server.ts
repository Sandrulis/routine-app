import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  parseRememberSession,
  REMEMBER_SESSION_COOKIE,
  toResponseCookieOptions,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import { getSupabasePublicEnv } from "@/app/lib/supabase/env";

export async function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) {
    throw new Error(
      "Supabase env is missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = await cookies();
  const remember = parseRememberSession(
    cookieStore.get(REMEMBER_SESSION_COOKIE)?.value,
  );

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          withAuthCookieOptions(cookiesToSet, remember).forEach(
            ({ name, value, options }) =>
              cookieStore.set(name, value, toResponseCookieOptions(options)),
          );
        } catch {
          // Called from a Server Component — proxy refreshes sessions.
        }
      },
    },
  });
}
