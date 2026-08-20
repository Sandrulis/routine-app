import { randomBytes } from "node:crypto";

export const CALENDAR_FEED_TOKEN_PATTERN = /^[a-f0-9]{64}$/;

export function createCalendarFeedToken(): string {
  return randomBytes(32).toString("hex");
}

export function normalizeCalendarFeedToken(value: string): string | null {
  const token = value.trim().toLowerCase().replace(/\.ics$/i, "");
  if (!CALENDAR_FEED_TOKEN_PATTERN.test(token)) {
    return null;
  }
  return token;
}

export function calendarFeedPath(token: string): string {
  return `/calendar/${token}.ics`;
}
