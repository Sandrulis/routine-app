import { randomBytes } from "node:crypto";
import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
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
  return oauthCookieOptions(maxAgeSeconds);
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
  options?: { prompt?: string; loginHint?: string },
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
  const loginHint = options?.loginHint?.trim();
  if (loginHint) {
    params.set("login_hint", loginHint);
  }
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
};

type OidcClaims = Record<string, unknown>;

function parseJwtPayload(token: string | undefined): OidcClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const json = Buffer.from(parts[1], "base64url").toString("utf8");
    const parsed = JSON.parse(json) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as OidcClaims;
  } catch {
    return null;
  }
}

function claimEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function claimVerified(value: unknown): boolean | null {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return null;
}

function pickVerifiedMicrosoftEmail(
  idToken: OidcClaims | null,
  userinfo: OidcClaims | null,
) {
  const tokenEmail = claimEmail(idToken?.email);
  const tokenVerified = claimVerified(idToken?.email_verified);
  const infoEmail = claimEmail(userinfo?.email);
  const infoVerified = claimVerified(userinfo?.email_verified);

  if (tokenEmail && tokenVerified === true) return tokenEmail;
  if (infoEmail && infoVerified === true) return infoEmail;
  return "";
}

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
      scope: MICROSOFT_OAUTH_SCOPES,
    }),
  );
}

export async function fetchMicrosoftOAuthUserInfo(
  accessToken: string,
  idToken?: string,
) {
  const [userinfoResponse, graphResponse] = await Promise.all([
    fetch("https://graph.microsoft.com/oidc/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);
  const userinfo = (await userinfoResponse.json().catch(() => null)) as OidcClaims | null;
  const graph = (await graphResponse.json().catch(() => null)) as
    | { displayName?: string }
    | null;
  const email = pickVerifiedMicrosoftEmail(parseJwtPayload(idToken), userinfoResponse.ok ? userinfo : null);
  const givenName =
    typeof userinfo?.given_name === "string" ? userinfo.given_name.trim() : "";
  const familyName =
    typeof userinfo?.family_name === "string" ? userinfo.family_name.trim() : "";
  const name =
    (typeof userinfo?.name === "string" ? userinfo.name.trim() : "") ||
    [givenName, familyName].filter(Boolean).join(" ") ||
    graph?.displayName?.trim() ||
    "";
  return { email, name, givenName, familyName };
}

export async function fetchMicrosoftOAuthAccountEmail(
  accessToken: string,
  idToken?: string,
) {
  const profile = await fetchMicrosoftOAuthUserInfo(accessToken, idToken);
  return profile.email;
}

export { MICROSOFT_OAUTH_OAUTH_COOKIE };
