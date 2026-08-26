import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import {
  parseRememberSession,
  REMEMBER_SESSION_COOKIE,
  toResponseCookieOptions,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import type { OAuthLoginErrorPage } from "@/app/lib/auth/oauth-login-state";
import { GMAIL_PLUGIN_DONE_PATH } from "@/app/lib/extension/gmail-oauth";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  getSupabasePublicEnv,
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";
import { parseCookieHeader } from "@/app/lib/http/parse-cookie-header";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";
import { findAuthUserByEmailExact } from "@/app/lib/auth/find-auth-user-by-email";
import { userHasTeam } from "@/app/lib/auth/user-has-team";
import { requireTurnstileToken } from "@/app/lib/security/turnstile";
import { requestClientIp } from "@/app/lib/security/client-ip";
import {
  OAUTH_PENDING_SIGNIN_COOKIE,
  OAUTH_TURNSTILE_TOKEN_COOKIE,
  oauthTurnstileCookieOptions,
  serializePendingOAuthSignIn,
} from "@/app/lib/auth/oauth-turnstile";
import {
  joinDisplayName,
  splitDisplayName,
} from "@/app/lib/users/display-name";

export type OAuthSignInProfile = {
  email: string;
  name: string;
  givenName?: string;
  familyName?: string;
  avatarUrl: string;
  provider: "google" | "microsoft";
};

function resolveOAuthPersonalNames(profile: OAuthSignInProfile) {
  let givenName = profile.givenName?.trim() ?? "";
  let familyName = profile.familyName?.trim() ?? "";
  if (!givenName && !familyName) {
    const split = splitDisplayName(profile.name);
    givenName = split.firstName;
    familyName = split.lastName;
  }
  const fullName =
    joinDisplayName(givenName, familyName) ||
    profile.name.trim() ||
    profile.email.trim().split("@")[0] ||
    profile.email.trim();
  return { givenName, familyName, fullName };
}

function buildOAuthUserMetadata(
  profile: OAuthSignInProfile,
  existing?: Record<string, unknown> | null,
) {
  const resolved = resolveOAuthPersonalNames(profile);
  const existingGiven =
    typeof existing?.given_name === "string" ? existing.given_name.trim() : "";
  const existingFamily =
    typeof existing?.family_name === "string" ? existing.family_name.trim() : "";
  const existingName =
    typeof existing?.name === "string"
      ? existing.name.trim()
      : typeof existing?.full_name === "string"
        ? existing.full_name.trim()
        : "";
  const avatarUrl =
    profile.avatarUrl.trim() ||
    (typeof existing?.avatar_url === "string" ? existing.avatar_url.trim() : "") ||
    (typeof existing?.picture === "string" ? existing.picture.trim() : "");

  const next: Record<string, unknown> = {
    ...(existing ?? {}),
    avatar_url: avatarUrl,
    picture: avatarUrl,
    provider: profile.provider,
  };

  if (!existingGiven && !existingFamily) {
    const split = existingName
      ? splitDisplayName(existingName)
      : { firstName: resolved.givenName, lastName: resolved.familyName };
    next.given_name = split.firstName || resolved.givenName;
    next.family_name = split.lastName || resolved.familyName;
  }

  if (!existingName) {
    next.name = resolved.fullName;
    next.full_name = resolved.fullName;
  }

  return next;
}

function isExistingUserError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists")
  );
}

function listAuthProviders(user: {
  app_metadata?: { provider?: unknown; providers?: unknown } | null;
}): string[] {
  const metadata = user.app_metadata ?? {};
  const providers = Array.isArray(metadata.providers)
    ? metadata.providers
        .map((item) => String(item).trim().toLowerCase())
        .filter(Boolean)
    : [];
  const stored = String(metadata.provider ?? "").trim().toLowerCase();
  if (stored && !providers.includes(stored)) {
    providers.push(stored);
  }
  return providers;
}

function mergeOAuthAppMetadata(
  user: {
    app_metadata?: Record<string, unknown> | null;
  },
  provider: "google" | "microsoft",
) {
  const existing = { ...(user.app_metadata ?? {}) };
  const providers = new Set(listAuthProviders(user));
  providers.add(provider);
  // Keep the original primary when present; always record this OAuth method.
  const primary = String(existing.provider ?? "").trim().toLowerCase();
  return {
    ...existing,
    provider: primary || provider,
    providers: Array.from(providers),
  };
}

