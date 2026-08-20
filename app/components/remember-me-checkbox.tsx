"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  readRememberSessionPreference,
  writeRememberSessionPreference,
} from "@/app/lib/auth/remember-session";

export function RememberMeCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslations();

  return (
    <label className="flex items-center gap-3 text-sm text-zinc-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-4 rounded border-zinc-300"
      />
      <span>{t("auth.login.remember", "Atcerēties mani")}</span>
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
