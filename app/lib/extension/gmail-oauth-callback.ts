import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { saveUserGmailConnection } from "@/app/lib/extension/gmail-connection";
import {
  GMAIL_PLUGIN_DONE_PATH,
  GMAIL_PLUGIN_OAUTH_COOKIE,
  exchangeGmailPluginCode,
  fetchGmailPluginUserInfo,
  gmailPluginOAuthCookieOptions,
  parseGmailPluginOAuthState,
} from "@/app/lib/extension/gmail-oauth";

function redirectToDone(origin: string, query: Record<string, string> = {}) {
  const url = new URL(GMAIL_PLUGIN_DONE_PATH, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

function clearOAuthCookie(response: NextResponse) {
  response.cookies.set(GMAIL_PLUGIN_OAUTH_COOKIE, "", {
    ...gmailPluginOAuthCookieOptions(0),
    maxAge: 0,
  });
  return response;
}

export function isGmailPluginOAuthCallback(state: string | null | undefined) {
  return parseGmailPluginOAuthState(state) !== null;
}

export async function handleGmailPluginOAuthCallback(
  request: Request,
  callbackPath: string,
) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const cookieStore = await cookies();
  const cookieState = parseGmailPluginOAuthState(
    cookieStore.get(GMAIL_PLUGIN_OAUTH_COOKIE)?.value,
  );
  const urlState = parseGmailPluginOAuthState(searchParams.get("state"));

  if (
    !code ||
    !cookieState ||
    !urlState ||
    cookieState.userId !== urlState.userId ||
    cookieState.nonce !== urlState.nonce
  ) {
    return clearOAuthCookie(redirectToDone(origin, { error: "oauth" }));
  }

  const user = await getCurrentUser();
  if (!user || user.id !== cookieState.userId) {
    return clearOAuthCookie(redirectToDone(origin, { error: "auth" }));
  }

  const tokens = await exchangeGmailPluginCode(origin, code, callbackPath);
  if (!tokens?.access_token) {
    return clearOAuthCookie(redirectToDone(origin, { error: "oauth" }));
  }

  const profile = await fetchGmailPluginUserInfo(tokens.access_token);
  const saved = await saveUserGmailConnection({
    userId: user.id,
    googleEmail: profile.email,
    refreshToken: tokens.refresh_token || "",
    accessToken: tokens.access_token,
    expiresIn: Number(tokens.expires_in) || 3600,
    givenName: profile.givenName,
    familyName: profile.familyName,
    name: profile.name,
    avatarUrl: profile.avatarUrl,
  });
  if (!saved.ok) {
    return clearOAuthCookie(redirectToDone(origin, { error: "save" }));
  }

  return clearOAuthCookie(redirectToDone(origin, { connected: "1" }));
}
