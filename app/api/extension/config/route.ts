import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import { getExtensionStrings } from "@/app/lib/extension/i18n";
import {
  GMAIL_PLUGIN_BRIDGE_PATH,
  GMAIL_PLUGIN_LOGIN_PATH,
  GMAIL_PLUGIN_START_PATH,
} from "@/app/lib/extension/gmail-oauth";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import { getRequestLanguageCode } from "@/app/lib/i18n/server";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { isGoogleSignInEnabled } from "@/app/lib/integrations/google-oauth/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import {
  DEFAULT_SITE_LOGO_COLOR,
  siteHeadIconUrl,
} from "@/app/lib/site-admin/branding";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

async function isGmailPluginEnabled() {
  if (!isSupabaseAdminConfigured()) return true;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_frontend_modules")
    .select("is_enabled")
    .eq("module_key", FRONTEND_MODULE_KEYS.gmailPlugin)
    .maybeSingle();
  if (error || !data) return true;
  return data.is_enabled === true;
}

export async function GET(request: Request) {
  const settings = await getSiteSettings();
  const logoUrl = siteHeadIconUrl(
    settings.logoUrl,
    settings.faviconUrl,
    settings.systemName,
    settings.logoColor || DEFAULT_SITE_LOGO_COLOR,
  );
  let languageCode = DEFAULT_LANGUAGE;
  try {
    languageCode = await getRequestLanguageCode();
  } catch {
    // public config
  }
  const [
    emailPasswordEnabled,
    googleSignInEnabled,
    gmailPluginEnabled,
  ] = await Promise.all([
    isEmailPasswordAuthEnabled(),
    isGoogleSignInEnabled(),
    isGmailPluginEnabled(),
  ]);

  return extensionJson(request, {
    ok: true,
    appOrigin: getPublicSiteUrl(),
    authCookieName: supabaseAuthCookieName(),
    systemName: settings.systemName,
    logoUrl,
    loginPath: GMAIL_PLUGIN_LOGIN_PATH,
    connectGmailPath: GMAIL_PLUGIN_START_PATH,
    connectGmailBridgePath: GMAIL_PLUGIN_BRIDGE_PATH,
    languageCode,
    strings: getExtensionStrings(languageCode, settings.systemName),
    emailPasswordEnabled,
    googleSignInEnabled,
    gmailPluginEnabled,
  });
}
