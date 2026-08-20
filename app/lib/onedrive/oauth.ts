import { randomBytes } from "node:crypto";
import {
  ONEDRIVE_CALLBACK_PATH,
  ONEDRIVE_OAUTH_COOKIE,
  ONEDRIVE_SCOPES,
  getOneDriveOAuthCredentials,
} from "@/app/lib/onedrive/env";

export type OneDriveOAuthState = {
  teamId: string;
  nonce: string;
};

export function oneDriveOAuthCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function createOneDriveOAuthState(teamId: string): OneDriveOAuthState {
  return {
    teamId,
    nonce: randomBytes(16).toString("hex"),
  };
}

export function serializeOneDriveOAuthState(state: OneDriveOAuthState) {
  return `${encodeURIComponent(state.teamId)}.${state.nonce}`;
}

export function parseOneDriveOAuthState(
  raw: string | null | undefined,
): OneDriveOAuthState | null {
  if (!raw) return null;
  const separator = raw.indexOf(".");
  if (separator <= 0) return null;
  const teamId = decodeURIComponent(raw.slice(0, separator)).trim();
  const nonce = raw.slice(separator + 1).trim();
  if (!teamId || !nonce) return null;
  return { teamId, nonce };
}

export function oneDriveRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}${ONEDRIVE_CALLBACK_PATH}`;
}

export async function buildOneDriveAuthorizeUrl(origin: string, state: string) {
  const env = await getOneDriveOAuthCredentials();
  if (!env) return null;
  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: oneDriveRedirectUri(origin),
    response_type: "code",
    scope: ONEDRIVE_SCOPES,
    response_mode: "query",
    state,
    prompt: "consent",
  });
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

export async function exchangeOneDriveCode(origin: string, code: string) {
  const env = await getOneDriveOAuthCredentials();
  if (!env) return null;
  return postToken(
    new URLSearchParams({
      code,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      redirect_uri: oneDriveRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  );
}

export async function refreshOneDriveAccessToken(refreshToken: string) {
  const env = await getOneDriveOAuthCredentials();
  if (!env) return null;
  return postToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      grant_type: "refresh_token",
      scope: ONEDRIVE_SCOPES,
    }),
  );
}

export async function fetchOneDriveAccountEmail(accessToken: string) {
  const response = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json().catch(() => null)) as
    | { mail?: string; userPrincipalName?: string }
    | null;
  if (!response.ok) return "";
  return (data?.mail || "").trim();
}

export { ONEDRIVE_OAUTH_COOKIE };
