"use client";

/* eslint-disable @next/next/no-img-element */

import { useState } from "react";
import type { TeamMember } from "@/app/lib/team";

export function UserAvatar({
  member,
  size = "md",
}: {
  member: TeamMember;
  size?: "xs" | "sm" | "md";
}) {
  const [imgError, setImgError] = useState(false);
  const sizeClassName =
    size === "xs"
      ? "h-5 w-5 text-[9px]"
      : size === "sm"
        ? "h-7 w-7 text-[10px]"
        : "h-8 w-8 text-xs";
  const pixels = size === "xs" ? 20 : size === "sm" ? 28 : 32;
  const avatarUrl = member.avatarUrl?.trim() || null;

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt=""
        width={pixels}
        height={pixels}
        referrerPolicy="no-referrer"
        className={`inline-flex shrink-0 rounded-full object-cover ${sizeClassName}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClassName} ${member.toneClassName}`}
      aria-hidden="true"
    >
      {member.initials}
    </span>
  );
}
