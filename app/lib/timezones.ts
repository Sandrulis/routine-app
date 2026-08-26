import { resolveTimeZone } from "@/app/lib/cron-jobs/timezone";

/** Biežāk lietotās IANA laika joslas admin/profila izvēlnei. */
export const COMMON_TIMEZONES = [
  "Europe/Riga",
  "Europe/Vilnius",
  "Europe/Tallinn",
  "Europe/Helsinki",
  "Europe/Stockholm",
  "Europe/Berlin",
  "Europe/Warsaw",
  "Europe/Paris",
  "Europe/London",
  "Europe/Moscow",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "UTC",
] as const;

export function formatTimezoneOptionLabel(timeZone: string): string {
  const tz = resolveTimeZone(timeZone);
  try {
    const offset = formatTimezoneShortOffset(tz);
    return offset ? `${tz} (${offset})` : tz;
  } catch {
    return tz;
  }
}

/** Piem. "GMT+2", "UTC", "GMT-5" — atbilstoši pašreizējai DST situācijai. */
export function formatTimezoneShortOffset(timeZone: string, at: Date = new Date()): string {
  const tz = resolveTimeZone(timeZone);
  if (tz === "UTC") return "UTC";
  try {
    return (
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        timeZoneName: "shortOffset",
      })
        .formatToParts(at)
        .find((part) => part.type === "timeZoneName")?.value ?? ""
    );
  } catch {
    return "";
  }
}

/** UTC nobīde minūtēs (+ austrumi, − rietumi) konkrētajā brīdī. */
export function timezoneUtcOffsetMinutes(timeZone: string, at: Date = new Date()): number {
  const tz = resolveTimeZone(timeZone);
  if (tz === "UTC") return 0;

  const shortOffset = formatTimezoneShortOffset(tz, at);
  const parsed = parseShortOffsetMinutes(shortOffset);
  if (parsed !== null) return parsed;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(at);
    const read = (type: string) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);
    const asUtc = Date.UTC(
      read("year"),
      read("month") - 1,
      read("day"),
      read("hour"),
      read("minute"),
      read("second"),
    );
    return Math.round((asUtc - at.getTime()) / 60_000);
  } catch {
    return 0;
  }
}

function parseShortOffsetMinutes(value: string): number | null {
  const normalized = value.trim().toUpperCase();
  if (!normalized || normalized === "UTC" || normalized === "GMT") return 0;

  const match = normalized.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return null;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? 0);
  return sign * (hours * 60 + minutes);
}

function compareTimezonesByUtcOffset(left: string, right: string): number {
  const offsetDiff = timezoneUtcOffsetMinutes(right) - timezoneUtcOffsetMinutes(left);
  if (offsetDiff !== 0) return offsetDiff;
  return left.localeCompare(right);
}

export function timezoneSelectOptions(
  currentValue: string,
  extraValues: Array<string | null | undefined> = [],
): string[] {
  const values = new Set<string>(COMMON_TIMEZONES);
  for (const value of [currentValue, ...extraValues]) {
    const trimmed = value?.trim() ?? "";
    if (trimmed) values.add(trimmed);
  }
  return [...values].sort(compareTimezonesByUtcOffset);
}
