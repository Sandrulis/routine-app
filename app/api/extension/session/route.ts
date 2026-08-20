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
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { getRequestLanguageCode } from "@/app/lib/i18n/server";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
import {
  getExtensionStrings,
  resolveExtensionLanguageCode,
} from "@/app/lib/extension/i18n";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

async function isFileUploadEnabled(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .select("is_enabled")
    .eq("module_key", FRONTEND_MODULE_KEYS.fileUpload)
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

  const auth = await getExtensionAuth(request);
  const fromProfile = await resolveExtensionLanguageCode(
    auth?.supabase ?? null,
    auth?.user.id ?? null,
  );
  let fromRequest = DEFAULT_LANGUAGE;
  try {
    fromRequest = await getRequestLanguageCode();
  } catch {
    // Route may lack a cookie session; profile / default still apply.
  }
  const languageCode = fromProfile ?? fromRequest;
  const strings = getExtensionStrings(languageCode);

  if (!auth) {
    return extensionJson(request, {
      ok: false,
      authenticated: false,
      systemName: settings.systemName,
      logoUrl,
      loginPath: "/login",
      languageCode,
      strings,
      error: "errors.extension_auth_required",
    });
  }

  const fileUploadEnabled = await isFileUploadEnabled(auth.supabase);

  return extensionJson(request, {
    ok: true,
    authenticated: true,
    systemName: settings.systemName,
    logoUrl,
    loginPath: "/login",
    languageCode,
    strings,
    user: {
      id: auth.user.id,
      email: auth.user.email ?? null,
    },
    fileUploadEnabled,
  });
}
