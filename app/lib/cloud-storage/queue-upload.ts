"use client";

import {
  driveFileIdFromUpload,
  googleDriveUploadFailure,
  uploadGoogleDriveFile,
} from "@/app/lib/google-drive/queue-upload";
import {
  oneDriveFileIdFromUpload,
  oneDriveUploadFailure,
  uploadOneDriveFile,
} from "@/app/lib/onedrive/queue-upload";
import { filesRequireCloudErrorKey } from "@/app/lib/cloud-storage/message-key";

export type TeamCloudUploadResult =
  | {
      ok: true;
      googleDriveFileId: string | null;
      oneDriveFileId: string | null;
    }
  | {
      ok: false;
      error: string;
    };

/** Upload to every connected team cloud. At least one file id is required. */
export async function uploadFileToTeamCloud(input: {
  teamId: string | null | undefined;
  listId: string;
  file: File;
  pathParts: string[];
  googleDriveReady: boolean;
  oneDriveReady: boolean;
  googleDriveModule?: boolean;
  oneDriveModule?: boolean;
  onProgress?: (percent: number) => void;
}): Promise<TeamCloudUploadResult> {
  const requireKey = filesRequireCloudErrorKey({
    googleDrive: input.googleDriveModule ?? input.googleDriveReady,
    oneDrive: input.oneDriveModule ?? input.oneDriveReady,
  });
  if (!input.googleDriveReady && !input.oneDriveReady) {
    return { ok: false, error: requireKey };
  }

  let googleDriveFileId: string | null = null;
  let oneDriveFileId: string | null = null;
  let lastError: string | null = null;

  if (input.googleDriveReady) {
    const driveResult = await uploadGoogleDriveFile({
      teamId: input.teamId,
      listId: input.listId,
      file: input.file,
      pathParts: input.pathParts,
      onProgress: input.onProgress,
    });
    googleDriveFileId = driveFileIdFromUpload(driveResult);
    if (!googleDriveFileId) {
      lastError = googleDriveUploadFailure(driveResult);
    }
  }

  if (input.oneDriveReady) {
    const oneDriveResult = await uploadOneDriveFile({
      teamId: input.teamId,
      listId: input.listId,
      file: input.file,
      pathParts: input.pathParts,
      onProgress: input.googleDriveReady ? undefined : input.onProgress,
    });
    oneDriveFileId = oneDriveFileIdFromUpload(oneDriveResult);
    if (!oneDriveFileId) {
      lastError = oneDriveUploadFailure(oneDriveResult);
    }
  }

  if (!googleDriveFileId && !oneDriveFileId) {
    return { ok: false, error: lastError || requireKey };
  }

  return { ok: true, googleDriveFileId, oneDriveFileId };
}
