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
  {
    extension: "png",
    mimeType: "image/png",
    icon: "fas fa-file-image",
    color: "#0ea5e8",
    sortOrder: 6,
  },
  {
    extension: "jpg",
    mimeType: "image/jpeg",
    icon: "fas fa-file-image",
    color: "#0ea5e8",
    sortOrder: 7,
  },
  {
    extension: "jpeg",
    mimeType: "image/jpeg",
    icon: "fas fa-file-image",
    color: "#0ea5e8",
    sortOrder: 8,
  },
  {
    extension: "gif",
    mimeType: "image/gif",
    icon: "fas fa-file-image",
    color: "#0ea5e8",
    sortOrder: 9,
  },
  {
    extension: "webp",
    mimeType: "image/webp",
    icon: "fas fa-file-image",
    color: "#0ea5e8",
    sortOrder: 10,
  },
  {
    extension: "txt",
    mimeType: "text/plain",
    icon: "fas fa-file-lines",
    color: "#64748b",
    sortOrder: 11,
  },
  {
    extension: "html",
    mimeType: "text/html",
    icon: "fas fa-file-code",
    color: "#ea580c",
    sortOrder: 12,
  },
  {
    extension: "zip",
    mimeType: "application/zip",
    icon: "fas fa-file-zipper",
    color: "#a855f7",
    sortOrder: 13,
  },
  {
    extension: "rar",
    mimeType: "application/vnd.rar",
    icon: "fas fa-file-zipper",
    color: "#9333ea",
    sortOrder: 14,
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

/** Name without the last extension segment (`report.final.pdf` → `report.final`). */
export function fileBaseName(name: string): string {
  const trimmed = name.trim();
  const extension = fileExtensionFromName(trimmed);
  if (!extension) return trimmed;
  return trimmed.slice(0, -(extension.length + 1));
}

/**
 * Rename while keeping the original extension.
 * User-provided extensions in `nextName` are ignored when the original had one.
 */
export function renameKeepingExtension(
  originalName: string,
  nextName: string,
): string {
  const original = originalName.trim() || "file";
  const extension = fileExtensionFromName(original);
  let base = nextName.trim();
  if (extension) {
    // Strip trailing `.ext` repeats (e.g. `report.pdf` or `report.pdf.pdf` in the base field).
    while (fileExtensionFromName(base) === extension) {
      const without = fileBaseName(base);
      if (without === base) break;
      base = without;
    }
    if (fileExtensionFromName(base)) {
      base = fileBaseName(base);
    }
    if (!base) base = fileBaseName(original) || "file";
    return `${base}.${extension}`;
  }
  return base || original;
}

/** Images, PDF, HTML and plain text can open in the in-app preview modal. */
export function isBrowserPreviewableFile(name: string, mimeType = ""): boolean {
  const mime = mimeType.trim().toLowerCase();
  if (
    mime.startsWith("image/") ||
    mime === "application/pdf" ||
    mime.startsWith("application/pdf") ||
    mime.startsWith("text/")
  ) {
    return true;
  }
  const extension = fileExtensionFromName(name);
  return (
    extension === "pdf" ||
    extension === "png" ||
    extension === "jpg" ||
    extension === "jpeg" ||
    extension === "gif" ||
    extension === "webp" ||
    extension === "svg" ||
    extension === "txt" ||
    extension === "html" ||
    extension === "htm" ||
    extension === "csv" ||
    extension === "md" ||
    extension === "log" ||
    extension === "json"
  );
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
