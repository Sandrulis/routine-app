import { NextResponse } from "next/server";
import {
  createOAuthLoginState,
  serializeOAuthLoginState,
} from "@/app/lib/auth/oauth-login-state";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import {
  AUTH_SESSION_MAX_AGE,
  REMEMBER_SESSION_COOKIE,
} from "@/app/lib/auth/remember-session";
import {
  GMAIL_PLUGIN_DONE_PATH,
  GMAIL_PLUGIN_SCOPES,
} from "@/app/lib/extension/gmail-oauth";
import {
  buildGoogleOAuthAuthorizeUrl,
  googleOAuthConfigureCookieOptions,
  GOOGLE_OAUTH_OAUTH_COOKIE,
} from "@/app/lib/integrations/google-oauth/oauth";

function redirectTo(origin: string, path: string, query: Record<string, string> = {}) {
  const url = new URL(path, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function rememberCookieOptions() {
  return {
    path: "/",
    maxAge: AUTH_SESSION_MAX_AGE,
    sameSite: "lax" as const,
    secure:
      process.env.NODE_ENV === "production" ||
      (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://"),
    httpOnly: false,
  };
}

function withRememberCookie(response: NextResponse) {
  response.cookies.set(REMEMBER_SESSION_COOKIE, "1", rememberCookieOptions());
  return response;
}

/**
 * Plugin Google login: identity + Gmail readonly in one consent, with offline
 * refresh so `user_gmail_connections` can be filled in the same callback.
 * Website `/login` Google stays on identity scopes only.
 */
export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const oauthOrigin = resolveOAuthOrigin(origin) || origin;

  const state = createOAuthLoginState({
    next: `${GMAIL_PLUGIN_DONE_PATH}?logged_in=1`,
    errorPage: "plugin",
  });
  const serialized = serializeOAuthLoginState(state);
  const url = await buildGoogleOAuthAuthorizeUrl(oauthOrigin, serialized, {
    // select_account + consent: pick account and always mint a refresh token
    prompt: "select_account consent",
    accessType: "offline",
    scopes: GMAIL_PLUGIN_SCOPES,
    includeGrantedScopes: true,
  });
  if (!url) {
    return redirectTo(oauthOrigin, GMAIL_PLUGIN_DONE_PATH, {
      login: "1",
      error: "oauth",
    });
  }

  const response = withRememberCookie(NextResponse.redirect(url));
  response.cookies.set(
    GOOGLE_OAUTH_OAUTH_COOKIE,
    serialized,
    googleOAuthConfigureCookieOptions(600),
  );
  return response;
}

export const runtime = "nodejs";
