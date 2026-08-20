"use server";

import { createClient } from "@/app/lib/supabase/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { getClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { logError } from "@/app/lib/security/log-error";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthResult =
  | { ok: true; next: string; needsEmail?: boolean; needsMfa?: boolean }
  | { ok: false; error: string };

function siteOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      return configured.replace(/\/$/, "");
    }
  }
  return "http://localhost:3120";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function guardAuth(kind: string, email: string): Promise<AuthResult | null> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  const ip = await getClientIp();
  const ipLimit = consumeRateLimit(`auth-ip:${kind}:${ip}`, 20, 15 * 60 * 1000);
  const emailLimit = consumeRateLimit(
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
  const email = normalizeEmail(input.email);
  const password = input.password;
  if (!EMAIL_RE.test(email) || password.length < 1) {
    return { ok: false, error: "errors.auth_invalid" };
  }
  const blocked = await guardAuth("login", email);
  if (blocked) return blocked;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    logError("signInWithPassword failed", error.message);
    return { ok: false, error: "errors.auth_invalid" };
  }
  await ensureCurrentUserProfile(supabase);
  const gate = await getMfaGate(supabase);
  return {
    ok: true,
    next: getSafeRedirectPath(input.next),
    needsMfa: gate === "verify",
  };
}

export async function signUpWithPasswordAction(input: {
  name: string;
  email: string;
  password: string;
  next?: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const name = input.name.trim();
  if (!EMAIL_RE.test(email) || !name) {
    return { ok: false, error: "errors.auth_invalid" };
  }
  if (password.length < 8) {
    return { ok: false, error: "auth.signup.password_short" };
  }
  const blocked = await guardAuth("signup", email);
  if (blocked) return blocked;

  const supabase = await createClient();
  const origin = siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, full_name: name },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(getSafeRedirectPath(input.next))}`,
    },
  });
  if (error) {
    logError("signUp failed", error.message);
    return { ok: false, error: "errors.auth_signup_failed" };
  }
  if (data.session) {
    await ensureCurrentUserProfile(supabase);
    return { ok: true, next: getSafeRedirectPath(input.next) };
  }
  return { ok: true, next: "/login", needsEmail: true };
}

export async function requestPasswordResetAction(input: {
  email: string;
}): Promise<AuthResult> {
  const email = normalizeEmail(input.email);
  if (!EMAIL_RE.test(email)) {
    return { ok: true, next: "/login" };
  }
  const blocked = await guardAuth("reset", email);
  if (blocked) return blocked;

  const supabase = await createClient();
  const origin = siteOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/update-password")}`,
  });
  if (error) {
    logError("resetPasswordForEmail failed", error.message);
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
  const limited = consumeRateLimit(`auth-password:${ip}`, 10, 15 * 60 * 1000);
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
    return { ok: false, error: "errors.auth_signup_failed" };
  }
  return { ok: true, next: "/dashboard" };
}
