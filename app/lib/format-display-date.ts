import {
  DEFAULT_SITE_DISPLAY_PREFERENCES,
  type SiteDateFormat,
  type SiteDateSeparator,
  type SiteDisplayPreferences,
  type SiteTimeFormat,
  type WeekStartDay,
} from "@/app/lib/site-admin/display-preferences";

export type { SiteDisplayPreferences, WeekStartDay };

function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const date = new Date(
    trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`,
  );
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function yearDigitsForFormat(format: SiteDateFormat): 2 | 4 {
  return format === "d.m.Y" ? 2 : 4;
}

function applyDateSeparator(parts: string, separator: SiteDateSeparator): string {
  return parts.replace(/[./-]/g, separator);
}

function formatDateParts(
  date: Date,
  format: SiteDateFormat,
  separator: SiteDateSeparator,
): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const yearFull = String(date.getFullYear());
  const year =
    yearDigitsForFormat(format) === 2 ? yearFull.slice(-2) : yearFull;

  switch (format) {
    case "Y-m-d":
      return applyDateSeparator(`${yearFull}-${month}-${day}`, separator);
    case "d-m-Y":
      return applyDateSeparator(`${day}-${month}-${yearFull}`, separator);
    case "d/m/Y":
      return applyDateSeparator(`${day}/${month}/${yearFull}`, separator);
    case "m/d/Y":
      return applyDateSeparator(`${month}/${day}/${yearFull}`, separator);
    case "d.m.Y":
    default:
      return applyDateSeparator(`${day}.${month}.${year}`, separator);
  }
}

function formatTimeParts(date: Date, timeFormat: SiteTimeFormat): string {
  if (timeFormat === "12") {
    const hours24 = date.getHours();
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${String(hours12).padStart(2, "0")}:${minutes} ${period}`;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDisplayDate(
  value: string,
  preferences: SiteDisplayPreferences = DEFAULT_SITE_DISPLAY_PREFERENCES,
): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  return formatDateParts(date, preferences.dateFormat, preferences.dateSeparator);
}

export function formatDisplayDateTime(
  value: string,
  preferences: SiteDisplayPreferences = DEFAULT_SITE_DISPLAY_PREFERENCES,
): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  return `${formatDateParts(date, preferences.dateFormat, preferences.dateSeparator)} ${formatTimeParts(date, preferences.timeFormat)}`;
}

/** Noklusējuma datuma attēlojums UI: dd.mm.yy */
export function formatDisplayDateDdMmYy(value: string): string {
  return formatDisplayDate(value, DEFAULT_SITE_DISPLAY_PREFERENCES);
}

/** Datums un laiks UI: dd.mm.yy hh:mm */
export function formatDisplayDateTimeDdMmYy(value: string): string {
  return formatDisplayDateTime(value, DEFAULT_SITE_DISPLAY_PREFERENCES);
}

/** Šodienas datums glabāšanai (YYYY-MM-DD). */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Kalendārās dienas no šodienas līdz datumam (nākotne +, pagātne -). */
export function calendarDaysFromToday(value: string): number | null {
  const date = parseDisplayDate(value);
  if (!date) return null;
  const today = parseDisplayDate(`${todayIsoDate()}T12:00:00`);
  if (!today) return null;
  const target = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - current) / 86_400_000);
}

/** JavaScript getDay() pārrēķins, ja nedēļa sākas svētdienā. */
export function jsWeekdayForCalendar(
  date: Date,
  weekStartDay: WeekStartDay = DEFAULT_SITE_DISPLAY_PREFERENCES.weekStartDay,
): number {
  const day = date.getDay();
  if (weekStartDay === "sunday") return day;
  return day === 0 ? 6 : day - 1;
}

/** Priekšskatījuma datums admin formā. */
export function previewDisplayDate(
  preferences: SiteDisplayPreferences,
  sampleDate = "2026-08-19T14:30:00",
): { date: string; time: string; datetime: string } {
  return {
    date: formatDisplayDate(sampleDate, preferences),
    time: formatTimeParts(parseDisplayDate(sampleDate) ?? new Date(), preferences.timeFormat),
    datetime: formatDisplayDateTime(sampleDate, preferences),
  };
}
