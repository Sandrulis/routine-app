"use client";

import { getFileIconDisplay } from "@/app/lib/file-types";

export function FileIcon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const { icon, color } = getFileIconDisplay(name);
  return (
    <i
      className={`${icon} ${className}`.trim()}
      style={{ color }}
      aria-hidden="true"
    />
  );
}
