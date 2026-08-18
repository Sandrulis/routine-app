"use client";

import { Tooltip } from "@/app/components/tooltip";

type IconActionButtonProps = {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: "edit" | "delete";
  disabled?: boolean;
};

const variantClassName = {
  edit: "text-zinc-400 hover:bg-sky-50 hover:text-sky-600",
  delete: "text-zinc-400 hover:bg-red-50 hover:text-red-600",
};

export function IconActionButton({
  label,
  icon,
  onClick,
  variant = "edit",
  disabled = false,
}: IconActionButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40 ${variantClassName[variant]}`}
      >
        <i className={`${icon} text-sm`} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
