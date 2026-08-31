"use client";

import { logError } from "@/app/lib/security/log-error";

export type OneDriveUploadResult =
  | {
      ok: true;
      skipped: false;
      oneDriveFileId: string;
    }
  | {
      ok: false;
      error: string;
    };

export type OneDriveUploadProgress = (percent: number) => void;

/** Fire-and-forget when mirroring to OneDrive after another cloud succeeded. */
export function queueOneDriveUpload(input: {
  teamId: string | null | undefined;
  listId: string;
  file: File;
  pathParts: string[];
}) {
  void uploadOneDriveFile(input);
}

/** Fire-and-forget rename of a OneDrive-backed list/task file. */
export function queueOneDriveRename(input: {
  kind: "list" | "task";
  id: string;
  name: string;
}) {
  void renameOneDriveFile(input);
}

export async function renameOneDriveFile(input: {
  kind: "list" | "task";
  id: string;
  name: string;
}): Promise<{ ok: boolean; skipped?: boolean }> {
  const name = input.name.trim();
  if (!name) return { ok: false };
  try {
    const response = await fetch("/api/onedrive/rename", {
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
      logError("OneDrive rename failed", data);
      return { ok: false };
    }
    return { ok: true, skipped: Boolean(data.skipped) };
  } catch (error) {
    logError("OneDrive rename failed", error);
    return { ok: false };
  }
}

function uploadWithProgress(
  url: string,
  body: FormData,
  onProgress?: OneDriveUploadProgress,
): Promise<{ ok: boolean; status: number; data: OneDriveUploadResult | null }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.max(0, Math.min(100, (event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      let data: OneDriveUploadResult | null = null;
      try {
        data = JSON.parse(xhr.responseText) as OneDriveUploadResult;
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

/** Await upload; used when OneDrive is primary storage (no server content). */
export async function uploadOneDriveFile(input: {
  teamId: string | null | undefined;
  listId: string;
  file: File;
  pathParts: string[];
  onProgress?: OneDriveUploadProgress;
}): Promise<OneDriveUploadResult> {
  const teamId = input.teamId?.trim();
  const listId = input.listId.trim();
  if (!teamId || !listId || input.file.size <= 0) {
    return { ok: false, error: "errors.files_require_onedrive" };
  }

  const body = new FormData();
  body.set("teamId", teamId);
  body.set("listId", listId);
  body.set("pathParts", JSON.stringify(input.pathParts));
  body.set("file", input.file, input.file.name);

  try {
    input.onProgress?.(0);
    const response = await uploadWithProgress(
      "/api/onedrive/upload",
      body,
      input.onProgress,
    );
    input.onProgress?.(100);
    const data = response.data;
    if (data && "ok" in data && data.ok === false) {
      return data;
    }
    if (!response.ok || !data || !("ok" in data)) {
      return { ok: false, error: "errors.onedrive_upload_failed" };
    }
    return data;
  } catch (error) {
    logError("OneDrive upload failed", error);
    return { ok: false, error: "errors.onedrive_upload_failed" };
  }
}

export function oneDriveUploadFailure(
  oneDriveResult: OneDriveUploadResult | null,
): string | null {
  if (oneDriveFileIdFromUpload(oneDriveResult)) return null;
  if (oneDriveResult && !oneDriveResult.ok) return oneDriveResult.error;
  return "errors.files_require_onedrive";
}

export function oneDriveFileIdFromUpload(
  oneDriveResult: OneDriveUploadResult | null,
): string | null {
  if (!oneDriveResult || !oneDriveResult.ok || oneDriveResult.skipped) return null;
  return oneDriveResult.oneDriveFileId;
}
