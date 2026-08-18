import { listColorById, listInitials } from "@/app/lib/lists";

export function ListBadge({
  name,
  icon,
  color,
  logoUrl,
  isPrivate = false,
  size = "sm",
}: {
  name: string;
  icon: string | null;
  color: string;
  logoUrl?: string | null;
  isPrivate?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const tone = listColorById(color);
  const initials = listInitials(name);
  const sizeClassName =
    size === "lg"
      ? "size-11 rounded-xl text-sm"
      : size === "md"
        ? "size-8 rounded-lg text-xs"
        : "size-5 rounded-[2.5px] text-[9px]";

  return (
    <span className="relative inline-flex shrink-0">
      <span
        className={`inline-flex items-center justify-center overflow-hidden font-semibold ${sizeClassName}`}
        style={{ backgroundColor: tone.bg, color: tone.fg }}
        aria-hidden="true"
      >
        {logoUrl ? (
          <img src={logoUrl} alt="" className="size-full object-cover" />
        ) : icon ? (
          <i
            className={`${icon} ${
              size === "lg" ? "text-base" : size === "md" ? "text-sm" : "text-[10px]"
            }`}
          />
        ) : (
          initials
        )}
      </span>
      {isPrivate ? (
        <span
          className={`absolute -right-1.5 -bottom-1.5 inline-flex items-center justify-center rounded-full border-2 border-white bg-amber-400 text-zinc-900 shadow-sm ${
            size === "lg"
              ? "size-5 text-[10px]"
              : size === "md"
                ? "size-4.5 text-[9px]"
                : "size-4 text-[8px]"
          }`}
          aria-label="Private list"
          title="Private list"
        >
          <i className="fas fa-user-lock" aria-hidden="true" />
        </span>
      ) : null}
    </span>
  );
}
