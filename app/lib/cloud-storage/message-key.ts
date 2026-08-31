export type CloudModuleFlags = {
  googleDrive: boolean;
  oneDrive: boolean;
};

export type FilesRequireCloudErrorKey =
  | "errors.files_require_google_drive"
  | "errors.files_require_onedrive"
  | "errors.files_require_cloud";

export type ExtensionCloudMissingErrorKey =
  | "errors.extension_team_drive_missing"
  | "errors.extension_team_onedrive_missing"
  | "errors.extension_team_cloud_missing";

/** Name only the cloud modules that are actually enabled. */
export function filesRequireCloudErrorKey(
  modules: CloudModuleFlags,
): FilesRequireCloudErrorKey {
  if (modules.googleDrive && modules.oneDrive) return "errors.files_require_cloud";
  if (modules.oneDrive) return "errors.files_require_onedrive";
  return "errors.files_require_google_drive";
}

export function filesRequireCloudFallback(key: FilesRequireCloudErrorKey): string {
  if (key === "errors.files_require_cloud") {
    return "Lai augšupielādētu failus, vispirms pieslēdziet komandas Google Drive vai OneDrive.";
  }
  if (key === "errors.files_require_onedrive") {
    return "Lai augšupielādētu failus, vispirms pieslēdziet komandas OneDrive.";
  }
  return "Lai augšupielādētu failus, vispirms pieslēdziet komandas Google Drive.";
}

export function extensionCloudMissingErrorKey(
  modules: CloudModuleFlags,
): ExtensionCloudMissingErrorKey {
  if (modules.googleDrive && modules.oneDrive) {
    return "errors.extension_team_cloud_missing";
  }
  if (modules.oneDrive) return "errors.extension_team_onedrive_missing";
  return "errors.extension_team_drive_missing";
}
