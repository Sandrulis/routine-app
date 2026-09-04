import { todayIsoDate } from "@/app/lib/format-display-date";
import { resolveTimeZone, shiftUtcDate } from "@/app/lib/cron-jobs/timezone";

function zonedDateTimeToUtc(
  isoDate: string,
  timeZone: string,
  hour = 0,
): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) {
    return new Date(NaN);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const tz = resolveTimeZone(timeZone);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  let instant = Date.UTC(year, month - 1, day, hour, 0, 0);
  for (let i = 0; i < 4; i += 1) {
    const parts = formatter.formatToParts(new Date(instant));
    const read = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? "0");
    const got = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour"),
      read("minute"),
      0,
    );
    const wanted = Date.UTC(year, month - 1, day, hour, 0, 0);
    instant += wanted - got;
  }
  return new Date(instant);
}

export function isSnoozeActive(
  untilIso: string | null | undefined,
  now = Date.now(),
): boolean {
  if (!untilIso) return false;
  const until = Date.parse(untilIso);
  return Number.isFinite(until) && until > now;
}

export function snoozeUntilHourFromNow(hours = 1, now = new Date()): string {
  return new Date(now.getTime() + hours * 3_600_000).toISOString();
}

export function snoozeUntilWeekFromNow(now = new Date()): string {
  return new Date(now.getTime() + 7 * 24 * 3_600_000).toISOString();
}

export function snoozeUntilStartOfDate(isoDate: string, timeZone: string): string {
  return zonedDateTimeToUtc(isoDate, timeZone, 0).toISOString();
}

export function snoozeUntilTomorrow(timeZone: string): string {
  const today = todayIsoDate(timeZone);
  const tomorrow = shiftUtcDate(today, 1);
  return snoozeUntilStartOfDate(tomorrow, timeZone);
}

export function earliestSnoozeDateIso(timeZone: string): string {
  return shiftUtcDate(todayIsoDate(timeZone), 1);
}

export function clampSnoozeDateIso(isoDate: string, timeZone: string): string | null {
  const min = earliestSnoozeDateIso(timeZone);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  return isoDate < min ? null : isoDate;
}
