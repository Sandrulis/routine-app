import { logError } from "@/app/lib/security/log-error";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import {
  classifyResendSendError,
  parseFromEmail,
  resendFromValidationError,
} from "@/app/lib/integrations/resend/from-email";
import { getPublicSignInMethods } from "@/app/lib/integrations/public-sign-in";
import {
  getSimpleIntegrationCredentials,
  isSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";

export async function isResendEnabled() {
  return isSimpleIntegrationEnabled(SITE_INTEGRATION_KEYS.resend);
}

export async function isEmailPasswordAuthEnabled() {
  const published = await getPublicSignInMethods();
  if (published) return published.email;
  return (await getResendCredentials()) !== null;
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
    replyToEmail: credentials.replyToEmail,
  };
}

function formatResendFrom(from: string, displayName?: string): string {
  const trimmed = from.trim();
  if (!trimmed) return trimmed;

  const named = trimmed.match(/^(.*)<([^<>]+)>\s*$/);
  const email = parseFromEmail(trimmed);
  const existingName = named?.[1]?.trim().replace(/^["']|["']$/g, "") ?? "";
  const label = existingName || displayName?.trim().replace(/[<>"]/g, "") || "";
  if (!label || !email.includes("@")) return trimmed;
  return `${label} <${email}>`;
}

export async function sendResendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
}) {
  const credentials = await getResendCredentials();
  if (!credentials) {
    return { ok: false as const, error: "errors.integrations_resend_not_enabled" };
  }

  const fromError = resendFromValidationError(credentials.fromEmail);
  if (fromError) {
    return { ok: false as const, error: fromError };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credentials.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: formatResendFrom(credentials.fromEmail, input.fromName),
        to: input.to,
        ...(credentials.replyToEmail
          ? { reply_to: credentials.replyToEmail }
          : {}),
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      logError("Resend send failed", `${response.status} ${body}`);
      return {
        ok: false as const,
        error: classifyResendSendError(response.status, body),
      };
    }

    return { ok: true as const };
  } catch (error) {
    logError(
      "Resend send failed",
      error instanceof Error ? error.message : "network error",
    );
    return { ok: false as const, error: "errors.integrations_resend_send_failed" };
  }
}
