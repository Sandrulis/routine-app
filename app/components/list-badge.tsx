import { listColorById, listInitials } from "@/app/lib/lists";

export function ListBadge({
  name,
  icon,
  color,
  logoUrl,
  size = "sm",
}: {
  name: string;
  icon: string | null;
  color: string;
  logoUrl?: string | null;
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
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold ${sizeClassName}`}
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
  );
}
