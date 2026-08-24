import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  parseRememberSession,
  REMEMBER_SESSION_COOKIE,
  toResponseCookieOptions,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import {
  getSupabasePublicEnv,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";
import { parseCookieHeader } from "@/app/lib/http/parse-cookie-header";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL?.trim();

function resolveRedirectOrigin(
  origin: string,
  forwardedHost: string | null,
): string {
  if (process.env.NODE_ENV === "development") {
    return origin;
  }

  if (ALLOWED_ORIGIN) {
    try {
      const allowed = new URL(ALLOWED_ORIGIN);
      if (forwardedHost && forwardedHost === allowed.host) {
        return `https://${forwardedHost}`;
      }
      return allowed.origin;
    } catch {
      return origin;
    }
  }

  return origin;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = getSafeRedirectPath(searchParams.get("next"));
  const loginError = new URL("/login", origin);
  loginError.searchParams.set("error", "google");
  const env = getSupabasePublicEnv();

  if (!isSupabaseConfigured() || !env || !code) {
    return NextResponse.redirect(loginError);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const redirectOrigin = resolveRedirectOrigin(origin, forwardedHost);
  const redirectResponse = NextResponse.redirect(`${redirectOrigin}${next}`);
  const requestCookies = parseCookieHeader(request.headers.get("cookie"));
  const remember = parseRememberSession(
    requestCookies.find((cookie) => cookie.name === REMEMBER_SESSION_COOKIE)
      ?.value,
  );
  const cookieStore = await cookies();

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet, headers) {
        withAuthCookieOptions(cookiesToSet, remember).forEach(
          ({ name, value, options }) => {
            redirectResponse.cookies.set(
              name,
              value,
              toResponseCookieOptions(options),
            );
            try {
              cookieStore.set(name, value, toResponseCookieOptions(options));
            } catch {
              // Redirect response still carries Set-Cookie.
            }
          },
        );
        Object.entries(headers).forEach(([key, value]) =>
          redirectResponse.headers.set(key, value),
        );
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(loginError);
  }

  await ensureCurrentUserProfile(
    supabase as unknown as Parameters<typeof ensureCurrentUserProfile>[0],
  );
  return redirectResponse;
}
