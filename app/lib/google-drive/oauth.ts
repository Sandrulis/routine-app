import { randomBytes } from "node:crypto";
import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
import {
  GOOGLE_DRIVE_CALLBACK_PATH,
  GOOGLE_DRIVE_OAUTH_COOKIE,
  GOOGLE_DRIVE_SCOPES,
  getGoogleDriveOAuthCredentials,
} from "@/app/lib/google-drive/env";

export type GoogleDriveOAuthState = {
  teamId: string;
  nonce: string;
};

export function googleDriveOAuthCookieOptions(maxAgeSeconds: number) {
  return oauthCookieOptions(maxAgeSeconds);
}

export function createGoogleDriveOAuthState(teamId: string): GoogleDriveOAuthState {
  return {
    teamId,
    nonce: randomBytes(16).toString("hex"),
  };
}

export function serializeGoogleDriveOAuthState(state: GoogleDriveOAuthState) {
  return `${encodeURIComponent(state.teamId)}.${state.nonce}`;
}

export function parseGoogleDriveOAuthState(
  raw: string | null | undefined,
): GoogleDriveOAuthState | null {
  if (!raw) return null;
  const separator = raw.indexOf(".");
  if (separator <= 0) return null;
  const teamId = decodeURIComponent(raw.slice(0, separator)).trim();
  const nonce = raw.slice(separator + 1).trim();
  if (!teamId || !nonce) return null;
  return { teamId, nonce };
}

export function googleDriveRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}${GOOGLE_DRIVE_CALLBACK_PATH}`;
}

export async function buildGoogleDriveAuthorizeUrl(origin: string, state: string) {
  const env = await getGoogleDriveOAuthCredentials();
  if (!env) return null;
  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: googleDriveRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_DRIVE_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
};

async function postToken(body: URLSearchParams): Promise<TokenResponse | null> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = (await response.json().catch(() => null)) as TokenResponse | null;
  if (!response.ok || !data?.access_token) {
    return null;
  }
  return data;
}

export async function exchangeGoogleDriveCode(origin: string, code: string) {
  const env = await getGoogleDriveOAuthCredentials();
  if (!env) return null;
  return postToken(
    new URLSearchParams({
      code,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      redirect_uri: googleDriveRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  );
}

export async function refreshGoogleDriveAccessToken(refreshToken: string) {
  const env = await getGoogleDriveOAuthCredentials();
  if (!env) return null;
  return postToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      grant_type: "refresh_token",
    }),
  );
}

export async function fetchGoogleDriveAccountEmail(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json().catch(() => null)) as { email?: string } | null;
  if (!response.ok) return "";
  return data?.email?.trim() ?? "";
}

export { GOOGLE_DRIVE_OAUTH_COOKIE };
