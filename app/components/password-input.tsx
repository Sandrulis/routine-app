"use client";

import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import { useTranslations } from "@/app/components/translations-provider";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  className?: string;
  inputClassName?: string;
  /** When set, controls whether the value is shown as plain text. */
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
};

export function PasswordInput({
  className,
  inputClassName,
  disabled,
  id,
  visible: visibleProp,
  onVisibleChange,
  value,
  ...props
}: PasswordInputProps) {
  const { t } = useTranslations();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  const controlled = typeof visibleProp === "boolean";
  const visible = controlled ? visibleProp : uncontrolledVisible;

  function setVisible(next: boolean) {
    if (controlled) {
      onVisibleChange?.(next);
      return;
    }
    setUncontrolledVisible(next);
  }

  // Chrome may clear the DOM value when type flips text↔password; restore controlled value.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el || value == null) return;
    const next = String(value);
    if (el.value !== next) {
      el.value = next;
    }
  }, [visible, value]);

  return (
    <div className={`relative ${className ?? ""}`.trim()}>
      <input
        {...props}
        ref={inputRef}
        id={inputId}
        type={visible ? "text" : "password"}
        value={value}
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
        onClick={() => setVisible(!visible)}
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
