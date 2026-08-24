import { getExtensionAuth } from "@/app/lib/extension/auth";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
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
    error,
  } = await auth.supabase.auth.getSession();
  if (error || !session?.access_token) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_required" },
      { status: 401 },
    );
  }

  return extensionJson(request, {
    ok: true,
    authCookieName: supabaseAuthCookieName(),
    session: {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
    },
  });
}
