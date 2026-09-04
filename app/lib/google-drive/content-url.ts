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
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  if (revoke) {
    window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
  }
}

function looksLikeJsonErrorBlob(blob: Blob) {
  return blob.type.includes("json") && blob.size < 8_192;
}

/** Fetch the file with the session, then save as a blob (works on mobile). */
export async function downloadUrlAsFile(url: string, filename: string) {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error("download failed");
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    throw new Error("download failed");
  }
  const blob = await response.blob();
  if (looksLikeJsonErrorBlob(blob)) {
    throw new Error("download failed");
  }

  const typed =
    blob.type && blob.type !== "application/octet-stream"
      ? blob
      : new Blob([blob], { type: blob.type || "application/octet-stream" });

  const nav = window.navigator as Navigator & {
    msSaveOrOpenBlob?: (data: Blob, name: string) => void;
  };
  if (typeof nav.msSaveOrOpenBlob === "function") {
    nav.msSaveOrOpenBlob(typed, filename);
    return;
  }

  const objectUrl = URL.createObjectURL(typed);
  triggerBrowserDownload(objectUrl, filename, true);
}
