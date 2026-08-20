import { getGoogleOAuthCredentials } from "@/app/lib/integrations/google-oauth/repository";

export function getGoogleDriveOAuthEnv() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return null;
  if (/your_|placeholder|changeme|example/i.test(clientId + clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

/** Prefer admin-configured Google OAuth credentials, then .env fallback. */
export async function getGoogleDriveOAuthCredentials() {
  const fromIntegrations = await getGoogleOAuthCredentials();
  if (fromIntegrations) return fromIntegrations;
  return getGoogleDriveOAuthEnv();
}

export async function isGoogleDriveOAuthConfigured() {
  return (await getGoogleDriveOAuthCredentials()) !== null;
}

export const GOOGLE_DRIVE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export const GOOGLE_DRIVE_PAGE_PATH = "/team/google-drive";
export const GOOGLE_DRIVE_CALLBACK_PATH = "/auth/google-drive/callback";
export const GOOGLE_DRIVE_OAUTH_COOKIE = "routine-app-gdrive-oauth";
export const GOOGLE_DRIVE_SIMPLE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const GOOGLE_DRIVE_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;
