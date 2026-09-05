import { randomBytes } from "node:crypto";
import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
import {
  GOOGLE_PLUGIN_CALLBACK_PATH,
  GOOGLE_PLUGIN_OAUTH_COOKIE,
  GOOGLE_PLUGIN_SCOPES,
  getGooglePluginCredentials,
} from "@/app/lib/integrations/google-plugin/repository";

export type GooglePluginConfigureState = {
  nonce: string;
  adminUserId: string;
};

const CONFIGURE_PREFIX = "gplugin.";

export function googlePluginOAuthCookieOptions(maxAgeSeconds: number) {
  return oauthCookieOptions(maxAgeSeconds);
}

export function createGooglePluginConfigureState(
  adminUserId: string,
): GooglePluginConfigureState {
  return {
    adminUserId,
    nonce: randomBytes(16).toString("hex"),
  };
}

export function serializeGooglePluginConfigureState(
  state: GooglePluginConfigureState,
) {
  return `${CONFIGURE_PREFIX}${encodeURIComponent(state.adminUserId)}.${state.nonce}`;
}

export function parseGooglePluginConfigureState(
  raw: string | null | undefined,
): GooglePluginConfigureState | null {
  if (!raw?.startsWith(CONFIGURE_PREFIX)) return null;
  const rest = raw.slice(CONFIGURE_PREFIX.length);
  const separator = rest.indexOf(".");
  if (separator <= 0) return null;
  const adminUserId = decodeURIComponent(rest.slice(0, separator)).trim();
  const nonce = rest.slice(separator + 1).trim();
  if (!adminUserId || !nonce) return null;
  return { adminUserId, nonce };
}

export function googlePluginRedirectUri(origin: string) {
  return `${origin.replace(/\/$/, "")}${GOOGLE_PLUGIN_CALLBACK_PATH}`;
}

export async function buildGooglePluginAuthorizeUrl(
  origin: string,
  state: string,
  options?: {
    prompt?: string;
    accessType?: string;
    loginHint?: string;
    scopes?: string;
    includeGrantedScopes?: boolean;
  },
) {
  const credentials = await getGooglePluginCredentials();
  if (!credentials) return null;
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: googlePluginRedirectUri(origin),
    response_type: "code",
    scope: options?.scopes?.trim() || GOOGLE_PLUGIN_SCOPES,
    access_type: options?.accessType ?? "offline",
    prompt: options?.prompt ?? "consent",
    state,
  });
  const loginHint = options?.loginHint?.trim();
  if (loginHint) {
    params.set("login_hint", loginHint);
  }
  if (options?.includeGrantedScopes) {
    params.set("include_granted_scopes", "true");
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

export async function exchangeGooglePluginCode(
  origin: string,
  code: string,
  callbackPath: string = GOOGLE_PLUGIN_CALLBACK_PATH,
) {
  const credentials = await getGooglePluginCredentials();
  if (!credentials) return null;
  return postToken(
    new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: `${origin.replace(/\/$/, "")}${callbackPath}`,
      grant_type: "authorization_code",
    }),
  );
}

export async function refreshGooglePluginAccessToken(refreshToken: string) {
  const credentials = await getGooglePluginCredentials();
  if (!credentials) return null;
  return postToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: "refresh_token",
    }),
  );
}

export async function fetchGooglePluginUserInfo(accessToken: string) {
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
  if (!response.ok || !data) {
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
    data.name?.trim() || [givenName, familyName].filter(Boolean).join(" ");
  return {
    email: data.email?.trim() ?? "",
    name,
    givenName,
    familyName,
    avatarUrl: data.picture?.trim() ?? "",
  };
}

export { GOOGLE_PLUGIN_OAUTH_COOKIE };
