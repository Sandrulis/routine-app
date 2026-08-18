"use client";

type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  className?: string;
};

export function ToggleSwitch({
  checked,
  disabled,
  label,
  onChange,
  className = "",
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      } ${className}`.trim()}
    >
      <span
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
