"use client";

export function queueGoogleDriveUpload(input: {
  teamId: string | null | undefined;
  file: File;
  pathParts: string[];
}) {
  const teamId = input.teamId?.trim();
  if (!teamId || input.file.size <= 0) return;

  const body = new FormData();
  body.set("teamId", teamId);
  body.set("pathParts", JSON.stringify(input.pathParts));
  body.set("file", input.file, input.file.name);

  void fetch("/api/google-drive/upload", {
    method: "POST",
    body,
    credentials: "include",
  }).catch((error) => {
    console.error("Google Drive upload failed", error);
  });
}
