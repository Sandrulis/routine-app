import type { FileTypeExtensionSummary } from "@/app/lib/site-admin/types";

export const DEFAULT_FILE_TYPE_EXTENSIONS: FileTypeExtensionSummary[] = [
  {
    extension: "pdf",
    mimeType: "application/pdf",
    icon: "fas fa-file-pdf",
    color: "#f43f5e",
    sortOrder: 0,
  },
  {
    extension: "dwg",
    mimeType: "application/acad",
    icon: "fas fa-compass-drafting",
    color: "#6366f1",
    sortOrder: 1,
  },
  {
    extension: "doc",
    mimeType: "application/msword",
    icon: "fas fa-file-word",
    color: "#0284c7",
    sortOrder: 2,
  },
  {
    extension: "docx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    icon: "fas fa-file-word",
    color: "#0284c7",
    sortOrder: 3,
  },
  {
    extension: "xls",
    mimeType: "application/vnd.ms-excel",
    icon: "fas fa-file-excel",
    color: "#059669",
    sortOrder: 4,
  },
  {
    extension: "xlsx",
    mimeType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    icon: "fas fa-file-excel",
    color: "#059669",
    sortOrder: 5,
  },
];

const EXTENSION_RE = /^[a-z0-9]+$/;
const FA_ICON_RE = /^fa[sbrld]?\s+fa-[a-z0-9-]+$/i;
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

let activeCatalog: FileTypeExtensionSummary[] = DEFAULT_FILE_TYPE_EXTENSIONS;

export function setFileTypesCatalog(catalog: FileTypeExtensionSummary[]) {
  activeCatalog =
    catalog.length > 0 ? catalog : DEFAULT_FILE_TYPE_EXTENSIONS;
}

export function getFileTypesCatalog(): FileTypeExtensionSummary[] {
  return activeCatalog;
}

export function normalizeFileExtension(value: string): string {
  return value.trim().replace(/^\./, "").toLowerCase();
}

export function fileExtensionFromName(name: string): string {
  const parts = name.trim().split(".");
  if (parts.length < 2) return "";
  return normalizeFileExtension(parts.at(-1) ?? "");
}

export function findFileTypeExtension(
  name: string,
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): FileTypeExtensionSummary | null {
  const extension = fileExtensionFromName(name);
  if (!extension) return null;
  return catalog.find((entry) => entry.extension === extension) ?? null;
}

export function isAllowedFileName(
  name: string,
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): boolean {
  return findFileTypeExtension(name, catalog) !== null;
}

export function mimeFromFileName(
  name: string,
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): string {
  return findFileTypeExtension(name, catalog)?.mimeType ?? "application/octet-stream";
}

export function getFileIconDisplay(
  name: string,
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): { icon: string; color: string } {
  const match = findFileTypeExtension(name, catalog);
  if (match) {
    return { icon: match.icon, color: match.color };
  }
  return { icon: "fas fa-file", color: "#a1a1aa" };
}

export function fileAcceptAttribute(
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): string {
  const extensions = catalog.map((entry) => `.${entry.extension}`);
  const mimeTypes = [...new Set(catalog.map((entry) => entry.mimeType))];
  return [...extensions, ...mimeTypes].join(",");
}

export function filterAllowedFiles(
  files: File[],
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): { allowed: File[]; rejected: string[] } {
  const allowed: File[] = [];
  const rejected: string[] = [];
  for (const file of files) {
    if (isAllowedFileName(file.name, catalog)) {
      allowed.push(file);
    } else {
      rejected.push(file.name);
    }
  }
  return { allowed, rejected };
}

export function isValidFileExtensionInput(extension: string): boolean {
  const normalized = normalizeFileExtension(extension);
  return normalized.length > 0 && normalized.length <= 16 && EXTENSION_RE.test(normalized);
}

export function isValidFileIconInput(icon: string): boolean {
  const trimmed = icon.trim();
  return trimmed.length > 0 && FA_ICON_RE.test(trimmed);
}

export function isValidFileColorInput(color: string): boolean {
  return HEX_COLOR_RE.test(color.trim());
}

export function allowedExtensionsLabel(
  catalog: FileTypeExtensionSummary[] = getFileTypesCatalog(),
): string {
  return catalog.map((entry) => `.${entry.extension}`).join(", ");
}
