import { logError } from "@/app/lib/security/log-error";

export function oneDriveContentHref(
  kind: "list" | "task",
  fileId: string,
  options?: { download?: boolean },
): string {
  const params = new URLSearchParams({ kind, id: fileId });
  if (options?.download) params.set("download", "1");
  return `/api/onedrive/content?${params.toString()}`;
}

export async function fetchOneDriveContentAsObjectUrl(
  kind: "list" | "task",
  fileId: string,
  options?: { mimeType?: string; download?: boolean },
): Promise<string | null> {
  try {
    const response = await fetch(
      oneDriveContentHref(kind, fileId, { download: options?.download }),
      { credentials: "include" },
    );
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) return null;
    const blob = await response.blob();
    if (blob.type.includes("json") && blob.size < 8_192) return null;
    const preferredMime = options?.mimeType?.trim() || "";
    const headerMime = contentType.split(";")[0]?.trim() || "";
    const resolvedMime =
      preferredMime ||
      (blob.type && blob.type !== "application/octet-stream" ? blob.type : "") ||
      headerMime ||
      "application/octet-stream";
    const typed =
      blob.type === resolvedMime
        ? blob
        : new Blob([blob], { type: resolvedMime });
    return URL.createObjectURL(typed);
  } catch (error) {
    logError("Failed to load OneDrive file content", error);
    return null;
  }
}

export async function fetchOneDriveContentBlob(
  kind: "list" | "task",
  fileId: string,
): Promise<Blob | null> {
  try {
    const response = await fetch(
      oneDriveContentHref(kind, fileId, { download: true }),
      { credentials: "include" },
    );
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    logError("Failed to download OneDrive file content", error);
    return null;
  }
}
