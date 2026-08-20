import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import { DEFAULT_UMAMI_SCRIPT_URL } from "@/app/lib/integrations/simple/definitions";
import {
  getSimpleIntegrationCredentials,
  isSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";

export type UmamiPublicConfig = {
  websiteId: string;
  scriptSrc: string;
  integrity?: string;
};

export async function getUmamiPublicConfig(): Promise<UmamiPublicConfig | null> {
  if (!(await isSimpleIntegrationEnabled(SITE_INTEGRATION_KEYS.umami))) {
    return null;
  }
  const credentials = await getSimpleIntegrationCredentials(
    SITE_INTEGRATION_KEYS.umami,
  );
  const websiteId = credentials?.clientId?.trim() ?? "";
  if (!websiteId) return null;
  const scriptSrc =
    credentials?.clientSecret?.trim() || DEFAULT_UMAMI_SCRIPT_URL;
  const integrity =
    process.env.UMAMI_SCRIPT_INTEGRITY?.trim() ||
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_INTEGRITY?.trim() ||
    "";
  return { websiteId, scriptSrc, integrity: integrity || undefined };
}
