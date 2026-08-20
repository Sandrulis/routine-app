import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import {
  getSimpleIntegrationCredentials,
  isSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";

export async function isResendEnabled() {
  return isSimpleIntegrationEnabled(SITE_INTEGRATION_KEYS.resend);
}

export async function getResendCredentials() {
  const enabled = await isResendEnabled();
  if (!enabled) return null;
  const credentials = await getSimpleIntegrationCredentials(
    SITE_INTEGRATION_KEYS.resend,
  );
  if (!credentials?.clientId || !credentials.clientSecret) return null;
  return {
    fromEmail: credentials.clientId,
    apiKey: credentials.clientSecret,
  };
}

export async function sendResendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const credentials = await getResendCredentials();
  if (!credentials) {
    return { ok: false as const, error: "errors.integrations_resend_not_enabled" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: credentials.fromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    console.error("Resend send failed:", response.status, body);
    return { ok: false as const, error: "errors.integrations_resend_send_failed" };
  }

  return { ok: true as const };
}
