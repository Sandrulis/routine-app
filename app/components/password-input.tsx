"use client";

import { useId, useState, type InputHTMLAttributes } from "react";
import { useTranslations } from "@/app/components/translations-provider";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  className?: string;
  inputClassName?: string;
};

export function PasswordInput({
  className,
  inputClassName,
  disabled,
  id,
  ...props
}: PasswordInputProps) {
  const { t } = useTranslations();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className={`relative ${className ?? ""}`.trim()}>
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        disabled={disabled}
        className={`${inputClassName ?? ""} pr-11`.trim()}
      />
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label={
          visible
            ? t("auth.fields.password_hide", "Paslēpt paroli")
            : t("auth.fields.password_show", "Rādīt paroli")
        }
        aria-pressed={visible}
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-xl text-zinc-500 transition hover:bg-zinc-200/70 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <i
          className={`fas ${visible ? "fa-eye-slash" : "fa-eye"} text-[13px]`}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
