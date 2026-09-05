import { readEnv } from "@/app/lib/env/read-env";
import { logError } from "@/app/lib/security/log-error";
import {
  decryptSecret,
  isEncryptedSecret,
  persistSecret,
} from "@/app/lib/security/secret-box";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import { KNOWN_SITE_ORIGINS } from "@/app/lib/seo/known-site-origins";
import type {
  GooglePluginCredentialsInput,
  GooglePluginIntegrationStatus,
} from "@/app/lib/integrations/types";

export const GOOGLE_PLUGIN_CALLBACK_PATH = "/auth/google-plugin/callback";
export const GOOGLE_PLUGIN_ADMIN_PAGE_PATH = "/admin/integrations";
export const GOOGLE_PLUGIN_OAUTH_COOKIE = "routine-app-google-plugin-oauth";
export const GOOGLE_PLUGIN_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

async function disableDependentGmailPluginModule() {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("site_frontend_modules")
    .update({ is_enabled: false })
    .eq("module_key", FRONTEND_MODULE_KEYS.gmailPlugin)
    .eq("is_enabled", true);
  if (error) {
    logError("disableDependentGmailPluginModule failed", error.message);
  }
}

type IntegrationRow = {
  integration_key: string;
  client_id: string;
  client_secret: string;
  is_configured: boolean;
  is_enabled: boolean;
  configured_account_email: string;
};

function readEnvCredentials() {
  const clientId = readEnv("GOOGLE_PLUGIN_CLIENT_ID");
  const clientSecret = readEnv("GOOGLE_PLUGIN_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  if (/your_|placeholder|changeme|example/i.test(clientId + clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

function resolveSiteOrigin() {
  const siteUrl = readEnv("NEXT_PUBLIC_SITE_URL");
  if (siteUrl) {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return "";
    }
  }
  return "";
}

async function fetchIntegrationRow(): Promise<IntegrationRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_integrations")
    .select(
      "integration_key, client_id, client_secret, is_configured, is_enabled, configured_account_email",
    )
    .eq("integration_key", SITE_INTEGRATION_KEYS.googlePlugin)
    .maybeSingle();
  if (error) {
    logError("fetchGooglePluginIntegrationRow failed", error.message);
    return null;
  }
  if (!data) return null;
  const row = data as IntegrationRow;
  if (row.client_secret && !isEncryptedSecret(row.client_secret)) {
    const encrypted = persistSecret(row.client_secret);
    if (encrypted) {
      void admin
        .from("site_integrations")
        .update({ client_secret: encrypted })
        .eq("integration_key", SITE_INTEGRATION_KEYS.googlePlugin);
    }
  }
  return {
    ...row,
    client_secret: decryptSecret(row.client_secret),
  };
}

export async function getGooglePluginCredentials() {
  const row = await fetchIntegrationRow();
  const clientId = row?.client_id?.trim() ?? "";
  const clientSecret = row?.client_secret?.trim() ?? "";
  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }
  return readEnvCredentials();
}

export async function isGooglePluginCredentialsAvailable() {
  const credentials = await getGooglePluginCredentials();
  return credentials !== null;
}

export function buildGooglePluginCallbackUrl(origin?: string) {
  const base = (origin?.trim() || resolveSiteOrigin()).replace(/\/$/, "");
  if (!base) return GOOGLE_PLUGIN_CALLBACK_PATH;
  return `${base}${GOOGLE_PLUGIN_CALLBACK_PATH}`;
}

export function listGooglePluginRedirectUrls(primaryOrigin = ""): string[] {
  const primary = primaryOrigin.trim().replace(/\/$/, "");
  const origins = [
    primary,
    ...KNOWN_SITE_ORIGINS.filter((origin) => origin !== primary),
  ].filter(Boolean);
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const origin of origins) {
    const url = buildGooglePluginCallbackUrl(origin);
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export async function fetchGooglePluginIntegrationStatus(
  origin = "",
): Promise<GooglePluginIntegrationStatus> {
  const row = await fetchIntegrationRow();
  const envCredentials = readEnvCredentials();
  const clientId = row?.client_id?.trim() || envCredentials?.clientId || "";
  const hasClientSecret = Boolean(
    row?.client_secret?.trim() || envCredentials?.clientSecret,
  );
  const configured = row?.is_configured === true;
  const enabled = configured && row?.is_enabled === true;

  return {
    integrationKey: "google_plugin",
    clientId,
    hasClientSecret,
    configured,
    enabled,
    configuredAccountEmail: row?.configured_account_email?.trim() ?? "",
    callbackUrl: buildGooglePluginCallbackUrl(origin),
    redirectUrls: listGooglePluginRedirectUrls(origin),
    scopes: GOOGLE_PLUGIN_SCOPES.split(" "),
  };
}

export async function isGooglePluginEnabled() {
  const status = await fetchGooglePluginIntegrationStatus();
  return status.enabled;
}

export async function saveGooglePluginCredentials(input: GooglePluginCredentialsInput) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  const clientId = input.clientId.trim();
  const clientSecret = input.clientSecret.trim();
  if (!clientId) {
    return { ok: false as const, error: "errors.integrations_client_id_required" };
  }

  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    client_id: clientId,
    updated_at: new Date().toISOString(),
  };

  if (clientSecret) {
    patch.client_secret = persistSecret(clientSecret);
  }

  const { error } = await admin
    .from("site_integrations")
    .update(patch)
    .eq("integration_key", SITE_INTEGRATION_KEYS.googlePlugin);

  if (error) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  return { ok: true as const };
}

export async function markGooglePluginConfigured(input: {
  accountEmail: string;
  configuredBy: string;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_google_plugin_configure_failed" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_integrations")
    .update({
      is_configured: true,
      configured_account_email: input.accountEmail.trim(),
      configured_by: input.configuredBy,
      configured_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("integration_key", SITE_INTEGRATION_KEYS.googlePlugin);

  if (error) {
    return { ok: false as const, error: "errors.integrations_google_plugin_configure_failed" };
  }

  return { ok: true as const };
}

export async function setGooglePluginEnabled(enabled: boolean) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  const row = await fetchIntegrationRow();
  if (row?.is_configured !== true) {
    return { ok: false as const, error: "errors.integrations_not_configured" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_integrations")
    .update({
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq("integration_key", SITE_INTEGRATION_KEYS.googlePlugin);

  if (error) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  if (!enabled) {
    await disableDependentGmailPluginModule();
  }

  return { ok: true as const };
}

export async function resetGooglePluginConfiguration() {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_reset_failed" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_integrations")
    .update({
      is_configured: false,
      is_enabled: false,
      configured_account_email: "",
      configured_by: null,
      configured_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("integration_key", SITE_INTEGRATION_KEYS.googlePlugin);

  if (error) {
    return { ok: false as const, error: "errors.integrations_reset_failed" };
  }

  await disableDependentGmailPluginModule();

  return { ok: true as const };
}
