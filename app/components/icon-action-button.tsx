"use client";

import { Tooltip } from "@/app/components/tooltip";

type IconActionButtonProps = {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "edit" | "delete" | "muted";
  disabled?: boolean;
  pressed?: boolean;
};

const variantClassName = {
  edit: "text-zinc-400 hover:bg-sky-50 hover:text-sky-600",
  delete: "text-zinc-400 hover:bg-red-50 hover:text-red-600",
  muted: "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700",
};

export function IconActionButton({
  label,
  icon,
  onClick,
  variant = "edit",
  disabled = false,
  pressed = false,
}: IconActionButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
        disabled={disabled}
        aria-label={label}
        aria-pressed={pressed}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${
          pressed ? "bg-zinc-100 text-zinc-800" : variantClassName[variant]
        }`}
      >
        <i className={`${icon} text-sm`} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
