import Stripe from "stripe";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import {
  getSimpleIntegrationCredentials,
  isSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";
import {
  looksLikeStripePublishableKey,
  looksLikeStripeSecretKey,
} from "@/app/lib/integrations/stripe/keys";

export type StripeCredentials = {
  publishableKey: string;
  secretKey: string;
  webhookSecret: string;
};

export {
  looksLikeStripePublishableKey,
  looksLikeStripeSecretKey,
} from "@/app/lib/integrations/stripe/keys";

export async function isStripeEnabled() {
  return isSimpleIntegrationEnabled(SITE_INTEGRATION_KEYS.stripe);
}

export async function getStripeCredentials(): Promise<StripeCredentials | null> {
  const enabled = await isStripeEnabled();
  if (!enabled) return null;
  const credentials = await getSimpleIntegrationCredentials(
    SITE_INTEGRATION_KEYS.stripe,
  );
  if (!credentials?.clientId || !credentials.clientSecret || !credentials.replyToEmail) {
    return null;
  }
  if (
    !looksLikeStripePublishableKey(credentials.clientId) ||
    !looksLikeStripeSecretKey(credentials.clientSecret)
  ) {
    return null;
  }
  return {
    publishableKey: credentials.clientId,
    secretKey: credentials.clientSecret,
    webhookSecret: credentials.replyToEmail,
  };
}

export async function hasInvalidStripeCredentials() {
  if (!(await isStripeEnabled())) return false;
  return !(await getStripeCredentials());
}

export async function stripeUnavailableError() {
  if (!(await isStripeEnabled())) {
    return "errors.integrations_stripe_not_enabled";
  }
  if (!(await getStripeCredentials())) {
    return "errors.integrations_stripe_invalid_key";
  }
  return "errors.integrations_stripe_not_enabled";
}

export async function getStripeClient(): Promise<Stripe | null> {
  const credentials = await getStripeCredentials();
  if (!credentials) return null;
  return new Stripe(credentials.secretKey);
}
