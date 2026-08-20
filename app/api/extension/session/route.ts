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
  if (!auth) {
    return extensionJson(request, {
      ok: false,
      authenticated: false,
      systemName: settings.systemName,
      logoUrl,
      loginPath: "/login",
      error: "errors.auth_required",
    });
  }

  const fileUploadEnabled = await isFileUploadEnabled(auth.supabase);

  return extensionJson(request, {
    ok: true,
    authenticated: true,
    systemName: settings.systemName,
    logoUrl,
    loginPath: "/login",
    user: {
      id: auth.user.id,
      email: auth.user.email ?? null,
    },
    fileUploadEnabled,
  });
}