async function findOrCreateOAuthUser(profile: OAuthSignInProfile) {
  const admin = createAdminClient();
  const email = profile.email.trim().toLowerCase();
  const metadata = buildOAuthUserMetadata(profile);

  const created = await admin.auth.admin.createUser({
    email,
    password: randomBytes(24).toString("base64url"),
    email_confirm: true,
    user_metadata: metadata,
    app_metadata: {
      provider: profile.provider,
      providers: [profile.provider],
    },
  });

  if (created.data.user) {
    // createUser with a password can mark the identity as email — keep OAuth
    // provider metadata explicit for later sign-ins.
    await admin.auth.admin.updateUserById(created.data.user.id, {
      app_metadata: {
        provider: profile.provider,
        providers: [profile.provider],
      },
    });
    return {
      ok: true as const,
      userId: created.data.user.id,
      fullName: resolveOAuthPersonalNames(profile).fullName,
    };
  }

  if (!created.error || !isExistingUserError(created.error.message)) {
    logError("createUser for OAuth failed", created.error?.message);
    return { ok: false as const, reason: "failed" as const };
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error || !data.user) {
    logError("generateLink for existing OAuth user failed", error?.message);
    return { ok: false as const, reason: "failed" as const };
  }

  // Google/Microsoft already verified email ownership — allow sign-in into an
  // existing password (or other) account with the same email, and link methods.
  const merged = buildOAuthUserMetadata(
    profile,
    (data.user.user_metadata ?? null) as Record<string, unknown> | null,
  );
  await admin.auth.admin.updateUserById(data.user.id, {
    user_metadata: merged,
    app_metadata: mergeOAuthAppMetadata(
      {
        app_metadata: (data.user.app_metadata ?? null) as Record<
          string,
          unknown
        > | null,
      },
      profile.provider,
    ),
  });

  return {
    ok: true as const,
    userId: data.user.id,
    fullName:
      (typeof merged.name === "string" && merged.name.trim()) ||
      resolveOAuthPersonalNames(profile).fullName,
  };
}

export function oauthSignInErrorRedirect(
  origin: string,
  errorPage: OAuthLoginErrorPage,
  provider: "google" | "microsoft",
  errorCode?: string,
) {
  const code = errorCode || provider;
  if (errorPage === "plugin") {
    const url = new URL(GMAIL_PLUGIN_DONE_PATH, origin);
    url.searchParams.set("login", "1");
    url.searchParams.set("error", code);
    return NextResponse.redirect(url);
  }
  const url = new URL(`/${errorPage}`, origin);
  url.searchParams.set("error", code);
  return NextResponse.redirect(url);
}

