import { fileExtensionFromName } from "@/app/lib/file-types";

const UNSAFE_INLINE_EXTENSIONS = new Set(["html", "htm", "svg", "xml", "xhtml"]);

type MagicMatch = { mime: string; bytes: number[][] };

const MAGIC: MagicMatch[] = [
  { mime: "image/png", bytes: [[0x89, 0x50, 0x4e, 0x47]] },
  { mime: "image/jpeg", bytes: [[0xff, 0xd8, 0xff]] },
  { mime: "image/gif", bytes: [[0x47, 0x49, 0x46, 0x38]] },
  { mime: "image/webp", bytes: [[0x52, 0x49, 0x46, 0x46]] },
  { mime: "application/pdf", bytes: [[0x25, 0x50, 0x44, 0x46]] },
  { mime: "application/zip", bytes: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]] },
  // RAR 1.5+ / RAR 5 signature "Rar!"
  { mime: "application/vnd.rar", bytes: [[0x52, 0x61, 0x72, 0x21, 0x1a, 0x07]] },
];

function startsWith(bytes: Uint8Array, signature: number[]) {
  if (bytes.length < signature.length) return false;
  return signature.every((value, index) => bytes[index] === value);
}

export function sniffMimeType(bytes: Uint8Array): string | null {
  for (const entry of MAGIC) {
    if (entry.bytes.some((signature) => startsWith(bytes, signature))) {
      if (entry.mime === "image/webp" && bytes.length >= 12) {
        const tag = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
        if (tag !== "WEBP") continue;
      }
      return entry.mime;
    }
  }
  return null;
}

export function looksLikeHtml(bytes: Uint8Array): boolean {
  const head = new TextDecoder("utf-8", { fatal: false })
    .decode(bytes.subarray(0, 256))
    .trimStart()
    .toLowerCase();
  return (
    head.startsWith("<!doctype html") ||
    head.startsWith("<html") ||
    head.startsWith("<svg") ||
    head.includes("<script")
  );
}

export function fileExtensionOf(name: string) {
  return fileExtensionFromName(name);
}

export function isUnsafeInlineFile(name: string, mimeType: string) {
  const extension = fileExtensionOf(name);
  const mime = mimeType.toLowerCase();
  return (
    UNSAFE_INLINE_EXTENSIONS.has(extension) ||
    mime.includes("html") ||
    mime === "image/svg+xml" ||
    mime === "text/xml" ||
    mime === "application/xhtml+xml"
  );
}

function rfc5987Encode(value: string) {
  return encodeURIComponent(value).replace(/['()*]/g, (char) => {
    const hex = char.charCodeAt(0).toString(16).toUpperCase();
    return `%${hex.padStart(2, "0")}`;
  });
}

function asciiFileNameFallback(name: string) {
  const cleaned = name.replace(/["\\\r\n]/g, " ").trim() || "file";
  const ascii = Array.from(cleaned, (char) =>
    char.charCodeAt(0) <= 0x7e && char.charCodeAt(0) >= 0x20 ? char : "_",
  ).join("");
  return ascii.replace(/_+/g, "_").replace(/^_+|_+$/g, "") || "file";
}

export function contentDispositionForFile(name: string, mimeType: string, asDownload: boolean) {
  const utf8Name = name.replace(/[\r\n]/g, "").trim() || "file";
  const fallback = asciiFileNameFallback(utf8Name);
  const kind =
    asDownload || isUnsafeInlineFile(name, mimeType) ? "attachment" : "inline";
  // Header values must be Latin-1. Non-ASCII names (ē, ķ, …) throw in fetch/undici.
  return `${kind}; filename="${fallback}"; filename*=UTF-8''${rfc5987Encode(utf8Name)}`;
}

/** Reject executable disguises: claimed image/pdf must match magic bytes. */
export function mimeMatchesBytes(name: string, claimedMime: string, bytes: Uint8Array) {
  const sniffed = sniffMimeType(bytes);
  const claimed = claimedMime.toLowerCase();
  if (claimed.startsWith("image/") && claimed !== "image/svg+xml") {
    return sniffed !== null && sniffed.startsWith("image/");
  }
  if (claimed === "application/pdf") {
    return sniffed === "application/pdf";
  }
  if (
    claimed === "application/zip" ||
    claimed === "application/x-zip-compressed" ||
    fileExtensionOf(name) === "zip"
  ) {
    return sniffed === "application/zip" || bytes.length === 0;
  }
  if (
    claimed === "application/vnd.rar" ||
    claimed === "application/x-rar-compressed" ||
    fileExtensionOf(name) === "rar"
  ) {
    return sniffed === "application/vnd.rar" || bytes.length === 0;
  }
  if (fileExtensionOf(name) === "pdf") {
    return sniffed === "application/pdf" || bytes.length === 0;
  }
  if (["html", "htm", "txt"].includes(fileExtensionOf(name))) {
    return !sniffed || sniffed === "application/zip";
  }
  return true;
}
