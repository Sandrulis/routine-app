export const DOCS_IMAGE_MAX_BYTES = 1_500_000;
export const DOCS_IMAGE_MAX_PER_ARTICLE = 20;
export const DOCS_IMAGE_PATH_PREFIX = "/api/docs/images/";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

export function isDocsImageId(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function docsImageSrc(id: string): string {
  return `${DOCS_IMAGE_PATH_PREFIX}${id}`;
}

export function docsImagePreviewSrc(id: string): string {
  return `${docsImageSrc(id)}?preview=1`;
}

export function docsImageIdFromSrc(src: string): string | null {
  const trimmed = src.trim();
  if (!trimmed.startsWith(DOCS_IMAGE_PATH_PREFIX)) return null;
  const id = trimmed.slice(DOCS_IMAGE_PATH_PREFIX.length).split(/[?#]/)[0];
  return isDocsImageId(id) ? id : null;
}

export function sanitizeDocsImageFileName(name: string): string {
  const base = name.replace(/\\/g, "/").split("/").pop()?.trim() || "image";
  return base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 200) || "image";
}

export function docsImageAlt(fileName: string): string {
  return sanitizeDocsImageFileName(fileName).replace(/\.[^.]+$/, "") || "image";
}

export function docsImageMarkdown(id: string, fileName: string): string {
  return `![${docsImageAlt(fileName)}](${docsImageSrc(id)})`;
}

export function isAllowedDocsImageMime(mime: string): mime is
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "image/webp" {
  return ALLOWED_MIME.has(mime);
}

export function stripDocsImageMarkdown(content: string, imageId: string): string {
  const src = docsImageSrc(imageId).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content
    .replace(new RegExp(`!\\[[^\\]]*\\]\\(${src}\\)`, "g"), "")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}
