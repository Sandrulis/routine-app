"use client";

import { useTranslations } from "@/app/components/translations-provider";
import {
  formatTimezoneOptionLabel,
  timezoneSelectOptions,
} from "@/app/lib/timezones";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";
const hintClassName = "mt-1.5 text-xs text-zinc-500";

export function TimezoneSelectField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled = false,
  allowSystemDefault = false,
  systemDefaultValue,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowSystemDefault?: boolean;
  systemDefaultValue?: string;
}) {
  const { t } = useTranslations();
  const options = timezoneSelectOptions(value, [systemDefaultValue]);

  return (
    <div>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <select
        id={id}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClassName}
      >
        {allowSystemDefault ? (
          <option value="">
            {t("profile.display.system_default", "Sistēmas noklusējums ({value})", {
              value: systemDefaultValue
                ? formatTimezoneOptionLabel(systemDefaultValue)
                : "—",
            })}
          </option>
        ) : null}
        {options.map((timeZone) => (
          <option key={timeZone} value={timeZone}>
            {formatTimezoneOptionLabel(timeZone)}
          </option>
        ))}
      </select>
      {hint ? <p className={hintClassName}>{hint}</p> : null}
    </div>
  );
}
