import { accessTokenNeedsTotpChallenge } from "@/app/lib/auth/mfa";
import { getExtensionAuth } from "@/app/lib/extension/auth";
import { getExtensionBranding } from "@/app/lib/extension/branding";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import {
  getExtensionStrings,
  resolveExtensionUiLanguage,
} from "@/app/lib/extension/i18n";
import {
  loadExtensionSessionFlags,
  loadExtensionUserSummary,
  loadGmailConnectionSummary,
  listExtensionTeams,
} from "@/app/lib/extension/session-payload";
import {
  GMAIL_PLUGIN_BRIDGE_PATH,
  GMAIL_PLUGIN_LOGIN_PATH,
  GMAIL_PLUGIN_START_PATH,
} from "@/app/lib/extension/gmail-oauth";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { isGooglePluginEnabled } from "@/app/lib/integrations/google-plugin/repository";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

export const runtime = "nodejs";

function bearerToken(request: Request): string {
  const header = request.headers.get("authorization")?.trim() ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? "";
}

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

async function branding() {
  const brand = await getExtensionBranding();
  return {
    ...brand,
    loginPath: GMAIL_PLUGIN_LOGIN_PATH,
  };
}

export async function GET(request: Request) {
  const [brand, auth] = await Promise.all([
    branding(),
    getExtensionAuth(request),
  ]);

  // One parallel wave: public flags plus everything the authed payload needs.
  const publicWork = Promise.all([
    resolveExtensionUiLanguage(auth?.supabase ?? null, auth?.user.id ?? null),
    isEmailPasswordAuthEnabled(),
    isGooglePluginEnabled(),
  ]);

  function publicPayload(
    languageCode: Awaited<typeof publicWork>[0],
    emailPasswordEnabled: boolean,
    googleSignInEnabled: boolean,
  ) {
    return {
      ...brand,
      languageCode,
      strings: getExtensionStrings(languageCode, brand.systemName),
      emailPasswordEnabled,
      googleSignInEnabled,
      loginPath: GMAIL_PLUGIN_LOGIN_PATH,
      connectGmailPath: GMAIL_PLUGIN_START_PATH,
      connectGmailBridgePath: GMAIL_PLUGIN_BRIDGE_PATH,
    };
  }

  if (!auth) {
    const [languageCode, emailPasswordEnabled, googleSignInEnabled] =
      await publicWork;
    return extensionJson(request, {
      ok: false,
      authenticated: false,
      ...publicPayload(languageCode, emailPasswordEnabled, googleSignInEnabled),
      error: "errors.extension_auth_required",
    });
  }

  const accessToken = bearerToken(request);
  const [
    [languageCode, emailPasswordEnabled, googleSignInEnabled],
    needsMfa,
    flags,
    user,
    teams,
    gmail,
  ] = await Promise.all([
    publicWork,
    accessToken
      ? accessTokenNeedsTotpChallenge(auth.user, accessToken)
      : Promise.resolve(false),
    loadExtensionSessionFlags(auth.supabase),
    loadExtensionUserSummary(auth.supabase, auth.user),
    listExtensionTeams(auth.supabase, auth.user.id),
    loadGmailConnectionSummary(auth.user.id),
  ]);

  const publicFlags = publicPayload(
    languageCode,
    emailPasswordEnabled,
    googleSignInEnabled,
  );

  if (needsMfa) {
    return extensionJson(request, {
      ok: false,
      authenticated: false,
      needsMfa: true,
      ...publicFlags,
      error: "errors.extension_login_mfa",
    });
  }

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
