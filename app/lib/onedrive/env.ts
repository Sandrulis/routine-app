import { getMicrosoftOAuthCredentials } from "@/app/lib/integrations/microsoft-oauth/repository";

export function getOneDriveOAuthEnv() {
  const clientId = process.env.ONEDRIVE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return null;
  if (/your_|placeholder|changeme|example/i.test(clientId + clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

/** Prefer admin-configured Microsoft OAuth credentials, then .env fallback. */
export async function getOneDriveOAuthCredentials() {
  return getMicrosoftOAuthCredentials();
}

export async function isOneDriveOAuthConfigured() {
  return (await getOneDriveOAuthCredentials()) !== null;
}

export const ONEDRIVE_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "Files.ReadWrite",
].join(" ");

export const ONEDRIVE_PAGE_PATH = "/team/onedrive";
export const ONEDRIVE_CALLBACK_PATH = "/auth/onedrive/callback";
export const ONEDRIVE_OAUTH_COOKIE = "routine-app-onedrive-oauth";
export const ONEDRIVE_SIMPLE_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;
export const ONEDRIVE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
