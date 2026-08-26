import { resolveTimeZone } from "@/app/lib/cron-jobs/timezone";
import {
  DEFAULT_SITE_DISPLAY_PREFERENCES,
  type SiteDateFormat,
  type SiteDateSeparator,
  type SiteDisplayPreferences,
  type SiteTimeFormat,
  type WeekStartDay,
} from "@/app/lib/site-admin/display-preferences";

export type { SiteDisplayPreferences, WeekStartDay };

export type FormatDisplayOptions = SiteDisplayPreferences & {
  timeZone?: string;
};

function parseCalendarDate(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function parseDisplayDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const calendar = parseCalendarDate(trimmed);
  if (calendar) {
    return new Date(Date.UTC(calendar.year, calendar.month - 1, calendar.day, 12, 0, 0));
  }

  const date = new Date(trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function hasTimeComponent(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.includes("T") && /\d{2}:\d{2}/.test(trimmed);
}

function yearDigitsForFormat(format: SiteDateFormat): 2 | 4 {
  return format === "d.m.Y" ? 2 : 4;
}

function applyDateSeparator(parts: string, separator: SiteDateSeparator): string {
  return parts.replace(/[./-]/g, separator);
}

function formatDateFromParts(input: {
  year: number;
  month: number;
  day: number;
  format: SiteDateFormat;
  separator: SiteDateSeparator;
}): string {
  const day = String(input.day).padStart(2, "0");
  const month = String(input.month).padStart(2, "0");
  const yearFull = String(input.year);
  const year =
    yearDigitsForFormat(input.format) === 2 ? yearFull.slice(-2) : yearFull;

  switch (input.format) {
    case "Y-m-d":
      return applyDateSeparator(`${yearFull}-${month}-${day}`, input.separator);
    case "d-m-Y":
      return applyDateSeparator(`${day}-${month}-${yearFull}`, input.separator);
    case "d/m/Y":
      return applyDateSeparator(`${day}/${month}/${yearFull}`, input.separator);
    case "m/d/Y":
      return applyDateSeparator(`${month}/${day}/${yearFull}`, input.separator);
    case "d.m.Y":
    default:
      return applyDateSeparator(`${day}.${month}.${year}`, input.separator);
  }
}

function readDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const read = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
  };
}

function formatDateParts(
  date: Date,
  format: SiteDateFormat,
  separator: SiteDateSeparator,
  timeZone?: string,
  value?: string,
): string {
  if (value && parseCalendarDate(value)) {
    const calendar = parseCalendarDate(value)!;
    return formatDateFromParts({
      year: calendar.year,
      month: calendar.month,
      day: calendar.day,
      format,
      separator,
    });
  }

  const parts = timeZone
    ? readDatePartsInTimeZone(date, timeZone)
    : {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      };

  return formatDateFromParts({
    ...parts,
    format,
    separator,
  });
}

function formatTimeParts(
  date: Date,
  timeFormat: SiteTimeFormat,
  timeZone?: string,
): string {
  if (timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: resolveTimeZone(timeZone),
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: timeFormat === "12" ? "h12" : "h23",
    }).formatToParts(date);
    const read = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? "";
    if (timeFormat === "12") {
      const hour = read("hour").padStart(2, "0");
      const minute = read("minute").padStart(2, "0");
      const dayPeriod = read("dayPeriod").toUpperCase();
      return `${hour}:${minute} ${dayPeriod}`;
    }
    const hour = read("hour").padStart(2, "0");
    const minute = read("minute").padStart(2, "0");
    return `${hour}:${minute}`;
  }

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
  timeZone?: string,
): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  return formatDateParts(
    date,
    preferences.dateFormat,
    preferences.dateSeparator,
    timeZone,
    value,
  );
}

export function formatDisplayDateTime(
  value: string,
  preferences: SiteDisplayPreferences = DEFAULT_SITE_DISPLAY_PREFERENCES,
  timeZone?: string,
): string {
  const date = parseDisplayDate(value);
  if (!date) return "";
  const effectiveTimeZone =
    timeZone && hasTimeComponent(value) ? resolveTimeZone(timeZone) : undefined;
  return `${formatDateParts(
    date,
    preferences.dateFormat,
    preferences.dateSeparator,
    effectiveTimeZone,
    value,
  )} ${formatTimeParts(date, preferences.timeFormat, effectiveTimeZone)}`;
}

/** Noklusējuma datuma attēlojums UI: dd.mm.yy */
export function formatDisplayDateDdMmYy(value: string): string {
  return formatDisplayDate(value, DEFAULT_SITE_DISPLAY_PREFERENCES);
}

/** Datums un laiks UI: dd.mm.yy hh:mm */
export function formatDisplayDateTimeDdMmYy(value: string): string {
  return formatDisplayDateTime(value, DEFAULT_SITE_DISPLAY_PREFERENCES);
}

/** Šodienas datums glabāšanai (YYYY-MM-DD) attiecīgajā laika joslā. */
export function todayIsoDate(timeZone?: string): string {
  if (!timeZone) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  const parts = readDatePartsInTimeZone(new Date(), timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

/** Kalendārās dienas no šodienas līdz datumam (nākotne +, pagātne -). */
export function calendarDaysFromToday(value: string, timeZone?: string): number | null {
  const date = parseDisplayDate(value);
  if (!date) return null;
  const today = parseDisplayDate(`${todayIsoDate(timeZone)}T12:00:00`);
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

/** Priekšskatījuma datums admin/profila formā. */
export function previewDisplayDate(
  preferences: FormatDisplayOptions,
  sampleDate = "2026-08-19T14:30:00",
): { date: string; time: string; datetime: string } {
  const timeZone = preferences.timeZone;
  return {
    date: formatDisplayDate(sampleDate, preferences, timeZone),
    time: formatTimeParts(
      parseDisplayDate(sampleDate) ?? new Date(),
      preferences.timeFormat,
      timeZone,
    ),
    datetime: formatDisplayDateTime(sampleDate, preferences, timeZone),
  };
}
