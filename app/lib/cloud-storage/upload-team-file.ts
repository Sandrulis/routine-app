import { filesRequireCloudErrorKey } from "@/app/lib/cloud-storage/message-key";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { uploadTeamFileToGoogleDrive } from "@/app/lib/google-drive/uploader";
import { logError } from "@/app/lib/security/log-error";
import { uploadTeamFileToOneDrive } from "@/app/lib/onedrive/uploader";

export async function uploadTeamFileToConnectedClouds(input: {
  teamId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  pathParts: string[];
}): Promise<{
  googleDriveFileId: string | null;
  oneDriveFileId: string | null;
  missingError: string;
}> {
  const [driveEnabled, onedriveEnabled, filesEnabled] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.onedrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  const missingError = filesRequireCloudErrorKey({
    googleDrive: filesEnabled && driveEnabled,
    oneDrive: filesEnabled && onedriveEnabled,
  });

  let googleDriveFileId: string | null = null;
  let oneDriveFileId: string | null = null;

  if (filesEnabled && driveEnabled) {
    try {
      const driveResult = await uploadTeamFileToGoogleDrive(input);
      if (driveResult.ok && !driveResult.skipped) {
        googleDriveFileId = driveResult.driveFileId;
      }
    } catch (error) {
      logError("team cloud Drive upload failed", error);
    }
  }

  if (filesEnabled && onedriveEnabled) {
    try {
      const oneDriveResult = await uploadTeamFileToOneDrive(input);
      if (oneDriveResult.ok && !oneDriveResult.skipped) {
        oneDriveFileId = oneDriveResult.oneDriveFileId;
      }
    } catch (error) {
      logError("team cloud OneDrive upload failed", error);
    }
  }

  return { googleDriveFileId, oneDriveFileId, missingError };
}
