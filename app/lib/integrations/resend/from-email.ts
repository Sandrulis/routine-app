const CONSUMER_MAILBOX_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "protonmail.com",
  "proton.me",
  "mail.ru",
  "yandex.ru",
  "yandex.com",
  "inbox.lv",
  "inbox.eu",
  "mail.lv",
]);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseFromEmail(from: string): string {
  const trimmed = from.trim();
  if (!trimmed) return "";
  const named = trimmed.match(/^(.*)<([^<>]+)>\s*$/);
  return (named?.[2] ?? trimmed).trim();
}

export function isValidEmailAddress(value: string): boolean {
  return EMAIL_RE.test(parseFromEmail(value));
}

export function resendFromValidationError(from: string): string | null {
  const email = parseFromEmail(from);
  if (!email || !EMAIL_RE.test(email)) {
    return "errors.integrations_resend_from_required";
  }
  const domain = email.split("@")[1]?.trim().toLowerCase() ?? "";
  if (CONSUMER_MAILBOX_DOMAINS.has(domain)) {
    return "errors.integrations_resend_from_unverified";
  }
  return null;
}

export function resendReplyToValidationError(replyTo: string): string | null {
  const email = parseFromEmail(replyTo);
  if (!email) return null;
  if (!EMAIL_RE.test(email)) {
    return "errors.integrations_resend_reply_to_invalid";
  }
  return null;
}

export function classifyResendSendError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (
    lower.includes("domain is not verified") ||
    lower.includes("verify your domain") ||
    lower.includes("only send testing emails")
  ) {
    return "errors.integrations_resend_from_unverified";
  }
  if (status === 401 || lower.includes("invalid api key")) {
    return "errors.integrations_resend_api_key_required";
  }
  return "errors.integrations_resend_send_failed";
}
