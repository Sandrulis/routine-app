"use client";

import { useTranslations } from "@/app/components/translations-provider";
import { TimezoneSelectField } from "@/app/components/timezone-select-field";
import type {
  SiteDateFormat,
  SiteDateSeparator,
  SiteDisplayPreferences,
  SiteTimeFormat,
  UserDisplayPreferences,
  WeekStartDay,
} from "@/app/lib/site-admin/display-preferences";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";
const hintClassName = "mt-1.5 text-xs text-zinc-500";

const DATE_FORMATS: SiteDateFormat[] = ["Y-m-d", "d-m-Y", "d/m/Y", "m/d/Y", "d.m.Y"];
const DATE_SEPARATOR_LABEL_KEYS: Record<SiteDateSeparator, string> = {
  ".": "site_settings.form.date_separator.dot",
  "-": "site_settings.form.date_separator.dash",
  "/": "site_settings.form.date_separator.slash",
  " ": "site_settings.form.date_separator.space",
};
const DATE_SEPARATORS = Object.keys(DATE_SEPARATOR_LABEL_KEYS) as SiteDateSeparator[];
const TIME_FORMATS: SiteTimeFormat[] = ["24", "12"];
const WEEK_START_DAYS: WeekStartDay[] = ["monday", "sunday"];

function optionLabel(
  t: ReturnType<typeof useTranslations>["t"],
  key: string,
  fallback: string,
) {
  return t(key, fallback);
}

function systemWeekStartLabel(
  t: ReturnType<typeof useTranslations>["t"],
  value: WeekStartDay,
) {
  return optionLabel(t, `site_settings.form.week_start_day.${value}`, value);
}

function systemDateFormatLabel(
  t: ReturnType<typeof useTranslations>["t"],
  value: SiteDateFormat,
) {
  return optionLabel(t, `site_settings.form.date_format.${value}`, value);
}

function systemTimeFormatLabel(
  t: ReturnType<typeof useTranslations>["t"],
  value: SiteTimeFormat,
) {
  return optionLabel(t, `site_settings.form.time_format.${value}`, value);
}

function systemSeparatorLabel(
  t: ReturnType<typeof useTranslations>["t"],
  value: SiteDateSeparator,
) {
  return optionLabel(t, DATE_SEPARATOR_LABEL_KEYS[value], value);
}

