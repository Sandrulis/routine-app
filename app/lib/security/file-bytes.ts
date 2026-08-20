const UNSAFE_INLINE_EXTENSIONS = new Set(["html", "htm", "svg", "xml", "xhtml"]);

type MagicMatch = { mime: string; bytes: number[][] };

const MAGIC: MagicMatch[] = [
  { mime: "image/png", bytes: [[0x89, 0x50, 0x4e, 0x47]] },
  { mime: "image/jpeg", bytes: [[0xff, 0xd8, 0xff]] },
  { mime: "image/gif", bytes: [[0x47, 0x49, 0x46, 0x38]] },
  { mime: "image/webp", bytes: [[0x52, 0x49, 0x46, 0x46]] },
  { mime: "application/pdf", bytes: [[0x25, 0x50, 0x44, 0x46]] },
  { mime: "application/zip", bytes: [[0x50, 0x4b, 0x03, 0x04], [0x50, 0x4b, 0x05, 0x06]] },
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
  const trimmed = name.trim().toLowerCase();
  const dot = trimmed.lastIndexOf(".");
  if (dot < 0 || dot === trimmed.length - 1) return "";
  return trimmed.slice(dot + 1);
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

export function contentDispositionForFile(name: string, mimeType: string, asDownload: boolean) {
  const safeName = name.replace(/["\r\n]/g, "");
  if (asDownload || isUnsafeInlineFile(name, mimeType)) {
    return `attachment; filename="${safeName}"`;
  }
  return `inline; filename="${safeName}"`;
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
  if (fileExtensionOf(name) === "pdf") {
    return sniffed === "application/pdf" || bytes.length === 0;
  }
  if (["html", "htm", "txt"].includes(fileExtensionOf(name))) {
    return !sniffed || sniffed === "application/zip";
  }
  return true;
}
