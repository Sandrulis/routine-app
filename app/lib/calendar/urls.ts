import { calendarFeedPath } from "@/app/lib/calendar/token";

export function calendarHttpsUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}${calendarFeedPath(token)}`;
}

export function calendarWebcalUrl(httpsUrl: string): string {
  return httpsUrl.replace(/^https:/i, "webcal:").replace(/^http:/i, "webcal:");
}

export function googleCalendarSubscribeUrl(httpsIcsUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsIcsUrl)}`;
}
