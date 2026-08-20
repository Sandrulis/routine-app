"use client";

import { logError } from "@/app/lib/security/log-error";

export type GoogleDriveUploadResult =
  | {
      ok: true;
      skipped: true;
      storeOnServer: true;
    }
  | {
      ok: true;
      skipped: false;
      storeOnServer: boolean;
      driveFileId: string;
    }
  | {
      ok: false;
      error: string;
    };

export type GoogleDriveUploadProgress = (percent: number) => void;

/** Fire-and-forget when mirroring to Drive while also storing on server. */
export function queueGoogleDriveUpload(input: {
  teamId: string | null | undefined;
  listId: string;
  file: File;
  pathParts: string[];
}) {
  void uploadGoogleDriveFile(input);
}

/** Fire-and-forget rename of a Drive-backed list/task file. */
export function queueGoogleDriveRename(input: {
  kind: "list" | "task";
  id: string;
  name: string;
}) {
  void renameGoogleDriveFile(input);
}

export async function renameGoogleDriveFile(input: {
  kind: "list" | "task";
  id: string;
  name: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const name = input.name.trim();
  if (!name) return { ok: false };
  try {
    const response = await fetch("/api/google-drive/rename", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: input.kind,
        id: input.id,
        name,
      }),
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; skipped?: boolean }
      | null;
    if (!response.ok || !data?.ok) {
      logError("Google Drive rename failed", data);
      return { ok: false };
    }
    return { ok: true, skipped: Boolean(data.skipped) };
  } catch (error) {
    logError("Google Drive rename failed", error);
    return { ok: false };
  }
}

function uploadWithProgress(
  url: string,
  body: FormData,
  onProgress?: GoogleDriveUploadProgress,
): Promise<{ ok: boolean; status: number; data: GoogleDriveUploadResult | null }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.max(0, Math.min(100, (event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      let data: GoogleDriveUploadResult | null = null;
      try {
        data = JSON.parse(xhr.responseText) as GoogleDriveUploadResult;
      } catch {
        data = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, data });
    };
    xhr.onerror = () => {
      resolve({ ok: false, status: 0, data: null });
    };
    xhr.send(body);
  });
}

/** Await upload; used when Drive is primary storage (no server content). */
export async function uploadGoogleDriveFile(input: {
  teamId: string | null | undefined;
  listId: string;
  file: File;
  pathParts: string[];
  onProgress?: GoogleDriveUploadProgress;
}): Promise<GoogleDriveUploadResult> {
  const teamId = input.teamId?.trim();
  const listId = input.listId.trim();
  if (!teamId || !listId || input.file.size <= 0) {
    return { ok: true, skipped: true, storeOnServer: true };
  }

  const body = new FormData();
  body.set("teamId", teamId);
  body.set("listId", listId);
  body.set("pathParts", JSON.stringify(input.pathParts));
  body.set("file", input.file, input.file.name);

  try {
    input.onProgress?.(0);
    const response = await uploadWithProgress(
      "/api/google-drive/upload",
      body,
      input.onProgress,
    );
    input.onProgress?.(100);
    const data = response.data;
    if (!response.ok || !data || !("ok" in data)) {
      return { ok: false, error: "errors.google_drive_upload_failed" };
    }
    return data;
  } catch (error) {
    logError("Google Drive upload failed", error);
    return { ok: false, error: "errors.google_drive_upload_failed" };
  }
}

/**
 * Decide whether to keep file bytes in Routine after a Drive upload attempt.
 * Drive-primary (default): only store on server if upload skipped/failed or setting says so.
 */
export function shouldStoreFileOnServer(
  driveResult: GoogleDriveUploadResult | null,
): boolean {
  if (!driveResult || !driveResult.ok) return true;
  if (driveResult.skipped) return true;
  return driveResult.storeOnServer;
}

export function driveFileIdFromUpload(
  driveResult: GoogleDriveUploadResult | null,
): string | null {
  if (!driveResult || !driveResult.ok || driveResult.skipped) return null;
  return driveResult.driveFileId;
}

/** Overall batch percent from completed files + current file upload percent. */
export function batchUploadPercent(
  completedFiles: number,
  totalFiles: number,
  currentFilePercent: number,
): number {
  if (totalFiles <= 0) return 100;
  const clamped = Math.max(0, Math.min(100, currentFilePercent));
  return ((completedFiles + clamped / 100) / totalFiles) * 100;
}
