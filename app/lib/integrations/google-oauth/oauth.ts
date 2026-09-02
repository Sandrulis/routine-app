import { randomBytes } from "node:crypto";
import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  GOOGLE_OAUTH_OAUTH_COOKIE,
  GOOGLE_OAUTH_SCOPES,
} from "@/app/lib/integrations/google-oauth/repository";
import { getGoogleOAuthCredentials } from "@/app/lib/integrations/google-oauth/repository";

export type GoogleOAuthConfigureState = {
  nonce: string;
  adminUserId: string;
};

export function googleOAuthConfigureCookieOptions(maxAgeSeconds: number) {
  return oauthCookieOptions(maxAgeSeconds);
}

export function createGoogleOAuthConfigureState(
  adminUserId: string,
): GoogleOAuthConfigureState {
  return {
    adminUserId,
    nonce: randomBytes(16).toString("hex"),
  };
}

export function serializeGoogleOAuthConfigureState(
  state: GoogleOAuthConfigureState,
) {
  return `${encodeURIComponent(state.adminUserId)}.${state.nonce}`;
}

export function parseGoogleOAuthConfigureState(
  raw: string | null | undefined,
): GoogleOAuthConfigureState | null {
  if (!raw || raw.startsWith("login.")) return null;
  const separator = raw.indexOf(".");
  if (separator <= 0) return null;
  const adminUserId = decodeURIComponent(raw.slice(0, separator)).trim();
  const nonce = raw.slice(separator + 1).trim();
  if (!adminUserId || !nonce) return null;
  return { adminUserId, nonce };
}

export function googleOAuthRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}

export async function buildGoogleOAuthAuthorizeUrl(
  origin: string,
  state: string,
  options?: { prompt?: string; accessType?: string; loginHint?: string },
) {
  const credentials = await getGoogleOAuthCredentials();
  if (!credentials) return null;
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: googleOAuthRedirectUri(origin),
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    access_type: options?.accessType ?? "offline",
    prompt: options?.prompt ?? "consent",
    state,
  });
  const loginHint = options?.loginHint?.trim();
  if (loginHint) {
    params.set("login_hint", loginHint);
  }
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

export async function exchangeGoogleOAuthCode(origin: string, code: string) {
  const credentials = await getGoogleOAuthCredentials();
  if (!credentials) return null;
  return postToken(
    new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: googleOAuthRedirectUri(origin),
      grant_type: "authorization_code",
    }),
  );
}

export async function fetchGoogleOAuthUserInfo(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json().catch(() => null)) as {
    email?: string;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
    verified_email?: boolean;
  } | null;
  if (!response.ok || !data?.verified_email) {
    return {
      email: "",
      name: "",
      givenName: "",
      familyName: "",
      avatarUrl: "",
    };
  }
  const givenName = data.given_name?.trim() ?? "";
  const familyName = data.family_name?.trim() ?? "";
  const name =
    data.name?.trim() ||
    [givenName, familyName].filter(Boolean).join(" ");
  return {
    email: data.email?.trim() ?? "",
    name,
    givenName,
    familyName,
    avatarUrl: data.picture?.trim() ?? "",
  };
}

export async function fetchGoogleOAuthAccountEmail(accessToken: string) {
  const profile = await fetchGoogleOAuthUserInfo(accessToken);
  return profile.email;
}

export { GOOGLE_OAUTH_OAUTH_COOKIE };
