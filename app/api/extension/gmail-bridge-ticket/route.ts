import { getExtensionAuth } from "@/app/lib/extension/auth";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { createGmailBridgeTicket } from "@/app/lib/extension/gmail-bridge-ticket";
import { GMAIL_PLUGIN_BRIDGE_PATH } from "@/app/lib/extension/gmail-oauth";
import { loadExtensionSessionFlags } from "@/app/lib/extension/session-payload";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

export async function POST(request: Request) {
  try {
    const auth = await getExtensionAuth(request);
    if (!auth) {
      return extensionJson(
        request,
        { ok: false, error: "errors.auth_required" },
        { status: 401 },
      );
    }

    const limited = await consumeRateLimit(
      `ext-gmail-bridge:${requestClientIp(request)}:${auth.user.id}`,
      20,
      15 * 60 * 1000,
    );
    if (!limited.ok) {
      return extensionJson(
        request,
        { ok: false, error: "errors.auth_rate_limited" },
        { status: 429 },
      );
    }

    const flags = await loadExtensionSessionFlags(auth.supabase);
    if (!flags.gmailPluginEnabled) {
      return extensionJson(
        request,
        { ok: false, error: "errors.extension_plugin_disabled" },
        { status: 403 },
      );
    }

    let body: { refreshToken?: string } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      body = {};
    }

    const refreshToken = String(body.refreshToken || "").trim();
    if (!refreshToken) {
      return extensionJson(
        request,
        { ok: false, error: "errors.extension_auth_required" },
        { status: 400 },
      );
    }

    const ticket = createGmailBridgeTicket({
      refreshToken,
      userId: auth.user.id,
    });

    return extensionJson(request, {
      ok: true,
      ticket,
      bridgePath: GMAIL_PLUGIN_BRIDGE_PATH,
    });
  } catch {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_gmail_auth" },
      { status: 500 },
    );
  }
}
