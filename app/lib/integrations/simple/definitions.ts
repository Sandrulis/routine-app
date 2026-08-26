import {
  SITE_INTEGRATION_KEYS,
  type SimpleSiteIntegrationKey,
} from "@/app/lib/integrations/keys";

export type SimpleIntegrationDefinition = {
  key: SimpleSiteIntegrationKey;
  requireClientId: boolean;
  requireClientSecret: boolean;
  /** Used when client_secret is empty on save and no secret is stored yet. */
  defaultClientSecret?: string;
  envClientId?: string;
  envClientSecret?: string;
  missingClientIdError: string;
  missingClientSecretError: string;
};

export const DEFAULT_UMAMI_SCRIPT_URL = "https://cloud.umami.is/script.js";

export const SIMPLE_INTEGRATION_DEFINITIONS: Record<
  SimpleSiteIntegrationKey,
  SimpleIntegrationDefinition
> = {
  [SITE_INTEGRATION_KEYS.resend]: {
    key: SITE_INTEGRATION_KEYS.resend,
    requireClientId: true,
    requireClientSecret: true,
    envClientId: "RESEND_FROM_EMAIL",
    envClientSecret: "RESEND_API_KEY",
    missingClientIdError: "errors.integrations_resend_from_required",
    missingClientSecretError: "errors.integrations_resend_api_key_required",
  },
  [SITE_INTEGRATION_KEYS.umami]: {
    key: SITE_INTEGRATION_KEYS.umami,
    requireClientId: true,
    requireClientSecret: false,
    defaultClientSecret: DEFAULT_UMAMI_SCRIPT_URL,
    envClientId: "UMAMI_WEBSITE_ID",
    envClientSecret: "UMAMI_SCRIPT_URL",
    missingClientIdError: "errors.integrations_umami_website_id_required",
    missingClientSecretError: "errors.integrations_umami_script_required",
  },
  [SITE_INTEGRATION_KEYS.sentry]: {
    key: SITE_INTEGRATION_KEYS.sentry,
    requireClientId: false,
    requireClientSecret: true,
    envClientId: "SENTRY_ENVIRONMENT",
    envClientSecret: "SENTRY_DSN",
    missingClientIdError: "errors.integrations_sentry_environment_required",
    missingClientSecretError: "errors.integrations_sentry_dsn_required",
  },
  [SITE_INTEGRATION_KEYS.turnstile]: {
    key: SITE_INTEGRATION_KEYS.turnstile,
    requireClientId: true,
    requireClientSecret: true,
    envClientId: "TURNSTILE_SITE_KEY",
    envClientSecret: "TURNSTILE_SECRET_KEY",
    missingClientIdError: "errors.integrations_turnstile_site_key_required",
    missingClientSecretError: "errors.integrations_turnstile_secret_key_required",
  },
  [SITE_INTEGRATION_KEYS.stripe]: {
    key: SITE_INTEGRATION_KEYS.stripe,
    requireClientId: true,
    requireClientSecret: true,
    envClientId: "STRIPE_PUBLISHABLE_KEY",
    envClientSecret: "STRIPE_SECRET_KEY",
    missingClientIdError: "errors.integrations_stripe_publishable_required",
    missingClientSecretError: "errors.integrations_stripe_secret_required",
  },
};
