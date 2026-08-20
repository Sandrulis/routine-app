"use client";

import { logError } from "@/app/lib/security/log-error";

export function queueOneDriveUpload(input: {
  teamId: string | null | undefined;
  listId: string;
  file: File;
  pathParts: string[];
}) {
  const teamId = input.teamId?.trim();
  const listId = input.listId.trim();
  if (!teamId || !listId || input.file.size <= 0) return;

  const body = new FormData();
  body.set("teamId", teamId);
  body.set("listId", listId);
  body.set("pathParts", JSON.stringify(input.pathParts));
  body.set("file", input.file, input.file.name);

  void fetch("/api/onedrive/upload", {
    method: "POST",
    body,
    credentials: "include",
  }).catch((error) => {
    logError("OneDrive upload failed", error);
  });
}
