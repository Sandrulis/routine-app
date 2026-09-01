import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { parseGmailBridgeTicket } from "@/app/lib/extension/gmail-bridge-ticket";
import { supabaseAuthCookieName } from "@/app/lib/extension/cookie-name";
import {
  accessTokenNeedsTotpChallenge,
  userHasEnrolledTotp,
} from "@/app/lib/auth/mfa";
import { mintIndependentPluginSession } from "@/app/lib/extension/mint-plugin-session";
import { getExtensionAuth } from "@/app/lib/extension/auth";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { getSupabasePublicEnv, isSupabaseConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

async function refreshWithToken(refreshToken: string) {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  const response = await fetch(
    `${env.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${env.anonKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  const data = (await response.json().catch(() => null)) as {
    access_token?: string;
    refresh_token?: string;
    expires_at?: number;
    expires_in?: number;
    token_type?: string;
  } | null;
  if (!response.ok || !data?.access_token) return null;
  const expiresIn = Number(data.expires_in) || 3600;
  const expiresAt =
    Number(data.expires_at) || Math.floor(Date.now() / 1000) + expiresIn;
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: expiresAt,
    expires_in: expiresIn,
    token_type: data.token_type || "bearer",
  };
}

/** Exchange one-time done-page ticket (server-rendered) for extension session. */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return extensionJson(
      request,
      { ok: false, error: "errors.db_not_configured" },
      { status: 503 },
    );
  }

  const limited = await consumeRateLimit(
    `ext-bootstrap-ticket:${requestClientIp(request)}`,
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

  let body: { ticket?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const ticket = parseGmailBridgeTicket(body.ticket);
  if (!ticket) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_auth_required" },
      { status: 401 },
    );
  }

  const enrolled = await userHasEnrolledTotp({ id: ticket.userId });
  const minted = await mintIndependentPluginSession(ticket.userId);
  const session =
    minted ?? (enrolled ? null : await refreshWithToken(ticket.refreshToken));
  if (!session) {
    return extensionJson(
      request,
      {
        ok: false,
        error: enrolled
          ? "errors.extension_login_mfa"
          : "errors.extension_auth_required",
        needsMfa: enrolled,
      },
      { status: 401 },
    );
  }

  const verified = await getExtensionAuth(
    new Request(request.url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        origin: request.headers.get("origin") ?? "",
      },
    }),
  );
  if (!verified || verified.user.id !== ticket.userId) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_auth_required" },
      { status: 401 },
    );
  }

  if (await accessTokenNeedsTotpChallenge(verified.user, session.access_token)) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_login_mfa", needsMfa: true },
      { status: 401 },
    );
  }

  return extensionJson(request, {
    ok: true,
    authCookieName: supabaseAuthCookieName(),
    session,
  });
}
