import { MAX_STORED_FILE_BYTES } from "@/app/lib/list-files";
import { listColorById, listInitials } from "@/app/lib/lists";

export const DEFAULT_SITE_LOGO_COLOR = "black";

export function isBrandImageUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("data:image/");
}

export function normalizeBrandImageUrl(value: unknown): string | null {
  return isBrandImageUrl(value) ? value : null;
}

export function normalizeSiteLogoColor(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return DEFAULT_SITE_LOGO_COLOR;
  return listColorById(value.trim()).id;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function siteInitialsFaviconDataUrl(name: string, color: string): string {
  const tone = listColorById(color);
  const initials = escapeXml(listInitials(name.trim() || "Routine"));
  const fontSize = initials.length > 1 ? 18 : 24;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="${tone.bg}"/><text x="16" y="16" dy="0.38em" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="${fontSize}" font-weight="800" fill="${tone.fg}">${initials}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function siteHeadIconUrl(
  logoUrl: string | null,
  faviconUrl: string | null,
  systemName = "",
  logoColor = DEFAULT_SITE_LOGO_COLOR,
): string {
  return faviconUrl || logoUrl || siteInitialsFaviconDataUrl(systemName, logoColor);
}

export function brandImageMime(url: string): string {
  const match = /^data:(image\/[^;]+)/.exec(url);
  return match?.[1] ?? "image/png";
}

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  const name = file.name.toLowerCase();
  return [".ico", ".png", ".svg", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) =>
    name.endsWith(ext),
  );
}

function normalizeDataUrl(file: File, result: string): string | null {
  if (result.startsWith("data:image/")) return result;
  if (file.name.toLowerCase().endsWith(".ico") && result.startsWith("data:")) {
    return result.replace(/^data:[^;]*/, "data:image/x-icon");
  }
  return null;
}

export async function readBrandImageUrl(file: File): Promise<string | null> {
  if (!isLikelyImageFile(file) || file.size <= 0 || file.size > MAX_STORED_FILE_BYTES) {
    return null;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === "string" ? normalizeDataUrl(file, reader.result) : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
