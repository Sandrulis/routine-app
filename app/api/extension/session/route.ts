import type { SupabaseClient } from "@supabase/supabase-js";
import { getExtensionAuth } from "@/app/lib/extension/auth";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import {
  DEFAULT_SITE_LOGO_COLOR,
  siteHeadIconUrl,
} from "@/app/lib/site-admin/branding";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { getRequestLanguageCode } from "@/app/lib/i18n/server";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
import {
  getExtensionStrings,
  resolveExtensionLanguageCode,
} from "@/app/lib/extension/i18n";
import {
  loadExtensionSessionFlags,
  loadExtensionUserSummary,
  loadGmailConnectionSummary,
  listExtensionTeams,
} from "@/app/lib/extension/session-payload";
import {
  GMAIL_PLUGIN_LOGIN_PATH,
  GMAIL_PLUGIN_START_PATH,
} from "@/app/lib/extension/gmail-oauth";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

async function branding() {
  const settings = await getSiteSettings();
  const logoUrl = siteHeadIconUrl(
    settings.logoUrl,
    settings.faviconUrl,
    settings.systemName,
    settings.logoColor || DEFAULT_SITE_LOGO_COLOR,
  );
  return {
    systemName: settings.systemName,
    logoUrl,
    loginPath: "/login",
  };
}

async function sessionLanguage(
  supabase: SupabaseClient | null,
  userId: string | null,
) {
  const fromProfile = await resolveExtensionLanguageCode(supabase, userId);
  let fromRequest = DEFAULT_LANGUAGE;
  try {
    fromRequest = await getRequestLanguageCode();
  } catch {
    // Route may lack a cookie session; profile / default still apply.
  }
  return fromProfile ?? fromRequest;
}

export async function GET(request: Request) {
  const brand = await branding();
  const auth = await getExtensionAuth(request);
  const languageCode = await sessionLanguage(
    auth?.supabase ?? null,
    auth?.user.id ?? null,
  );
  const strings = getExtensionStrings(languageCode, brand.systemName);
  const [emailPasswordEnabled, googleSignInEnabled] = await Promise.all([
    isEmailPasswordAuthEnabled(),
    isGoogleSignInEnabled(),
  ]);

  const publicFlags = {
    ...brand,
    languageCode,
    strings,
    emailPasswordEnabled,
    googleSignInEnabled,
    loginPath: googleSignInEnabled ? GMAIL_PLUGIN_LOGIN_PATH : "/login",
    connectGmailPath: GMAIL_PLUGIN_START_PATH,
  };

  if (!auth) {
    return extensionJson(request, {
      ok: false,
      authenticated: false,
      ...publicFlags,
      error: "errors.extension_auth_required",
    });
  }

  const [flags, user, teams, gmail] = await Promise.all([
    loadExtensionSessionFlags(auth.supabase),
    loadExtensionUserSummary(auth.supabase, auth.user),
    listExtensionTeams(auth.supabase, auth.user.id),
    loadGmailConnectionSummary(auth.user.id),
  ]);

  return extensionJson(request, {
    ok: true,
    authenticated: true,
    ...publicFlags,
    user,
    teams,
    ...gmail,
    ...flags,
    fileUploadEnabled: flags.fileUploadEnabled,
    moduleKey: FRONTEND_MODULE_KEYS.gmailPlugin,
  });
}
