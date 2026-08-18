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
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (disabled) return;
        onChange(!checked);
      }}
      className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 outline-none transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-blue-400 ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      } ${className}`.trim()}
    >
      <span
        className={`block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
