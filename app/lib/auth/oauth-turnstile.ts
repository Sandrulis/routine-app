import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
import { decryptSecret, persistSecret } from "@/app/lib/security/secret-box";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import type { OAuthLoginErrorPage } from "@/app/lib/auth/oauth-login-state";

export const OAUTH_TURNSTILE_TOKEN_COOKIE = "routine-app-oauth-turnstile";
export const OAUTH_PENDING_SIGNIN_COOKIE = "routine-app-oauth-signin-pending";

const PENDING_MAX_AGE_MS = 10 * 60 * 1000;

export type PendingOAuthSignIn = {
  email: string;
  name: string;
  givenName: string;
  familyName: string;
  avatarUrl: string;
  provider: "google";
  next: string;
  errorPage: OAuthLoginErrorPage;
  exp: number;
};

export function oauthTurnstileCookieOptions(maxAgeSeconds = 600) {
  return oauthCookieOptions(maxAgeSeconds);
}

export function pendingOAuthRedirectPath(errorPage: OAuthLoginErrorPage) {
  const path = errorPage === "signup" ? "/signup" : "/login";
  return `${path}?pending=google`;
}

export function serializePendingOAuthSignIn(input: {
  profile: {
    email: string;
    name: string;
    givenName?: string;
    familyName?: string;
    avatarUrl: string;
    provider: "google" | "microsoft";
  };
  next: string;
  errorPage: OAuthLoginErrorPage;
}): string | null {
  if (input.profile.provider !== "google") return null;
  const payload: PendingOAuthSignIn = {
    email: input.profile.email.trim().toLowerCase(),
    name: input.profile.name.trim(),
    givenName: input.profile.givenName?.trim() ?? "",
    familyName: input.profile.familyName?.trim() ?? "",
    avatarUrl: input.profile.avatarUrl.trim(),
    provider: "google",
    next: getSafeRedirectPath(input.next),
    errorPage: input.errorPage,
    exp: Date.now() + PENDING_MAX_AGE_MS,
  };
  if (!payload.email) return null;
  return persistSecret(JSON.stringify(payload));
}

export function parsePendingOAuthSignIn(
  raw: string | null | undefined,
): PendingOAuthSignIn | null {
  const json = decryptSecret(raw);
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as Partial<PendingOAuthSignIn>;
    const email = String(parsed.email ?? "").trim().toLowerCase();
    const exp = Number(parsed.exp);
    if (
      !email ||
      parsed.provider !== "google" ||
      !Number.isFinite(exp) ||
      exp < Date.now()
    ) {
      return null;
    }
    const errorPage = parsed.errorPage;
    if (
      errorPage !== "login" &&
      errorPage !== "signup" &&
      errorPage !== "plugin"
    ) {
      return null;
    }
    return {
      email,
      name: String(parsed.name ?? "").trim(),
      givenName: String(parsed.givenName ?? "").trim(),
      familyName: String(parsed.familyName ?? "").trim(),
      avatarUrl: String(parsed.avatarUrl ?? "").trim(),
      provider: "google",
      next: getSafeRedirectPath(parsed.next),
      errorPage,
      exp,
    };
  } catch {
    return null;
  }
}
