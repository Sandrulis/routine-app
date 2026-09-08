import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import { getExtensionBranding } from "@/app/lib/extension/branding";
import {
  getExtensionFallbackLanguageCode,
  getExtensionStrings,
  languageCodeFromExtensionRequest,
} from "@/app/lib/extension/i18n";
import {
  GMAIL_PLUGIN_BRIDGE_PATH,
  GMAIL_PLUGIN_LOGIN_PATH,
  GMAIL_PLUGIN_START_PATH,
} from "@/app/lib/extension/gmail-oauth";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { isGooglePluginEnabled } from "@/app/lib/integrations/google-plugin/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

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
  const brand = await getExtensionBranding();
  const languageCode =
    languageCodeFromExtensionRequest(request) ??
    (await getExtensionFallbackLanguageCode());
  const [
    emailPasswordEnabled,
    googleSignInEnabled,
    gmailPluginEnabled,
  ] = await Promise.all([
    isEmailPasswordAuthEnabled(),
    isGooglePluginEnabled(),
    isGmailPluginEnabled(),
  ]);

  return extensionJson(request, {
    ok: true,
    appOrigin: getPublicSiteUrl(),
    authCookieName: supabaseAuthCookieName(),
    ...brand,
    loginPath: GMAIL_PLUGIN_LOGIN_PATH,
    connectGmailPath: GMAIL_PLUGIN_START_PATH,
    connectGmailBridgePath: GMAIL_PLUGIN_BRIDGE_PATH,
    languageCode,
    strings: getExtensionStrings(languageCode, brand.systemName),
    emailPasswordEnabled,
    googleSignInEnabled,
    gmailPluginEnabled,
  });
}
