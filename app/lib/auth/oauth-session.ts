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
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export type OAuthSignInProfile = {
  email: string;
  name: string;
  avatarUrl: string;
  provider: "google" | "microsoft";
};

function parseCookieHeader(header: string | null) {
  if (!header) return [];

  return header.split(";").flatMap((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf("=");
    if (separator < 0) return [];

    const rawName = trimmed.slice(0, separator);
    const rawValue = trimmed.slice(separator + 1);
    try {
      return [
        {
          name: decodeURIComponent(rawName),
          value: decodeURIComponent(rawValue),
        },
      ];
    } catch {
      return [{ name: rawName, value: rawValue }];
    }
  });
}

function isExistingUserError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already") ||
    normalized.includes("registered") ||
    normalized.includes("exists")
  );
}

function oauthProviderMatches(
  user: {
    app_metadata?: { provider?: unknown; providers?: unknown };
  },
  provider: "google" | "microsoft",
) {
  const metadata = user.app_metadata ?? {};
  const stored = String(metadata.provider ?? "").trim().toLowerCase();
  const providers = Array.isArray(metadata.providers)
    ? metadata.providers.map((item) => String(item).trim().toLowerCase())
    : [];
  return stored === provider || (providers.length === 1 && providers[0] === provider);
}

async function findOrCreateOAuthUser(profile: OAuthSignInProfile) {
  const admin = createAdminClient();
  const email = profile.email.trim().toLowerCase();
  const metadata = {
    name: profile.name,
    full_name: profile.name,
    avatar_url: profile.avatarUrl,
    picture: profile.avatarUrl,
    provider: profile.provider,
  };

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
    return { ok: true as const, userId: created.data.user.id };
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

  if (!oauthProviderMatches(data.user, profile.provider)) {
    return { ok: false as const, reason: "account_exists" as const };
  }

  await admin.auth.admin.updateUserById(data.user.id, {
    user_metadata: metadata,
  });

  return { ok: true as const, userId: data.user.id };
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

  const prepared = await findOrCreateOAuthUser({
    ...input.profile,
    email,
    name: input.profile.name.trim() || email.split("@")[0] || email,
  });
  if (!prepared.ok) {
    if (prepared.reason === "account_exists") {
      return oauthSignInErrorRedirect(
        input.origin,
        input.errorPage,
        input.profile.provider,
        "account_exists",
      );
    }
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

  return redirectResponse;
}
