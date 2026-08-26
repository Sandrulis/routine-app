"use client";

import { useTranslations } from "@/app/components/translations-provider";
import {
  getPasswordStrength,
  type PasswordStrengthLevel,
} from "@/app/lib/auth/password-strength";

const LEVEL_KEYS: Record<
  Exclude<PasswordStrengthLevel, "empty">,
  { key: string; fallback: string }
> = {
  very_weak: {
    key: "auth.password.very_weak",
    fallback: "Ļoti vāja",
  },
  weak: { key: "auth.password.weak", fallback: "Vāja" },
  fair: { key: "auth.password.fair", fallback: "Vidēja" },
  good: { key: "auth.password.good", fallback: "Laba" },
  strong: { key: "auth.password.strong", fallback: "Stipra" },
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  const { t } = useTranslations();
  const strength = getPasswordStrength(password);
  const label =
    strength.level === "empty"
      ? t("auth.password.strength", "Paroles stiprums")
      : t(LEVEL_KEYS[strength.level].key, LEVEL_KEYS[strength.level].fallback);

  return (
    <div className="mt-2" aria-live="polite">
      <div className="h-1 w-full overflow-hidden rounded-sm bg-zinc-200">
        <div
          className="h-full rounded-sm transition-all duration-300 ease-out"
          style={{
            width: `${strength.percent}%`,
            backgroundColor: strength.color,
          }}
        />
      </div>
      <p
        className="mt-1 text-xs font-medium"
        style={{ color: strength.level === "empty" ? "#64748b" : strength.color }}
      >
        {label}
      </p>
    </div>
  );
}
