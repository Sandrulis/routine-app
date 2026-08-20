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
import type {
  GoogleOAuthCredentialsInput,
  GoogleOAuthIntegrationStatus,
} from "@/app/lib/integrations/types";

export const GOOGLE_OAUTH_CALLBACK_PATH = "/auth/google-oauth/callback";
export const GOOGLE_OAUTH_ADMIN_PAGE_PATH = "/admin/integrations";
export const GOOGLE_OAUTH_OAUTH_COOKIE = "routine-app-google-oauth-configure";
export const GOOGLE_OAUTH_SCOPES = ["openid", "email", "profile"].join(" ");

async function disableDependentGoogleDriveModule() {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("site_frontend_modules")
    .update({ is_enabled: false })
    .eq("module_key", FRONTEND_MODULE_KEYS.googleDrive)
    .eq("is_enabled", true);
  if (error) {
    logError("disableDependentGoogleDriveModule failed", error.message);
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
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return null;
  if (/your_|placeholder|changeme|example/i.test(clientId + clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

function resolveSiteOrigin() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
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
    .eq("integration_key", SITE_INTEGRATION_KEYS.googleOAuth)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as IntegrationRow;
  if (row.client_secret && !isEncryptedSecret(row.client_secret)) {
    void admin
      .from("site_integrations")
      .update({ client_secret: persistSecret(row.client_secret) })
      .eq("integration_key", SITE_INTEGRATION_KEYS.googleOAuth);
  }
  return {
    ...row,
    client_secret: decryptSecret(row.client_secret),
  };
}

export function getGoogleOAuthCredentialsFromEnv() {
  return readEnvCredentials();
}

export async function getGoogleOAuthCredentials() {
  const row = await fetchIntegrationRow();
  const clientId = row?.client_id?.trim() ?? "";
  const clientSecret = row?.client_secret?.trim() ?? "";
  if (clientId && clientSecret) {
    return { clientId, clientSecret };
  }
  return readEnvCredentials();
}

export async function isGoogleOAuthCredentialsAvailable() {
  const credentials = await getGoogleOAuthCredentials();
  return credentials !== null;
}

export function buildGoogleOAuthCallbackUrl(origin?: string) {
  const base = (origin?.trim() || resolveSiteOrigin()).replace(/\/$/, "");
  if (!base) return GOOGLE_OAUTH_CALLBACK_PATH;
  return `${base}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}

export function buildGoogleDriveCallbackUrl(origin?: string) {
  const base = (origin?.trim() || resolveSiteOrigin()).replace(/\/$/, "");
  if (!base) return "/auth/google-drive/callback";
  return `${base}/auth/google-drive/callback`;
}

export async function fetchGoogleOAuthIntegrationStatus(
  origin = "",
): Promise<GoogleOAuthIntegrationStatus> {
  const row = await fetchIntegrationRow();
  const envCredentials = readEnvCredentials();
  const clientId = row?.client_id?.trim() || envCredentials?.clientId || "";
  const hasClientSecret = Boolean(
    row?.client_secret?.trim() || envCredentials?.clientSecret,
  );
  const configured = row?.is_configured === true;
  const enabled = configured && row?.is_enabled === true;

  return {
    integrationKey: "google_oauth",
    clientId,
    hasClientSecret,
    configured,
    enabled,
    configuredAccountEmail: row?.configured_account_email?.trim() ?? "",
    callbackUrl: buildGoogleOAuthCallbackUrl(origin),
    googleDriveCallbackUrl: buildGoogleDriveCallbackUrl(origin),
  };
}

export async function isGoogleSignInEnabled() {
  const status = await fetchGoogleOAuthIntegrationStatus();
  return status.enabled;
}

export async function saveGoogleOAuthCredentials(input: GoogleOAuthCredentialsInput) {
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
    .eq("integration_key", SITE_INTEGRATION_KEYS.googleOAuth);

  if (error) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  return { ok: true as const };
}

export async function markGoogleOAuthConfigured(input: {
  accountEmail: string;
  configuredBy: string;
}) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_configure_failed" };
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
    .eq("integration_key", SITE_INTEGRATION_KEYS.googleOAuth);

  if (error) {
    return { ok: false as const, error: "errors.integrations_configure_failed" };
  }

  return { ok: true as const };
}

export async function setGoogleOAuthEnabled(enabled: boolean) {
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
    .eq("integration_key", SITE_INTEGRATION_KEYS.googleOAuth);

  if (error) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  if (!enabled) {
    await disableDependentGoogleDriveModule();
  }

  return { ok: true as const };
}

export async function resetGoogleOAuthConfiguration() {
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
    .eq("integration_key", SITE_INTEGRATION_KEYS.googleOAuth);

  if (error) {
    return { ok: false as const, error: "errors.integrations_reset_failed" };
  }

  await disableDependentGoogleDriveModule();

  return { ok: true as const };
}
