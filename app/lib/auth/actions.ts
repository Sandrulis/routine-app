"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getClientIp } from "@/app/lib/security/client-ip";
import {
  consumeRateLimit,
  readAuthLockout,
  recordAuthFailure,
  clearAuthFailures,
} from "@/app/lib/security/rate-limit";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { logError } from "@/app/lib/security/log-error";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import {
  registerWithEmailPassword,
  requestPasswordResetEmail,
} from "@/app/lib/auth/email-password";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthResult =
  | { ok: true; next: string; needsEmail?: boolean; needsMfa?: boolean }
  | { ok: false; error: string };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function requireEmailPasswordAuth(): Promise<AuthResult | null> {
  if (await isEmailPasswordAuthEnabled()) return null;
  return { ok: false, error: "errors.auth_email_disabled" };
}

async function guardAuth(kind: string, email: string): Promise<AuthResult | null> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  const ip = await getClientIp();
  const ipLimit = await consumeRateLimit(`auth-ip:${kind}:${ip}`, 20, 15 * 60 * 1000);
  const emailLimit = await consumeRateLimit(
    `auth-email:${kind}:${email}`,
    8,
    15 * 60 * 1000,
  );
  if (!ipLimit.ok || !emailLimit.ok) {
    return { ok: false, error: "errors.auth_rate_limited" };
  }
  return null;
}

export async function signInWithPasswordAction(input: {
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const emailAuth = await requireEmailPasswordAuth();
  if (emailAuth) return emailAuth;
  const email = normalizeEmail(input.email);
  const password = input.password;
  if (!EMAIL_RE.test(email) || password.length < 1) {
    return { ok: false, error: "errors.auth_invalid" };
  }
  const blocked = await guardAuth("login", email);
  if (blocked) return blocked;

  const lockout = await readAuthLockout(email);
  if (!lockout.ok) {
    return { ok: false, error: "errors.auth_locked" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logError("signInWithPassword failed", error.message);
    await recordAuthFailure(email);
    return { ok: false, error: "errors.auth_invalid" };
  }
  await clearAuthFailures(email);
  await ensureCurrentUserProfile(supabase);
  const gate = await getMfaGate(supabase);
  return {
    ok: true,
    next: getSafeRedirectPath(input.next),
    needsMfa: gate === "verify",
  };
}

export async function signUpWithPasswordAction(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  next?: string;
  inviteToken?: string;
}): Promise<AuthResult> {
  const emailAuth = await requireEmailPasswordAuth();
  if (emailAuth) return emailAuth;
  const email = normalizeEmail(input.email);
  const password = input.password;
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  if (!EMAIL_RE.test(email) || !firstName || !lastName) {
    return { ok: false, error: "errors.auth_invalid" };
  }
  if (password.length < 8) {
    return { ok: false, error: "auth.signup.password_short" };
  }
  const blocked = await guardAuth("signup", email);
  if (blocked) return blocked;

  let next = input.next;
  const inviteToken = input.inviteToken?.trim();
  if (inviteToken) {
    const { getInviteSignupContextAction } = await import(
      "@/app/lib/team/actions"
    );
    const invite = await getInviteSignupContextAction(inviteToken);
    if (!invite.ok) {
      return { ok: false, error: invite.error };
    }
    if (invite.data.email !== email) {
      return { ok: false, error: "errors.team_invite_email_mismatch" };
    }
    next = invite.data.nextPath;
  }

  const result = await registerWithEmailPassword({
    firstName,
    lastName,
    email,
    password,
    next,
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  return { ok: true, next: "/login", needsEmail: true };
}

export async function requestPasswordResetAction(input: {
  email: string;
}): Promise<AuthResult> {
  const emailAuth = await requireEmailPasswordAuth();
  if (emailAuth) return emailAuth;
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email)) {
    return { ok: true, next: "/login" };
  }
  const blocked = await guardAuth("reset", email);
  if (blocked) return blocked;

  const result = await requestPasswordResetEmail(email);
  if (!result.ok) {
    logError("requestPasswordResetEmail failed", result.error);
  }
  return { ok: true, next: "/login" };
}

export async function updatePasswordAction(input: {
  password: string;
}): Promise<AuthResult> {
  if (input.password.length < 8) {
    return { ok: false, error: "auth.signup.password_short" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  const ip = await getClientIp();
  const limited = await consumeRateLimit(`auth-password:${ip}`, 10, 15 * 60 * 1000);
  if (!limited.ok) {
    return { ok: false, error: "errors.auth_rate_limited" };
  }
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: input.password });
  if (error) {
    logError("updatePassword failed", error.message);
    const message = error.message.toLowerCase();
    if (
      message.includes("same password") ||
      message.includes("should be different") ||
      message.includes("different from the old")
    ) {
      return { ok: false, error: "user_menu.password.same" };
    }
    return { ok: false, error: "errors.auth_password_update_failed" };
  }
  return { ok: true, next: "/dashboard" };
}
