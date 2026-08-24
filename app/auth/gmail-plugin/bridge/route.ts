import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  REMEMBER_SESSION_COOKIE,
  toResponseCookieOptions,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import { parseGmailBridgeTicket } from "@/app/lib/extension/gmail-bridge-ticket";
import {
  GMAIL_PLUGIN_DONE_PATH,
  GMAIL_PLUGIN_START_PATH,
} from "@/app/lib/extension/gmail-oauth";
import { parseCookieHeader } from "@/app/lib/http/parse-cookie-header";
import {
  getSupabasePublicEnv,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";

export const runtime = "nodejs";

async function refreshWithToken(
  env: { url: string; anonKey: string },
  refreshToken: string,
) {
  const response = await fetch(
    `${env.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${env.anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
  } | null;
  if (!data?.access_token) return null;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
  };
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const oauthOrigin = resolveOAuthOrigin(origin) || origin;
  const fail = NextResponse.redirect(
    new URL(`${GMAIL_PLUGIN_DONE_PATH}?error=oauth`, oauthOrigin),
  );

  if (!isSupabaseConfigured()) return fail;

  const env = getSupabasePublicEnv();
  if (!env) return fail;

  const ticket = parseGmailBridgeTicket(searchParams.get("t"));
  if (!ticket) return fail;

  const refreshed = await refreshWithToken(env, ticket.refreshToken);
  if (!refreshed) return fail;

  const redirectResponse = NextResponse.redirect(
    new URL(GMAIL_PLUGIN_START_PATH, oauthOrigin),
  );
  const requestCookies = parseCookieHeader(request.headers.get("cookie"));
  const cookieStore = await cookies();

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet, headers) {
        withAuthCookieOptions(cookiesToSet, true).forEach(
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

  const { data, error } = await supabase.auth.setSession({
    access_token: refreshed.accessToken,
    refresh_token: refreshed.refreshToken,
  });
  if (error || !data.session || data.session.user.id !== ticket.userId) {
    return fail;
  }

  redirectResponse.cookies.set(REMEMBER_SESSION_COOKIE, "1", {
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
    sameSite: "lax",
    secure:
      process.env.NODE_ENV === "production" ||
      (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    httpOnly: false,
  });

  return redirectResponse;
}
