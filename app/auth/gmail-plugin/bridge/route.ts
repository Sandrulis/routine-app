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
import {
  getSupabasePublicEnv,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";

export const runtime = "nodejs";

function parseCookieHeader(header: string | null) {
  if (!header) return [];
  return header.split(";").flatMap((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator < 0) return [];
    const rawName = trimmed.slice(0, separator);
    const rawValue = trimmed.slice(separator + 1);
    try {
      return [
        {
          name: decodeURIComponent(rawName),
          value: decodeURIComponent(rawValue),
        },
      ];
    } catch {
      return [{ name: rawName, value: rawValue }];
    }
  });
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
    access_token: ticket.accessToken,
    refresh_token: ticket.refreshToken,
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
