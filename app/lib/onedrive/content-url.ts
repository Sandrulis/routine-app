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
): Promise<string | null> {
  try {
    const response = await fetch(oneDriveContentHref(kind, fileId), {
      credentials: "include",
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
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
