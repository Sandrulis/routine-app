/** Existing cloud folders were created under this name. Do not rename in reads. */
export const LEGACY_CLOUD_FOLDER = "Routine";

/** Normalize a user-provided folder path; strips `.` / `..` and empty segments. */
export function sanitizeCloudFolderPath(value: string): string {
  const parts = value
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part !== "." && part !== "..");
  return parts.join("/") || LEGACY_CLOUD_FOLDER;
}

/** Suggested Drive/OneDrive root when the team has no saved folder path yet. */
export function defaultCloudFolderFromTeamName(
  teamName: string | null | undefined,
): string {
  return sanitizeCloudFolderPath(teamName?.trim() ?? "");
}