export function DisplayPreferencesFields({
  values,
  onChange,
  systemDefaults,
  allowSystemDefault = false,
  disabled = false,
  idPrefix = "display",
  includeTimezone = false,
  systemTimezone,
  timezoneLabel,
  timezoneHint,
}: {
  values: UserDisplayPreferences;
  onChange: (values: UserDisplayPreferences) => void;
  systemDefaults: SiteDisplayPreferences;
  allowSystemDefault?: boolean;
  disabled?: boolean;
  idPrefix?: string;
  includeTimezone?: boolean;
  systemTimezone?: string;
  timezoneLabel?: string;
  timezoneHint?: string;
}) {
  const { t } = useTranslations();

  function systemDefaultLabel(current: string) {
    return t("profile.display.system_default", "Sistēmas noklusējums ({value})", {
      value: current,
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${idPrefix}-weekStartDay`} className={labelClassName}>
          {t("site_settings.form.week_start_day", "Nedēļas sākuma diena")}
        </label>
        <select
          id={`${idPrefix}-weekStartDay`}
          disabled={disabled}
          value={values.weekStartDay ?? ""}
          onChange={(event) =>
            onChange({
              ...values,
              weekStartDay: (event.target.value || null) as WeekStartDay | null,
            })
          }
          className={fieldClassName}
        >
          {allowSystemDefault ? (
            <option value="">
              {systemDefaultLabel(systemWeekStartLabel(t, systemDefaults.weekStartDay))}
            </option>
          ) : null}
          {WEEK_START_DAYS.map((value) => (
            <option key={value} value={value}>
              {t(`site_settings.form.week_start_day.${value}`, value)}
            </option>
          ))}
        </select>
        <p className={hintClassName}>
          {t(
            "site_settings.form.week_start_day_hint",
            "Izvēlies, kura diena sākas nedēļa kalendāros.",
          )}
        </p>
      </div>

      <div className="grid items-start gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-dateFormat`} className={labelClassName}>
            {t("site_settings.form.date_format", "Datuma formāts")}
          </label>
          <select
            id={`${idPrefix}-dateFormat`}
            disabled={disabled}
            value={values.dateFormat ?? ""}
            onChange={(event) =>
              onChange({
                ...values,
                dateFormat: (event.target.value || null) as SiteDateFormat | null,
              })
            }
            className={fieldClassName}
          >
            {allowSystemDefault ? (
              <option value="">
                {systemDefaultLabel(systemDateFormatLabel(t, systemDefaults.dateFormat))}
              </option>
            ) : null}
            {DATE_FORMATS.map((value) => (
              <option key={value} value={value}>
                {t(`site_settings.form.date_format.${value}`, value)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${idPrefix}-dateSeparator`} className={labelClassName}>
            {t("site_settings.form.date_separator", "Datuma atdalītājs")}
          </label>
          <select
            id={`${idPrefix}-dateSeparator`}
            disabled={disabled}
            value={values.dateSeparator ?? ""}
            onChange={(event) =>
              onChange({
                ...values,
                dateSeparator: (event.target.value || null) as SiteDateSeparator | null,
              })
            }
            className={fieldClassName}
          >
            {allowSystemDefault ? (
              <option value="">
                {systemDefaultLabel(
                  systemSeparatorLabel(t, systemDefaults.dateSeparator),
                )}
              </option>
            ) : null}
            {DATE_SEPARATORS.map((value) => (
              <option key={value} value={value}>
                {t(DATE_SEPARATOR_LABEL_KEYS[value], value)}
              </option>
            ))}
          </select>
          <p className={hintClassName}>
            {t(
              "site_settings.form.date_separator_hint",
              "Atdalītājs starp datuma daļām attēlojumā.",
            )}
          </p>
        </div>
      </div>

      <div className={`grid items-start gap-5${includeTimezone ? " sm:grid-cols-2" : ""}`}>
        <div>
          <label htmlFor={`${idPrefix}-timeFormat`} className={labelClassName}>
            {t("site_settings.form.time_format", "Laika formāts")}
          </label>
          <select
            id={`${idPrefix}-timeFormat`}
            disabled={disabled}
            value={values.timeFormat ?? ""}
            onChange={(event) =>
              onChange({
                ...values,
                timeFormat: (event.target.value || null) as SiteTimeFormat | null,
              })
            }
            className={fieldClassName}
          >
            {allowSystemDefault ? (
              <option value="">
                {systemDefaultLabel(systemTimeFormatLabel(t, systemDefaults.timeFormat))}
              </option>
            ) : null}
            {TIME_FORMATS.map((value) => (
              <option key={value} value={value}>
                {t(`site_settings.form.time_format.${value}`, value)}
              </option>
            ))}
          </select>
          <p className={hintClassName}>
            {t(
              "site_settings.form.time_format_hint",
              "Izvēlies starp 12 stundu (AM/PM) vai 24 stundu pulksteni.",
            )}
          </p>
        </div>

        {includeTimezone ? (
          <TimezoneSelectField
            id={`${idPrefix}-timezone`}
            label={
              timezoneLabel ??
              t("profile.display.timezone", "Laika josla")
            }
            hint={
              timezoneHint ??
              t(
                "profile.display.timezone_hint",
                "Datumi ar laiku tiks rādīti šajā joslā. Tukšs lauks nozīmē servera laika joslu.",
              )
            }
            value={values.timezone ?? ""}
            onChange={(timezone) =>
              onChange({
                ...values,
                timezone: timezone || null,
              })
            }
            allowSystemDefault={allowSystemDefault}
            systemDefaultValue={systemTimezone}
            disabled={disabled}
          />
        ) : null}
      </div>
    </div>
  );
}
