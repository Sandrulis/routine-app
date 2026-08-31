"use client";

import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { useTeamGoogleDrive } from "@/app/lib/google-drive/context";
import { useTeamOneDrive } from "@/app/lib/onedrive/context";
import {
  filesRequireCloudErrorKey,
  type FilesRequireCloudErrorKey,
} from "@/app/lib/cloud-storage/message-key";

export function useTeamCloudStorage() {
  const googleDrive = useTeamGoogleDrive();
  const oneDrive = useTeamOneDrive();
  const { isEnabled } = useFrontendModules();
  const googleDriveModule = isEnabled(FRONTEND_MODULE_KEYS.googleDrive);
  const oneDriveModule = isEnabled(FRONTEND_MODULE_KEYS.onedrive);
  const requireCloudErrorKey: FilesRequireCloudErrorKey = filesRequireCloudErrorKey({
    googleDrive: googleDriveModule,
    oneDrive: oneDriveModule,
  });
  return {
    loaded: googleDrive.loaded && oneDrive.loaded,
    ready:
      (googleDriveModule && googleDrive.ready) ||
      (oneDriveModule && oneDrive.ready),
    googleDriveReady: googleDriveModule && googleDrive.ready,
    oneDriveReady: oneDriveModule && oneDrive.ready,
    googleDriveModule,
    oneDriveModule,
    requireCloudErrorKey,
  };
}
