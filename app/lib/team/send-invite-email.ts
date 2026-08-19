import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

function siteOrigin(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return configured.replace(/\/$/, "");
    }
  }
  return "http://localhost:3000";
}

export function teamInviteRedirectUrl(token: string): string {
  return `${siteOrigin()}/auth/callback?next=${encodeURIComponent(`/invite/${token}`)}`;
}

export function teamInvitePublicUrl(token: string): string {
  return `${siteOrigin()}/invite/${token}`;
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
  admin: SupabaseClient,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) return null;
  return data.user?.id ?? null;
}

export async function sendTeamInviteEmail(
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
    console.error("inviteUserByEmail failed:", inviteResult.error.message);
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
    console.warn("Team invite email rate limited for", email);
    return { ok: true, emailSent: false };
  }

  console.error("signInWithOtp failed:", otpResult.error.message);
  return { ok: false, error: "errors.team_invite_email_failed" };
}