export async function completeOAuthSignIn(
  request: Request,
  input: {
    origin: string;
    next: string;
    errorPage: OAuthLoginErrorPage;
    profile: OAuthSignInProfile;
    turnstileToken?: string;
    /** Token already verified once (Turnstile tokens are single-use). */
    turnstileAlreadyVerified?: boolean;
    allowPendingRedirect?: boolean;
  },
) {
  const email = input.profile.email.trim().toLowerCase();
  const fail = () =>
    oauthSignInErrorRedirect(input.origin, input.errorPage, input.profile.provider);

  if (!email || !isSupabaseConfigured() || !isSupabaseAdminConfigured()) {
    return fail();
  }

  const env = getSupabasePublicEnv();
  if (!env) return fail();

  const needsGoogleTurnstile =
    input.profile.provider === "google" &&
    input.errorPage !== "plugin" &&
    !input.turnstileAlreadyVerified;
  if (needsGoogleTurnstile) {
    const existing = await findAuthUserByEmailExact(email);
    const hasTeam = existing ? await userHasTeam(existing.id) : false;
    if (!hasTeam) {
      const turnstile = await requireTurnstileToken(
        input.turnstileToken,
        requestClientIp(request),
      );
      if (!turnstile.ok) {
        if (input.allowPendingRedirect === false) {
          return oauthSignInErrorRedirect(
            input.origin,
            input.errorPage === "plugin" ? "login" : input.errorPage,
            "google",
            "turnstile",
          );
        }
        const pending = serializePendingOAuthSignIn({
          profile: { ...input.profile, email },
          next: input.next,
          errorPage: input.errorPage,
        });
        if (!pending) {
          return oauthSignInErrorRedirect(
            input.origin,
            input.errorPage === "plugin" ? "login" : input.errorPage,
            "google",
            "turnstile",
          );
        }
        const path = input.errorPage === "signup" ? "/signup" : "/login";
        const redirect = NextResponse.redirect(
          new URL(`${path}?pending=google`, input.origin),
        );
        redirect.cookies.set(
          OAUTH_PENDING_SIGNIN_COOKIE,
          pending,
          oauthTurnstileCookieOptions(600),
        );
        redirect.cookies.set(OAUTH_TURNSTILE_TOKEN_COOKIE, "", {
          ...oauthTurnstileCookieOptions(0),
          maxAge: 0,
        });
        return redirect;
      }
    }
  }

  const resolvedNames = resolveOAuthPersonalNames({
    ...input.profile,
    email,
  });
  const prepared = await findOrCreateOAuthUser({
    ...input.profile,
    email,
    name: resolvedNames.fullName,
    givenName: resolvedNames.givenName,
    familyName: resolvedNames.familyName,
  });
  if (!prepared.ok) {
    return fail();
  }

  const admin = createAdminClient();
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const hashedToken = linkData?.properties?.hashed_token?.trim() ?? "";
  if (linkError || !hashedToken) {
    logError("OAuth generateLink failed", linkError?.message);
    return fail();
  }

  const requestCookies = parseCookieHeader(request.headers.get("cookie"));
  const remember = parseRememberSession(
    requestCookies.find((cookie) => cookie.name === REMEMBER_SESSION_COOKIE)
      ?.value,
  );
  const redirectResponse = NextResponse.redirect(`${input.origin}${input.next}`);
  const cookieStore = await cookies();

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return requestCookies;
      },
      setAll(cookiesToSet, headers) {
        withAuthCookieOptions(cookiesToSet, remember).forEach(
          ({ name, value, options }) => {
            redirectResponse.cookies.set(
              name,
              value,
              toResponseCookieOptions(options),
            );
            try {
              cookieStore.set(name, value, toResponseCookieOptions(options));
            } catch {
              // Redirect response still carries Set-Cookie.
            }
          },
        );
        Object.entries(headers).forEach(([key, value]) =>
          redirectResponse.headers.set(key, value),
        );
      },
    },
  });

  const { error: verifyError } = await supabase.auth.verifyOtp({
    type: "magiclink",
    token_hash: hashedToken,
  });

  if (verifyError) {
    console.error("OAuth verifyOtp failed:", verifyError.message);
    return fail();
  }

  await ensureCurrentUserProfile(
    supabase as unknown as Parameters<typeof ensureCurrentUserProfile>[0],
  );

  try {
    const { data: profileRow } = await admin
      .from("users")
      .select("name")
      .eq("id", prepared.userId)
      .maybeSingle();
    const currentName = String(profileRow?.name ?? "").trim();
    const emailLocal = email.split("@")[0] || email;
    if (
      !currentName ||
      currentName.toLowerCase() === email.toLowerCase() ||
      currentName.toLowerCase() === emailLocal.toLowerCase()
    ) {
      await admin
        .from("users")
        .update({ name: prepared.fullName })
        .eq("id", prepared.userId);
    }
  } catch (error) {
    logError(
      "OAuth profile name sync failed",
      error instanceof Error ? error.message : String(error),
    );
  }

  const clearOpts = { ...oauthTurnstileCookieOptions(0), maxAge: 0 };
  redirectResponse.cookies.set(OAUTH_PENDING_SIGNIN_COOKIE, "", clearOpts);
  redirectResponse.cookies.set(OAUTH_TURNSTILE_TOKEN_COOKIE, "", clearOpts);
  try {
    cookieStore.set(OAUTH_PENDING_SIGNIN_COOKIE, "", clearOpts);
    cookieStore.set(OAUTH_TURNSTILE_TOKEN_COOKIE, "", clearOpts);
  } catch {
    // Redirect response still carries Set-Cookie.
  }

  return redirectResponse;
}
