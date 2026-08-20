import { logError } from "@/app/lib/security/log-error";
import {
  decryptSecret,
  isEncryptedSecret,
  persistSecret,
} from "@/app/lib/security/secret-box";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import {
  SIMPLE_INTEGRATION_DEFINITIONS,
  type SimpleIntegrationDefinition,
} from "@/app/lib/integrations/simple/definitions";
import type { SimpleSiteIntegrationKey } from "@/app/lib/integrations/keys";
import type {
  SimpleIntegrationCredentialsInput,
  SimpleIntegrationStatus,
} from "@/app/lib/integrations/types";

type IntegrationRow = {
  integration_key: string;
  client_id: string;
  client_secret: string;
  is_configured: boolean;
  is_enabled: boolean;
};

function definitionFor(key: SimpleSiteIntegrationKey): SimpleIntegrationDefinition {
  return SIMPLE_INTEGRATION_DEFINITIONS[key];
}

function readEnvValue(name: string | undefined) {
  if (!name) return "";
  return process.env[name]?.trim() ?? "";
}

async function fetchIntegrationRow(key: SimpleSiteIntegrationKey) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("site_integrations")
    .select("integration_key, client_id, client_secret, is_configured, is_enabled")
    .eq("integration_key", key)
    .maybeSingle();
  if (error) {
    logError(`fetchIntegrationRow(${key}) failed`, error.message);
    return null;
  }
  const row = data as IntegrationRow | null;
  if (row?.client_secret && !isEncryptedSecret(row.client_secret)) {
    void admin
      .from("site_integrations")
      .update({ client_secret: persistSecret(row.client_secret) })
      .eq("integration_key", key);
  }
  if (!row) return null;
  return {
    ...row,
    client_secret: decryptSecret(row.client_secret),
  };
}

export async function fetchSimpleIntegrationStatus(
  key: SimpleSiteIntegrationKey,
): Promise<SimpleIntegrationStatus> {
  const definition = definitionFor(key);
  const row = await fetchIntegrationRow(key);
  const envClientId = readEnvValue(definition.envClientId);
  const envClientSecret = readEnvValue(definition.envClientSecret);
  const clientId = row?.client_id?.trim() || envClientId;
  const hasClientSecret = Boolean(
    row?.client_secret?.trim() || envClientSecret,
  );
  const configured = row?.is_configured === true;
  const enabled = configured && row?.is_enabled === true;

  return {
    integrationKey: key,
    clientId,
    hasClientSecret,
    configured,
    enabled,
  };
}

export async function isSimpleIntegrationEnabled(key: SimpleSiteIntegrationKey) {
  const status = await fetchSimpleIntegrationStatus(key);
  return status.enabled;
}

export async function getSimpleIntegrationCredentials(
  key: SimpleSiteIntegrationKey,
): Promise<{ clientId: string; clientSecret: string } | null> {
  const definition = definitionFor(key);
  const row = await fetchIntegrationRow(key);
  const envClientId = readEnvValue(definition.envClientId);
  const envClientSecret = readEnvValue(definition.envClientSecret);
  const clientId = row?.client_id?.trim() || envClientId;
  const clientSecret =
    row?.client_secret?.trim() ||
    envClientSecret ||
    definition.defaultClientSecret?.trim() ||
    "";

  if (definition.requireClientId && !clientId) return null;
  if (definition.requireClientSecret && !clientSecret) return null;
  if (!definition.requireClientId && definition.requireClientSecret && !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

function hasRequiredCredentials(
  definition: SimpleIntegrationDefinition,
  clientId: string,
  hasSecret: boolean,
) {
  if (definition.requireClientId && !clientId) return false;
  if (definition.requireClientSecret && !hasSecret) return false;
  return true;
}

export async function saveSimpleIntegrationCredentials(
  key: SimpleSiteIntegrationKey,
  input: SimpleIntegrationCredentialsInput,
) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  const definition = definitionFor(key);
  const clientId = input.clientId.trim();
  const clientSecretInput = input.clientSecret.trim();
  const row = await fetchIntegrationRow(key);
  const existingSecret = row?.client_secret?.trim() ?? "";
  const envSecret = readEnvValue(definition.envClientSecret);

  if (definition.requireClientId && !clientId) {
    return { ok: false as const, error: definition.missingClientIdError };
  }

  let nextSecret = existingSecret;
  if (clientSecretInput) {
    nextSecret = clientSecretInput;
  } else if (!nextSecret && definition.defaultClientSecret) {
    nextSecret = definition.defaultClientSecret;
  } else if (!nextSecret && envSecret) {
    nextSecret = envSecret;
  }

  const hasSecret = Boolean(nextSecret);
  if (definition.requireClientSecret && !hasSecret) {
    return { ok: false as const, error: definition.missingClientSecretError };
  }

  const configured = hasRequiredCredentials(definition, clientId, hasSecret);
  const admin = createAdminClient();
  const patch: Record<string, unknown> = {
    client_id: clientId,
    updated_at: new Date().toISOString(),
    is_configured: configured,
  };

  if (clientSecretInput || (!existingSecret && nextSecret)) {
    patch.client_secret = persistSecret(nextSecret);
  }

  if (!configured) {
    patch.is_enabled = false;
  } else if (row?.is_configured !== true) {
    patch.configured_at = new Date().toISOString();
  }

  const { error } = await admin
    .from("site_integrations")
    .update(patch)
    .eq("integration_key", key);

  if (error) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  return { ok: true as const };
}

export async function setSimpleIntegrationEnabled(
  key: SimpleSiteIntegrationKey,
  enabled: boolean,
) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  const row = await fetchIntegrationRow(key);
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
    .eq("integration_key", key);

  if (error) {
    return { ok: false as const, error: "errors.integrations_save_failed" };
  }

  return { ok: true as const };
}

export async function resetSimpleIntegration(key: SimpleSiteIntegrationKey) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.integrations_reset_failed" };
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("site_integrations")
    .update({
      client_id: "",
      client_secret: "",
      is_configured: false,
      is_enabled: false,
      configured_account_email: "",
      configured_by: null,
      configured_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("integration_key", key);

  if (error) {
    return { ok: false as const, error: "errors.integrations_reset_failed" };
  }

  return { ok: true as const };
}
