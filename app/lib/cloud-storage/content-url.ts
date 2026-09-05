import { googleDriveContentHref } from "@/app/lib/google-drive/content-url";
import { oneDriveContentHref } from "@/app/lib/onedrive/content-url";

export function cloudFileDownloadHref(input: {
  kind: "list" | "task";
  id: string;
  googleDriveFileId?: string | null;
  oneDriveFileId?: string | null;
}): string | null {
  if (input.googleDriveFileId) {
    return googleDriveContentHref(input.kind, input.id, { download: true });
  }
  if (input.oneDriveFileId) {
    return oneDriveContentHref(input.kind, input.id, { download: true });
  }
  return null;
}

/** Unified list/task file bytes (DB → Drive → OneDrive). Safe for client components. */
export function workFileContentHref(
  kind: "list" | "task",
  fileId: string,
  options?: { download?: boolean },
): string {
  const params = new URLSearchParams({ kind, id: fileId });
  if (options?.download) params.set("download", "1");
  return `/api/work-files/content?${params.toString()}`;
}
