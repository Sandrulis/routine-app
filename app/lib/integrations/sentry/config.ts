import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import {
  getSimpleIntegrationCredentials,
  isSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";

export type SentryPublicConfig = {
  dsn: string;
  environment: string;
};

export async function getSentryPublicConfig(): Promise<SentryPublicConfig | null> {
  if (!(await isSimpleIntegrationEnabled(SITE_INTEGRATION_KEYS.sentry))) {
    return null;
  }
  const credentials = await getSimpleIntegrationCredentials(
    SITE_INTEGRATION_KEYS.sentry,
  );
  const dsn = credentials?.clientSecret?.trim() ?? "";
  if (!dsn) return null;
  return {
    dsn,
    environment: credentials?.clientId?.trim() || "production",
  };
}
