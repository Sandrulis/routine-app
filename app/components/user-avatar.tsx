import type { TeamMember } from "@/app/lib/team";

export function UserAvatar({
  member,
  size = "md",
}: {
  member: TeamMember;
  size?: "xs" | "sm" | "md";
}) {
  const sizeClassName =
    size === "xs"
      ? "h-5 w-5 text-[9px]"
      : size === "sm"
        ? "h-7 w-7 text-[10px]"
        : "h-8 w-8 text-xs";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClassName} ${member.toneClassName}`}
      aria-hidden="true"
    >
      {member.initials}
    </span>
  );
}
