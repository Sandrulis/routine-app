export type WeekStartDay = "monday" | "sunday";
export type SiteDateFormat = "Y-m-d" | "d-m-Y" | "d/m/Y" | "m/d/Y" | "d.m.Y";
export type SiteDateSeparator = "." | "-" | "/" | " ";
export type SiteTimeFormat = "12" | "24";

export type SiteDisplayPreferences = {
  weekStartDay: WeekStartDay;
  dateFormat: SiteDateFormat;
  dateSeparator: SiteDateSeparator;
  timeFormat: SiteTimeFormat;
};

/** Lietotāja pārrakstījumi; null = izmanto sistēmas noklusējumu. */
export type UserDisplayPreferences = {
  weekStartDay: WeekStartDay | null;
  dateFormat: SiteDateFormat | null;
  dateSeparator: SiteDateSeparator | null;
  timeFormat: SiteTimeFormat | null;
};

export const EMPTY_USER_DISPLAY_PREFERENCES: UserDisplayPreferences = {
  weekStartDay: null,
  dateFormat: null,
  dateSeparator: null,
  timeFormat: null,
};

export const DEFAULT_SITE_DISPLAY_PREFERENCES: SiteDisplayPreferences = {
  weekStartDay: "monday",
  dateFormat: "d.m.Y",
  dateSeparator: ".",
  timeFormat: "24",
};

const WEEK_START_DAYS = new Set<WeekStartDay>(["monday", "sunday"]);
const DATE_FORMATS = new Set<SiteDateFormat>([
  "Y-m-d",
  "d-m-Y",
  "d/m/Y",
  "m/d/Y",
  "d.m.Y",
]);
const DATE_SEPARATORS = new Set<SiteDateSeparator>([".", "-", "/", " "]);
const TIME_FORMATS = new Set<SiteTimeFormat>(["12", "24"]);

export function normalizeWeekStartDay(value: unknown): WeekStartDay {
  return typeof value === "string" && WEEK_START_DAYS.has(value as WeekStartDay)
    ? (value as WeekStartDay)
    : DEFAULT_SITE_DISPLAY_PREFERENCES.weekStartDay;
}

export function normalizeDateFormat(value: unknown): SiteDateFormat {
  return typeof value === "string" && DATE_FORMATS.has(value as SiteDateFormat)
    ? (value as SiteDateFormat)
    : DEFAULT_SITE_DISPLAY_PREFERENCES.dateFormat;
}

export function normalizeDateSeparator(value: unknown): SiteDateSeparator {
  return typeof value === "string" && DATE_SEPARATORS.has(value as SiteDateSeparator)
    ? (value as SiteDateSeparator)
    : DEFAULT_SITE_DISPLAY_PREFERENCES.dateSeparator;
}

export function normalizeTimeFormat(value: unknown): SiteTimeFormat {
  return typeof value === "string" && TIME_FORMATS.has(value as SiteTimeFormat)
    ? (value as SiteTimeFormat)
    : DEFAULT_SITE_DISPLAY_PREFERENCES.timeFormat;
}

export function normalizeSiteDisplayPreferences(
  value: Partial<SiteDisplayPreferences> | null | undefined,
): SiteDisplayPreferences {
  return {
    weekStartDay: normalizeWeekStartDay(value?.weekStartDay),
    dateFormat: normalizeDateFormat(value?.dateFormat),
    dateSeparator: normalizeDateSeparator(value?.dateSeparator),
    timeFormat: normalizeTimeFormat(value?.timeFormat),
  };
}

export function siteDisplayPreferencesEqual(
  left: SiteDisplayPreferences,
  right: SiteDisplayPreferences,
): boolean {
  return (
    left.weekStartDay === right.weekStartDay &&
    left.dateFormat === right.dateFormat &&
    left.dateSeparator === right.dateSeparator &&
    left.timeFormat === right.timeFormat
  );
}

export function userDisplayPreferencesEqual(
  left: UserDisplayPreferences,
  right: UserDisplayPreferences,
): boolean {
  return (
    left.weekStartDay === right.weekStartDay &&
    left.dateFormat === right.dateFormat &&
    left.dateSeparator === right.dateSeparator &&
    left.timeFormat === right.timeFormat
  );
}

export function readUserDisplayPreferences(row: {
  week_start_day?: string | null;
  date_format?: string | null;
  date_separator?: string | null;
  time_format?: string | null;
}): UserDisplayPreferences {
  return {
    weekStartDay:
      typeof row.week_start_day === "string" &&
      WEEK_START_DAYS.has(row.week_start_day as WeekStartDay)
        ? (row.week_start_day as WeekStartDay)
        : null,
    dateFormat:
      typeof row.date_format === "string" &&
      DATE_FORMATS.has(row.date_format as SiteDateFormat)
        ? (row.date_format as SiteDateFormat)
        : null,
    dateSeparator:
      typeof row.date_separator === "string" &&
      DATE_SEPARATORS.has(row.date_separator as SiteDateSeparator)
        ? (row.date_separator as SiteDateSeparator)
        : null,
    timeFormat:
      typeof row.time_format === "string" &&
      TIME_FORMATS.has(row.time_format as SiteTimeFormat)
        ? (row.time_format as SiteTimeFormat)
        : null,
  };
}

export function hasUserDisplayOverrides(user: UserDisplayPreferences): boolean {
  return (
    user.weekStartDay !== null ||
    user.dateFormat !== null ||
    user.dateSeparator !== null ||
    user.timeFormat !== null
  );
}

export function mergeDisplayPreferences(
  system: SiteDisplayPreferences,
  user: UserDisplayPreferences | null | undefined,
): SiteDisplayPreferences {
  if (!user) return system;
  return {
    weekStartDay: user.weekStartDay ?? system.weekStartDay,
    dateFormat: user.dateFormat ?? system.dateFormat,
    dateSeparator: user.dateSeparator ?? system.dateSeparator,
    timeFormat: user.timeFormat ?? system.timeFormat,
  };
}
