import { logError } from "@/app/lib/security/log-error";

export function googleDriveContentHref(
  kind: "list" | "task",
  fileId: string,
  options?: { download?: boolean },
): string {
  const params = new URLSearchParams({ kind, id: fileId });
  if (options?.download) params.set("download", "1");
  return `/api/google-drive/content?${params.toString()}`;
}

export async function fetchGoogleDriveContentAsObjectUrl(
  kind: "list" | "task",
  fileId: string,
): Promise<string | null> {
  try {
    const response = await fetch(googleDriveContentHref(kind, fileId), {
      credentials: "include",
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    logError("Failed to load Google Drive file content", error);
    return null;
  }
}

export async function fetchGoogleDriveContentBlob(
  kind: "list" | "task",
  fileId: string,
): Promise<Blob | null> {
  try {
    const response = await fetch(
      googleDriveContentHref(kind, fileId, { download: true }),
      { credentials: "include" },
    );
    if (!response.ok) return null;
    return await response.blob();
  } catch (error) {
    logError("Failed to download Google Drive file content", error);
    return null;
  }
}

export function triggerBrowserDownload(
  url: string,
  filename: string,
  revoke = false,
) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (revoke) {
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }
}

/** Reliable download for data:/blob: URLs (avoids browser data-URL size limits). */
export async function downloadUrlAsFile(url: string, filename: string) {
  if (url.startsWith("data:") || url.startsWith("blob:")) {
    const response = await fetch(url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    triggerBrowserDownload(objectUrl, filename, true);
    return;
  }
  triggerBrowserDownload(url, filename, false);
}
