export function getGoogleDriveOAuthEnv() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET?.trim() ?? "";
  if (!clientId || !clientSecret) return null;
  if (/your_|placeholder|changeme|example/i.test(clientId + clientSecret)) {
    return null;
  }
  return { clientId, clientSecret };
}

export function isGoogleDriveOAuthConfigured() {
  return getGoogleDriveOAuthEnv() !== null;
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
