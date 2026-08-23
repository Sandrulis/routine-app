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

export type ResendAttachment = {
  filename: string;
  /** Base64-encoded file contents (Resend API). */
  content: string;
  contentType?: string;
};

export async function sendResendEmail(input: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  /**
   * Override Reply-To. Pass a string to force it; pass `null` to omit Reply-To;
   * omit / `undefined` to use the integration default Reply-To (if set).
   */
  replyTo?: string | null;
  attachments?: ResendAttachment[];
  /** Resend tags (e.g. activity_id) for webhook correlation. */
  tags?: Record<string, string>;
}): Promise<
  | { ok: true; id?: string }
  | { ok: false; error: string }
> {
  const credentials = await getResendCredentials();
  if (!credentials) {
    return { ok: false as const, error: "errors.integrations_resend_not_enabled" };
  }

  const fromError = resendFromValidationError(credentials.fromEmail);
  if (fromError) {
    return { ok: false as const, error: fromError };
  }

  const replyTo =
    input.replyTo === undefined
      ? credentials.replyToEmail
      : input.replyTo?.trim() || undefined;

  const tags = input.tags
    ? Object.entries(input.tags)
        .filter(([name, value]) => name.trim() && value.trim())
        .map(([name, value]) => ({ name: name.trim(), value: value.trim() }))
    : [];

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
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: input.subject,
        html: input.html,
        text: input.text,
        ...(tags.length > 0 ? { tags } : {}),
        ...(input.attachments && input.attachments.length > 0
          ? {
              attachments: input.attachments.map((item) => ({
                filename: item.filename,
                content: item.content,
                ...(item.contentType ? { content_type: item.contentType } : {}),
              })),
            }
          : {}),
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

    const payload = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;
    return {
      ok: true as const,
      id: typeof payload?.id === "string" ? payload.id : undefined,
    };
  } catch (error) {
    logError(
      "Resend send failed",
      error instanceof Error ? error.message : "network error",
    );
    return { ok: false as const, error: "errors.integrations_resend_send_failed" };
  }
}
