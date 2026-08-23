import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return extensionJson(
      request,
      { ok: false, error: "errors.db_not_configured" },
      { status: 503 },
    );
  }

  const limited = consumeRateLimit(
    `ext-refresh:${requestClientIp(request)}`,
    60,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_rate_limited" },
      { status: 429 },
    );
  }

  let body: { refresh_token?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_invalid_body" },
      { status: 400 },
    );
  }

  const refreshToken = String(body.refresh_token || "").trim();
  if (!refreshToken) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_auth_required" },
      { status: 401 },
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

  const response = await fetch(`${env.url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${env.anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
    error?: string;
  } | null;

  if (!response.ok || !data?.access_token) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_auth_required" },
      { status: 401 },
    );
  }

  const expiresIn = Number(data.expires_in) || 3600;
  const expiresAt =
    Number(data.expires_at) || Math.floor(Date.now() / 1000) + expiresIn;

  return extensionJson(request, {
    ok: true,
    authCookieName: supabaseAuthCookieName(),
    session: {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: expiresAt,
      expires_in: expiresIn,
      token_type: data.token_type || "bearer",
    },
  });
}
