export const DEFAULT_TIMEZONE = "Europe/Riga";
export const CRON_USER_BATCH_LIMIT = 1000;
export const CRON_START_HOUR = 8;
export const CRON_DUE_HOUR = 9;

export function isValidTimeZone(value: string): boolean {
  if (!value || value.length < 3 || value.length > 64) return false;
  if (!/^[A-Za-z0-9_+\-/]+$/.test(value)) return false;
  try {
    Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  return isValidTimeZone(trimmed) ? trimmed : DEFAULT_TIMEZONE;
}

export function shiftUtcDate(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function zonedDateHour(
  now: Date,
  timeZone: string,
): { date: string; hour: number } {
  const tz = resolveTimeZone(timeZone);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const read = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return {
    date: `${read("year")}-${read("month")}-${read("day")}`,
    hour: Number(read("hour")),
  };
}
