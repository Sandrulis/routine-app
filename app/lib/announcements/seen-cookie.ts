import { readCookie, writeCookie } from "@/app/lib/cookies";

export const ANNOUNCEMENT_SEEN_COOKIE_PREFIX = "routine-app-announcement-seen_";

export function announcementSeenCookieName(announcementId: string): string {
  return `${ANNOUNCEMENT_SEEN_COOKIE_PREFIX}${announcementId.trim()}`;
}

export function readAnnouncementSeen(announcementId: string): boolean {
  const trimmedId = announcementId.trim();
  if (!trimmedId) return false;
  return readCookie(announcementSeenCookieName(trimmedId)) === "1";
}

export function writeAnnouncementSeen(
  announcementId: string,
  expiresAt: string,
): void {
  const trimmedId = announcementId.trim();
  if (!trimmedId) return;

  writeCookie(
    announcementSeenCookieName(trimmedId),
    "1",
    cookieMaxAgeSecondsUntil(expiresAt),
  );
}

function cookieMaxAgeSecondsUntil(expiresAt: string): number {
  const expiry = Date.parse(`${expiresAt.trim()}T23:59:59`);
  if (!Number.isFinite(expiry)) {
    return 60 * 60 * 24 * 365;
  }

  const secondsLeft = Math.ceil((expiry - Date.now()) / 1000);
  return Math.min(60 * 60 * 24 * 365, Math.max(60 * 60 * 24, secondsLeft));
}
