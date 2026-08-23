import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import { getResendCredentials } from "@/app/lib/integrations/resend/client";
import { sendTeamInviteNotice } from "@/app/lib/email/send-auth-emails";
import { findAuthUserByEmailExact } from "@/app/lib/auth/find-auth-user-by-email";
import { logError } from "@/app/lib/security/log-error";

export function teamInviteRedirectUrl(token: string): string {
  return `${getPublicSiteUrl()}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`;
}

export function teamInvitePublicUrl(token: string): string {
  return `${getPublicSiteUrl()}/invite/${token}`;
}

function isRateLimitError(message: string): boolean {
  return message.toLowerCase().includes("rate limit");
}

function isExistingAuthUserError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists")
  );
}

export async function resolveAuthUserIdByEmail(
  _admin: unknown,
  email: string,
): Promise<string | null> {
  const found = await findAuthUserByEmailExact(email);
  return found?.id ?? null;
}

async function sendSupabaseInviteFallback(
  email: string,
  token: string,
): Promise<
  { ok: true; emailSent: true } | { ok: true; emailSent: false } | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.team_invite_email_not_configured" };
  }

  const admin = createAdminClient();
  const redirectTo = teamInviteRedirectUrl(token);

  const inviteResult = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invitation_token: token,
    },
  });

  if (!inviteResult.error) {
    return { ok: true, emailSent: true };
  }

  if (
    !isExistingAuthUserError(inviteResult.error.message) &&
    !isRateLimitError(inviteResult.error.message)
  ) {
    logError("inviteUserByEmail failed", inviteResult.error.message);
    return { ok: false, error: "errors.team_invite_email_failed" };
  }

  const otpResult = await admin.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: false,
    },
  });

  if (!otpResult.error) {
    return { ok: true, emailSent: true };
  }

  if (isRateLimitError(inviteResult.error.message) || isRateLimitError(otpResult.error.message)) {
    return { ok: true, emailSent: false };
  }

  logError("signInWithOtp failed", otpResult.error.message);
  return { ok: false, error: "errors.team_invite_email_failed" };
}

export async function sendTeamInviteEmail(input: {
  email: string;
  token: string;
  teamName: string;
  inviterName: string;
  recipientName?: string;
  languageCode?: string | null;
}): Promise<
  { ok: true; emailSent: true } | { ok: true; emailSent: false } | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  const inviteLink = teamInvitePublicUrl(input.token);

  if (await getResendCredentials()) {
    const sent = await sendTeamInviteNotice({
      email,
      inviteLink,
      teamName: input.teamName,
      inviterName: input.inviterName,
      name: input.recipientName,
      languageCode: input.languageCode,
    });
    if (!sent.ok) {
      return { ok: false, error: sent.error };
    }
    return { ok: true, emailSent: true };
  }

  return sendSupabaseInviteFallback(email, input.token);
}
