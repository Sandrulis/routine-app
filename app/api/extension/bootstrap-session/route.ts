import { getExtensionAuth } from "@/app/lib/extension/auth";
import { accessTokenAal, userHasVerifiedTotp } from "@/app/lib/auth/mfa";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { sessionFromRequestCookies } from "@/app/lib/extension/session-from-cookies";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

/** Same-origin bootstrap after OAuth done page — content script reads cookie session. */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return extensionJson(
      request,
      { ok: false, error: "errors.db_not_configured" },
      { status: 503 },
    );
  }

  const limited = await consumeRateLimit(
    `ext-bootstrap:${requestClientIp(request)}`,
    40,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_rate_limited" },
      { status: 429 },
    );
  }

  const auth = await getExtensionAuth(request);
  if (!auth) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_required" },
      { status: 401 },
    );
  }

  const {
    data: { session },
  } = await auth.supabase.auth.getSession();

  let accessToken = session?.access_token || "";
  let refreshToken = session?.refresh_token || "";
  let expiresAt = session?.expires_at;
  let expiresIn = session?.expires_in;

  if (!refreshToken) {
    const fromCookies = await sessionFromRequestCookies();
    if (fromCookies?.access_token) {
      accessToken = accessToken || fromCookies.access_token;
      refreshToken = fromCookies.refresh_token || refreshToken;
      expiresAt = expiresAt ?? fromCookies.expires_at;
      expiresIn = expiresIn ?? fromCookies.expires_in;
    }
  }

  if (!accessToken) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_required" },
      { status: 401 },
    );
  }

  if (
    userHasVerifiedTotp(auth.user.factors) &&
    accessTokenAal(accessToken) !== "aal2"
  ) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_login_mfa", needsMfa: true },
      { status: 401 },
    );
  }

  return extensionJson(request, {
    ok: true,
    authCookieName: supabaseAuthCookieName(),
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_at: expiresAt,
      expires_in: expiresIn,
      token_type: session?.token_type,
    },
  });
}
