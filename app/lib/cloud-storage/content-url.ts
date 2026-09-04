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
