import { randomBytes } from "node:crypto";
import { oauthCookieOptions } from "@/app/lib/auth/oauth-cookie-options";
import {
  GOOGLE_PLUGIN_CALLBACK_PATH,
  GOOGLE_PLUGIN_SCOPES,
  getGooglePluginCredentials,
} from "@/app/lib/integrations/google-plugin/repository";
import {
  buildGooglePluginAuthorizeUrl,
  exchangeGooglePluginCode,
  fetchGooglePluginUserInfo,
  refreshGooglePluginAccessToken,
} from "@/app/lib/integrations/google-plugin/oauth";

export const GMAIL_PLUGIN_START_PATH = "/auth/gmail-plugin/start";
export const GMAIL_PLUGIN_BRIDGE_PATH = "/auth/gmail-plugin/bridge";
export const GMAIL_PLUGIN_LOGIN_PATH = "/auth/gmail-plugin/login";
export const GMAIL_PLUGIN_CALLBACK_PATH = "/auth/gmail-plugin/callback";
export const GMAIL_PLUGIN_DONE_PATH = "/auth/gmail-plugin/done";
export const GMAIL_PLUGIN_OAUTH_COOKIE = "routine-app-gmail-plugin-oauth";
export const GMAIL_PLUGIN_STATE_PREFIX = "gmail.";
export const GMAIL_PLUGIN_SCOPES = GOOGLE_PLUGIN_SCOPES;

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
  callbackPath: string = GOOGLE_PLUGIN_CALLBACK_PATH,
) {
  return `${origin.replace(/\/$/, "")}${callbackPath}`;
}

export function buildGmailPluginCallbackUrl(origin?: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const base = (origin?.trim() || siteUrl || "").replace(/\/$/, "");
  if (!base) return GOOGLE_PLUGIN_CALLBACK_PATH;
  return `${base}${GOOGLE_PLUGIN_CALLBACK_PATH}`;
}

export async function buildGmailPluginAuthorizeUrl(origin: string, state: string) {
  return buildGooglePluginAuthorizeUrl(origin, state, {
    prompt: "consent",
    accessType: "offline",
    scopes: GMAIL_PLUGIN_SCOPES,
    includeGrantedScopes: true,
  });
}

export async function exchangeGmailPluginCode(
  origin: string,
  code: string,
  callbackPath: string = GOOGLE_PLUGIN_CALLBACK_PATH,
) {
  return exchangeGooglePluginCode(origin, code, callbackPath);
}

export async function refreshGmailPluginAccessToken(refreshToken: string) {
  if (!(await getGooglePluginCredentials())) return null;
  return refreshGooglePluginAccessToken(refreshToken);
}

export async function fetchGmailPluginUserInfo(accessToken: string) {
  return fetchGooglePluginUserInfo(accessToken);
}
