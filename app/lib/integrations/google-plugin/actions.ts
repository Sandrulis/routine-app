"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { resolveOAuthOrigin } from "@/app/lib/auth/oauth-origin";
import {
  fetchGooglePluginIntegrationStatus,
  isGooglePluginCredentialsAvailable,
  resetGooglePluginConfiguration,
  saveGooglePluginCredentials,
  setGooglePluginEnabled,
} from "@/app/lib/integrations/google-plugin/repository";
import type {
  GooglePluginCredentialsInput,
  GooglePluginIntegrationStatus,
} from "@/app/lib/integrations/types";
import {
  buildGooglePluginAuthorizeUrl,
  createGooglePluginConfigureState,
  googlePluginOAuthCookieOptions,
  GOOGLE_PLUGIN_OAUTH_COOKIE,
  serializeGooglePluginConfigureState,
} from "@/app/lib/integrations/google-plugin/oauth";
import { GOOGLE_PLUGIN_SCOPES } from "@/app/lib/integrations/google-plugin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";
import type { ActionResult } from "@/app/lib/actions/action-result";

function refreshIntegrations() {
  revalidatePath("/admin/integrations");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/modules");
}

export async function getGooglePluginIntegrationStatusAction(
  origin: string,
): Promise<ActionResult<GooglePluginIntegrationStatus>> {
  await requireAdmin();
  const status = await fetchGooglePluginIntegrationStatus(origin);
  return { ok: true, data: status };
}

export async function saveGooglePluginCredentialsAction(
  input: GooglePluginCredentialsInput,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.google_plugin.save" });
  const result = await saveGooglePluginCredentials(input);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function setGooglePluginEnabledAction(
  enabled: boolean,
): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.google_plugin.toggle" });
  const result = await setGooglePluginEnabled(enabled);
  if (result.ok) refreshIntegrations();
  return result;
}

export async function resetGooglePluginConfigurationAction(): Promise<ActionResult> {
  await requireAdmin({ action: "integrations.google_plugin.reset" });
  const result = await resetGooglePluginConfiguration();
  if (result.ok) refreshIntegrations();
  return result;
}

export async function startGooglePluginConfigureAction(
  origin: string,
): Promise<ActionResult<{ url: string }>> {
  const admin = await requireAdmin({ action: "integrations.google_plugin.configure" });
  if (!(await isGooglePluginCredentialsAvailable())) {
    return { ok: false, error: "errors.integrations_credentials_missing" };
  }

  const oauthOrigin = resolveOAuthOrigin(origin);
  if (!oauthOrigin) {
    return { ok: false, error: "errors.integrations_google_plugin_configure_failed" };
  }

  const state = createGooglePluginConfigureState(admin.id);
  const serialized = serializeGooglePluginConfigureState(state);
  const url = await buildGooglePluginAuthorizeUrl(oauthOrigin, serialized, {
    prompt: "select_account consent",
    accessType: "offline",
    scopes: GOOGLE_PLUGIN_SCOPES,
    includeGrantedScopes: true,
  });
  if (!url) {
    return { ok: false, error: "errors.integrations_credentials_missing" };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    GOOGLE_PLUGIN_OAUTH_COOKIE,
    serialized,
    googlePluginOAuthCookieOptions(600),
  );

  return { ok: true, data: { url } };
}
