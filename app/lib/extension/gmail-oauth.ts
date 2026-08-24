import { randomBytes } from "node:crypto";
import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  getGoogleOAuthCredentials,
} from "@/app/lib/integrations/google-oauth/repository";

export const GMAIL_PLUGIN_START_PATH = "/auth/gmail-plugin/start";
export const GMAIL_PLUGIN_BRIDGE_PATH = "/auth/gmail-plugin/bridge";
export const GMAIL_PLUGIN_LOGIN_PATH = "/auth/gmail-plugin/login";
export const GMAIL_PLUGIN_CALLBACK_PATH = "/auth/gmail-plugin/callback";
export const GMAIL_PLUGIN_DONE_PATH = "/auth/gmail-plugin/done";
export const GMAIL_PLUGIN_OAUTH_COOKIE = "routine-app-gmail-plugin-oauth";
export const GMAIL_PLUGIN_STATE_PREFIX = "gmail.";
export const GMAIL_PLUGIN_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
].join(" ");

export type GmailPluginOAuthState = {
  userId: string;
  nonce: string;
};

export function gmailPluginOAuthCookieOptions(maxAgeSeconds: number) {
  return oauthCookieOptions(maxAgeSeconds);
}

export function createGmailPluginOAuthState(userId: string): GmailPluginOAuthState {
  return {
    userId,
    nonce: randomBytes(16).toString("hex"),
  };
}

export function serializeGmailPluginOAuthState(state: GmailPluginOAuthState) {
  return `${GMAIL_PLUGIN_STATE_PREFIX}${encodeURIComponent(state.userId)}.${state.nonce}`;
}

export function parseGmailPluginOAuthState(
  raw: string | null | undefined,
): GmailPluginOAuthState | null {
  if (!raw?.startsWith(GMAIL_PLUGIN_STATE_PREFIX)) return null;
  const rest = raw.slice(GMAIL_PLUGIN_STATE_PREFIX.length);
  const separator = rest.indexOf(".");
  if (separator <= 0) return null;
  const userId = decodeURIComponent(rest.slice(0, separator)).trim();
  const nonce = rest.slice(separator + 1).trim();
  if (!userId || !nonce) return null;
  return { userId, nonce };
}

export function gmailPluginRedirectUri(
  origin: string,
  callbackPath: string = GOOGLE_OAUTH_CALLBACK_PATH,
) {
  return `${origin.replace(/\/$/, "")}${callbackPath}`;
}

export function buildGmailPluginCallbackUrl(origin?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = (origin?.trim() || siteUrl || "").replace(/\/$/, "");
  if (!base) return GOOGLE_OAUTH_CALLBACK_PATH;
  return `${base}${GOOGLE_OAUTH_CALLBACK_PATH}`;
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

export async function buildGmailPluginAuthorizeUrl(origin: string, state: string) {
  const credentials = await getGoogleOAuthCredentials();
  if (!credentials) return null;
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: gmailPluginRedirectUri(origin),
    response_type: "code",
    scope: GMAIL_PLUGIN_SCOPES,
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeGmailPluginCode(
  origin: string,
  code: string,
  callbackPath: string = GOOGLE_OAUTH_CALLBACK_PATH,
) {
  const credentials = await getGoogleOAuthCredentials();
  if (!credentials) return null;
  return postToken(
    new URLSearchParams({
      code,
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      redirect_uri: gmailPluginRedirectUri(origin, callbackPath),
      grant_type: "authorization_code",
    }),
  );
}

export async function refreshGmailPluginAccessToken(refreshToken: string) {
  const credentials = await getGoogleOAuthCredentials();
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

export async function fetchGmailPluginUserInfo(accessToken: string) {
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
  return {
    email: data.email?.trim() ?? "",
    name: data.name?.trim() ?? "",
    givenName: data.given_name?.trim() ?? "",
    familyName: data.family_name?.trim() ?? "",
    avatarUrl: data.picture?.trim() ?? "",
  };
}
