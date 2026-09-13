"use client";

type ToggleSwitchProps = {
  checked: boolean;
  disabled?: boolean;
  busy?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  className?: string;
  size?: "md" | "sm";
};

export function ToggleSwitch({
  checked,
  disabled,
  busy = false,
  label,
  onChange,
  className = "",
  size = "md",
}: ToggleSwitchProps) {
  const inactive = disabled || busy;
  const compact = size === "sm";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-busy={busy}
      aria-label={label}
      disabled={inactive}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (inactive) return;
        onChange(!checked);
      }}
      className={`inline-flex shrink-0 items-center rounded-full outline-none transition disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-blue-400 ${
        compact ? "h-3 w-[22px] p-px" : "h-6 w-11 p-0.5"
      } ${busy ? "animate-pulse" : "disabled:opacity-60"} ${
        checked ? "bg-zinc-900" : "bg-zinc-200"
      } ${className}`.trim()}
    >
      <span
        className={`rounded-full bg-white shadow-sm transition-transform duration-200 ${
          compact ? "size-2.5" : "flex size-5 items-center justify-center"
        } ${
          compact
            ? checked
              ? "translate-x-[10px]"
              : "translate-x-0"
            : checked
              ? "translate-x-5"
              : "translate-x-0"
        }`}
      >
        {busy && !compact ? (
          <i
            className="fas fa-circle-notch fa-spin text-[10px] text-zinc-500"
            aria-hidden="true"
          />
        ) : null}
      </span>
    </button>
  );
}
