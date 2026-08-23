import { getExtensionAuth } from "@/app/lib/extension/auth";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { getValidGmailAccessToken } from "@/app/lib/extension/gmail-connection";
import { loadExtensionSessionFlags } from "@/app/lib/extension/session-payload";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { requestClientIp } from "@/app/lib/security/client-ip";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

export async function GET(request: Request) {
  const auth = await getExtensionAuth(request);
  if (!auth) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_required" },
      { status: 401 },
    );
  }

  const limited = consumeRateLimit(
    `ext-gmail-token:${requestClientIp(request)}:${auth.user.id}`,
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

  const flags = await loadExtensionSessionFlags(auth.supabase);
  if (!flags.gmailPluginEnabled) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_plugin_disabled" },
      { status: 403 },
    );
  }

  const token = await getValidGmailAccessToken(auth.user.id);
  if (!token.ok) {
    return extensionJson(
      request,
      { ok: false, error: token.error },
      { status: 403 },
    );
  }

  return extensionJson(request, {
    ok: true,
    accessToken: token.accessToken,
    expiresIn: token.expiresIn,
    googleEmail: token.googleEmail,
  });
}
