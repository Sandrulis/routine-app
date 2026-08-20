import { randomBytes } from "node:crypto";
import {
  MICROSOFT_OAUTH_CALLBACK_PATH,
  MICROSOFT_OAUTH_OAUTH_COOKIE,
  MICROSOFT_OAUTH_SCOPES,
  getMicrosoftOAuthCredentials,
} from "@/app/lib/integrations/microsoft-oauth/repository";

export type MicrosoftOAuthConfigureState = {
  nonce: string;
  adminUserId: string;
};

export function microsoftOAuthConfigureCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function createMicrosoftOAuthConfigureState(
  adminUserId: string,
): MicrosoftOAuthConfigureState {
  return {
    adminUserId,
    nonce: randomBytes(16).toString("hex"),
  };
}

export function serializeMicrosoftOAuthConfigureState(
  state: MicrosoftOAuthConfigureState,
) {
  return `${encodeURIComponent(state.adminUserId)}.${state.nonce}`;
}

export function parseMicrosoftOAuthConfigureState(
  raw: string | null | undefined,
): MicrosoftOAuthConfigureState | null {
  if (!raw || raw.startsWith("login.")) return null;
  const separator = raw.indexOf(".");
  if (separator <= 0) return null;
  const adminUserId = decodeURIComponent(raw.slice(0, separator)).trim();
  const nonce = raw.slice(separator + 1).trim();
  if (!adminUserId || !nonce) return null;
  return { adminUserId, nonce };
}

export function microsoftOAuthRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}${MICROSOFT_OAUTH_CALLBACK_PATH}`;
}

export async function buildMicrosoftOAuthAuthorizeUrl(
  origin: string,
  state: string,
  options?: { prompt?: string },
) {
  const credentials = await getMicrosoftOAuthCredentials();
  if (!credentials) return null;
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: microsoftOAuthRedirectUri(origin),
    response_type: "code",
    scope: MICROSOFT_OAUTH_SCOPES,
    response_mode: "query",
    state,
  });
  const prompt = options?.prompt ?? "consent";
  if (prompt) {
    params.set("prompt", prompt);
  }
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
};

async function postToken(body: URLSearchParams): Promise<TokenResponse | null> {
  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    },
  );
  const data = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok || !data?.access_token) {
    return null;
  }
  return data;
}

export async function exchangeMicrosoftOAuthCode(origin: string, code: string) {
  const credentials = await getMicrosoftOAuthCredentials();
  if (!credentials) return null;
  return postToken(
    new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: microsoftOAuthRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  );
}

export async function fetchMicrosoftOAuthUserInfo(accessToken: string) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json().catch(() => null)) as
    | {
        mail?: string;
        userPrincipalName?: string;
        displayName?: string;
      }
    | null;
  if (!response.ok) {
    return { email: "", name: "" };
  }
  return {
    email: (data?.mail || data?.userPrincipalName || "").trim(),
    name: data?.displayName?.trim() ?? "",
  };
}

export async function fetchMicrosoftOAuthAccountEmail(accessToken: string) {
  const profile = await fetchMicrosoftOAuthUserInfo(accessToken);
  return profile.email;
}

export { MICROSOFT_OAUTH_OAUTH_COOKIE };
