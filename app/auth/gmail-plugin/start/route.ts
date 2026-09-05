import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { isGooglePluginEnabled } from "@/app/lib/integrations/google-plugin/repository";
import { loadExtensionSessionFlags } from "@/app/lib/extension/session-payload";
import { createClient } from "@/app/lib/supabase/server";
import {
  GMAIL_PLUGIN_DONE_PATH,
  GMAIL_PLUGIN_OAUTH_COOKIE,
  GMAIL_PLUGIN_START_PATH,
  buildGmailPluginAuthorizeUrl,
  createGmailPluginOAuthState,
  gmailPluginOAuthCookieOptions,
  serializeGmailPluginOAuthState,
} from "@/app/lib/extension/gmail-oauth";

function redirectTo(origin: string, path: string, query: Record<string, string> = {}) {
  const url = new URL(path, origin);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, value);
  }
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const oauthOrigin = resolveOAuthOrigin(origin) || origin;
  const user = await getCurrentUser();
  if (!user) {
    const next = getSafeRedirectPath(GMAIL_PLUGIN_START_PATH);
    return redirectTo(oauthOrigin, "/login", { next });
  }

  if (!(await isGooglePluginEnabled())) {
    return redirectTo(oauthOrigin, GMAIL_PLUGIN_DONE_PATH, { error: "disabled" });
  }

  const supabase = await createClient();
  const flags = await loadExtensionSessionFlags(supabase);
  if (!flags.gmailPluginEnabled) {
    return redirectTo(oauthOrigin, GMAIL_PLUGIN_DONE_PATH, { error: "disabled" });
  }

  const state = createGmailPluginOAuthState(user.id);
  const serialized = serializeGmailPluginOAuthState(state);
  const url = await buildGmailPluginAuthorizeUrl(oauthOrigin, serialized);
  if (!url) {
    return redirectTo(oauthOrigin, GMAIL_PLUGIN_DONE_PATH, { error: "oauth" });
  }

  const response = NextResponse.redirect(url);
  const cookieStore = await cookies();
  cookieStore.set(
    GMAIL_PLUGIN_OAUTH_COOKIE,
    serialized,
    gmailPluginOAuthCookieOptions(600),
  );
  response.cookies.set(
    GMAIL_PLUGIN_OAUTH_COOKIE,
    serialized,
    gmailPluginOAuthCookieOptions(600),
  );
  return response;
}
