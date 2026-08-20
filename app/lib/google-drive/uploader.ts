import {
  GOOGLE_DRIVE_SIMPLE_UPLOAD_MAX_BYTES,
} from "@/app/lib/google-drive/env";
import {
  fetchGoogleDriveSecretRow,
  saveGoogleDriveFolderCache,
  updateGoogleDriveAccessToken,
  type GoogleDriveSecretRow,
} from "@/app/lib/google-drive/repository";
import { refreshGoogleDriveAccessToken } from "@/app/lib/google-drive/oauth";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

function sanitizeSegment(value: string) {
  return value.replace(/[\\/]+/g, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeDrivePathParts(parts: string[]) {
  return parts
    .map((part) => sanitizeSegment(part))
    .filter((part) => part && part !== "." && part !== "..");
}

async function driveJson(
  accessToken: string,
  url: string,
  init?: RequestInit,
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = (await response.json().catch(() => null)) as
    | { id?: string; error?: { message?: string } }
    | null;
  if (!response.ok || !data?.id) {
    throw new Error(data?.error?.message || `Drive request failed (${response.status})`);
  }
  return data;
}

async function getAccessToken(row: GoogleDriveSecretRow) {
  const expiresAt = row.accessTokenExpiresAt
    ? Date.parse(row.accessTokenExpiresAt)
    : 0;
  const stillValid =
    row.accessToken && Number.isFinite(expiresAt) && expiresAt - Date.now() > 60_000;
  if (stillValid) return row.accessToken;

  const refreshed = await refreshGoogleDriveAccessToken(row.refreshToken);
  if (!refreshed?.access_token) {
    throw new Error("Could not refresh Google Drive token");
  }
  await updateGoogleDriveAccessToken(
    row.teamId,
    refreshed.access_token,
    Number(refreshed.expires_in ?? 3600),
  );
  return refreshed.access_token;
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId: string,
) {
  const data = await driveJson(accessToken, `${DRIVE_API}/files?fields=id`, {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    }),
  });
  return data.id as string;
}

async function ensureFolderChain(
  accessToken: string,
  parts: string[],
  cache: Record<string, string>,
) {
  let parentId = "root";
  let path = "";
  for (const part of parts) {
    path = path ? `${path}/${part}` : part;
    const cached = cache[path];
    if (cached) {
      parentId = cached;
      continue;
    }
    const id = await createFolder(accessToken, part, parentId);
    cache[path] = id;
    parentId = id;
  }
  return parentId;
}

async function multipartUpload(
  accessToken: string,
  meta: { name: string; parents: string[] },
  bytes: Uint8Array,
  mimeType: string,
) {
  const boundary = `routine_${Date.now().toString(16)}`;
  const header = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: ${mimeType || "application/octet-stream"}\r\n\r\n`;
  const footer = `\r\n--${boundary}--`;
  const encoder = new TextEncoder();
  const headerBytes = encoder.encode(header);
  const footerBytes = encoder.encode(footer);
  const body = new Uint8Array(headerBytes.length + bytes.length + footerBytes.length);
  body.set(headerBytes, 0);
  body.set(bytes, headerBytes.length);
  body.set(footerBytes, headerBytes.length + bytes.length);

  const response = await fetch(`${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: Buffer.from(body),
  });
  const data = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!response.ok || !data?.id) {
    throw new Error("Google Drive upload failed");
  }
  return data.id as string;
}

async function resumableUpload(
  accessToken: string,
  meta: { name: string; parents: string[] },
  bytes: Uint8Array,
  mimeType: string,
) {
  const start = await fetch(`${DRIVE_UPLOAD}/files?uploadType=resumable&fields=id`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": mimeType || "application/octet-stream",
      "X-Upload-Content-Length": String(bytes.length),
    },
    body: JSON.stringify(meta),
  });
  const uploadUrl = start.headers.get("location");
  if (!start.ok || !uploadUrl) {
    throw new Error("Google Drive resumable start failed");
  }
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(bytes.length),
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: Buffer.from(bytes),
  });
  const data = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!response.ok || !data?.id) {
    throw new Error("Google Drive resumable upload failed");
  }
  return data.id as string;
}

export async function uploadTeamFileToGoogleDrive(input: {
  teamId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  pathParts: string[];
}) {
  const row = await fetchGoogleDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.isEnabled || !row.refreshToken) {
    return {
      ok: true as const,
      skipped: true as const,
      storeOnServer: true as const,
    };
  }

  const accessToken = await getAccessToken(row);
  const folderParts = sanitizeDrivePathParts([
    ...row.folderPath.split("/"),
    ...input.pathParts,
  ]);
  const fileName = sanitizeSegment(input.fileName) || "file";
  const cache = { ...row.folderIdCache };
  const parentId = await ensureFolderChain(accessToken, folderParts, cache);
  if (JSON.stringify(cache) !== JSON.stringify(row.folderIdCache)) {
    await saveGoogleDriveFolderCache(input.teamId, cache);
  }

  const meta = { name: fileName, parents: [parentId] };
  const driveFileId =
    input.bytes.length <= GOOGLE_DRIVE_SIMPLE_UPLOAD_MAX_BYTES
      ? await multipartUpload(accessToken, meta, input.bytes, input.mimeType)
      : await resumableUpload(accessToken, meta, input.bytes, input.mimeType);

  return {
    ok: true as const,
    skipped: false as const,
    storeOnServer: row.storeOnServer,
    driveFileId,
  };
}

export async function downloadTeamGoogleDriveFile(input: {
  teamId: string;
  driveFileId: string;
}) {
  const row = await fetchGoogleDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.refreshToken) {
    throw new Error("Google Drive not connected");
  }
  const accessToken = await getAccessToken(row);
  const response = await fetch(
    `${DRIVE_API}/files/${encodeURIComponent(input.driveFileId)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!response.ok) {
    throw new Error(`Google Drive download failed (${response.status})`);
  }
  const mimeType =
    response.headers.get("content-type") || "application/octet-stream";
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, mimeType };
}

export async function renameTeamGoogleDriveFile(input: {
  teamId: string;
  driveFileId: string;
  fileName: string;
}) {
  const row = await fetchGoogleDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.isEnabled || !row.refreshToken) {
    return { ok: true as const, skipped: true as const };
  }

  const accessToken = await getAccessToken(row);
  const fileName = sanitizeSegment(input.fileName) || "file";
  await driveJson(
    accessToken,
    `${DRIVE_API}/files/${encodeURIComponent(input.driveFileId)}?fields=id`,
    {
      method: "PATCH",
      body: JSON.stringify({ name: fileName }),
    },
  );
  return { ok: true as const, skipped: false as const };
}
