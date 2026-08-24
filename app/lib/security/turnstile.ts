import { readEnv } from "@/app/lib/env/read-env";
import { logError } from "@/app/lib/security/log-error";
import { SITE_INTEGRATION_KEYS } from "@/app/lib/integrations/keys";
import {
  getSimpleIntegrationCredentials,
  isSimpleIntegrationEnabled,
} from "@/app/lib/integrations/simple/repository";

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function isTurnstileEnabled() {
  if (await isSimpleIntegrationEnabled(SITE_INTEGRATION_KEYS.turnstile)) {
    return true;
  }
  const envSiteKey = readEnv("TURNSTILE_SITE_KEY");
  const envSecret = readEnv("TURNSTILE_SECRET_KEY");
  return Boolean(envSiteKey && envSecret);
}

export async function verifyTurnstileToken(
  token: string,
  remoteIp?: string,
): Promise<boolean> {
  const credentials = await getSimpleIntegrationCredentials(
    SITE_INTEGRATION_KEYS.turnstile,
  );
  const secret =
    credentials?.clientSecret?.trim() || readEnv("TURNSTILE_SECRET_KEY");
  if (!secret) return false;

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  try {
    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
    if (!response.ok) {
      logError("Turnstile verify HTTP error", String(response.status));
      return false;
    }
    const payload = (await response.json()) as { success?: boolean };
    return payload.success === true;
  } catch (error) {
    logError(
      "Turnstile verify failed",
      error instanceof Error ? error.message : String(error),
    );
    return false;
  }
}

export async function requireTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string,
): Promise<
  | { ok: true }
  | { ok: false; error: "errors.auth_turnstile_required" | "errors.auth_turnstile_failed" }
> {
  if (!(await isTurnstileEnabled())) {
    return { ok: true };
  }
  const trimmed = token?.trim();
  if (!trimmed) {
    return { ok: false, error: "errors.auth_turnstile_required" };
  }
  const valid = await verifyTurnstileToken(trimmed, remoteIp);
  if (!valid) {
    return { ok: false, error: "errors.auth_turnstile_failed" };
  }
  return { ok: true };
}
