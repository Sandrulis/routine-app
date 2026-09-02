"use client";

import { useEffect, useState } from "react";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  readRememberSessionPreference,
  writeRememberSessionPreference,
} from "@/app/lib/auth/remember-session";

export function RememberMeCheckbox({
  checked,
  onChange,
  className = "",
  tooltipOnly = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  className?: string;
  /** Checkbox only; label shown via Tooltip on hover. */
  tooltipOnly?: boolean;
}) {
  const { t } = useTranslations();
  const label = t("auth.login.remember", "Atcerēties mani");

  const input = (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      aria-label={label}
      className="size-4 shrink-0 rounded border-zinc-300"
    />
  );

  if (tooltipOnly) {
    return (
      <Tooltip label={label} className={`inline-flex shrink-0 ${className}`.trim()}>
        <label className="inline-flex cursor-pointer items-center">{input}</label>
      </Tooltip>
    );
  }

  return (
    <label
      className={`flex items-center gap-2 text-sm leading-tight text-zinc-600 ${className}`.trim()}
    >
      {input}
      <span>{label}</span>
    </label>
  );
}

export function useRememberMe() {
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    setRemember(readRememberSessionPreference());
  }, []);

  function updateRemember(value: boolean) {
    setRemember(value);
    writeRememberSessionPreference(value);
  }

  return { remember, updateRemember };
}
