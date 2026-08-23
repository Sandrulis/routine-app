import { createServerClient } from "@supabase/ssr";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import {
  REMEMBER_SESSION_COOKIE,
  toResponseCookieOptions,
  withAuthCookieOptions,
} from "@/app/lib/auth/remember-session";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";
import { isEmailPasswordAuthEnabled } from "@/app/lib/integrations/resend/client";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { logError } from "@/app/lib/security/log-error";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

export async function POST(request: Request) {
  if (!(await isEmailPasswordAuthEnabled())) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_email_disabled" },
      { status: 403 },
    );
  }
  if (!isSupabaseConfigured()) {
    return extensionJson(
      request,
      { ok: false, error: "errors.db_not_configured" },
      { status: 503 },
    );
  }

  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_invalid_body" },
      { status: 400 },
    );
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const remember = body.remember === true;
  if (!EMAIL_RE.test(email) || password.length < 1) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_invalid" },
      { status: 400 },
    );
  }

  const ip = requestClientIp(request);
  const ipLimit = consumeRateLimit(`ext-login-ip:${ip}`, 20, 15 * 60 * 1000);
  const emailLimit = consumeRateLimit(
    `ext-login-email:${email}`,
    8,
    15 * 60 * 1000,
  );
  if (!ipLimit.ok || !emailLimit.ok) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_rate_limited" },
      { status: 429 },
    );
  }

  const env = getSupabasePublicEnv();
  if (!env) {
    return extensionJson(
      request,
      { ok: false, error: "errors.db_not_configured" },
      { status: 503 },
    );
  }

  const pendingCookies: {
    name: string;
    value: string;
    options?: Parameters<typeof toResponseCookieOptions>[0];
  }[] = [];
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return [];
      },
      setAll(cookiesToSet) {
        withAuthCookieOptions(cookiesToSet, remember).forEach((cookie) => {
          pendingCookies.push(cookie);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    logError("extension login failed", error?.message);
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_invalid" },
      { status: 401 },
    );
  }

  await ensureCurrentUserProfile(supabase);
  const gate = await getMfaGate(supabase);
  if (gate === "verify") {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_login_mfa", needsMfa: true },
      { status: 401 },
    );
  }

  const json = extensionJson(request, {
    ok: true,
    authCookieName: supabaseAuthCookieName(),
    remember,
    session: {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_at: data.session.expires_at,
      expires_in: data.session.expires_in,
      token_type: data.session.token_type,
    },
  });

  for (const cookie of pendingCookies) {
    json.cookies.set(
      cookie.name,
      cookie.value,
      toResponseCookieOptions(cookie.options),
    );
  }
  json.cookies.set(REMEMBER_SESSION_COOKIE, remember ? "1" : "0", {
    ...toResponseCookieOptions({ path: "/", sameSite: "lax" }),
    maxAge: remember ? 30 * 24 * 60 * 60 : undefined,
  });
  return json;
}
