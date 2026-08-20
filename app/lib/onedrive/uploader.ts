import {
  ONEDRIVE_SIMPLE_UPLOAD_MAX_BYTES,
} from "@/app/lib/onedrive/env";
import {
  fetchOneDriveSecretRow,
  updateOneDriveAccessToken,
  type OneDriveSecretRow,
} from "@/app/lib/onedrive/repository";
import { refreshOneDriveAccessToken } from "@/app/lib/onedrive/oauth";

const GRAPH = "https://graph.microsoft.com/v1.0";

function sanitizeSegment(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, " ").replace(/\s+/g, " ").trim();
}

export function sanitizeOneDrivePathParts(parts: string[]) {
  return parts
    .map((part) => sanitizeSegment(part))
    .filter((part) => part && part !== "." && part !== "..");
}

function encodeGraphPath(segments: string[]) {
  return segments.map((segment) => encodeURIComponent(segment)).join("/");
}

async function getAccessToken(row: OneDriveSecretRow) {
  const expiresAt = row.accessTokenExpiresAt
    ? Date.parse(row.accessTokenExpiresAt)
    : 0;
  const stillValid =
    row.accessToken && Number.isFinite(expiresAt) && expiresAt - Date.now() > 60_000;
  if (stillValid) return row.accessToken;

  const refreshed = await refreshOneDriveAccessToken(row.refreshToken);
  if (!refreshed?.access_token) {
    throw new Error("Could not refresh OneDrive token");
  }
  await updateOneDriveAccessToken(
    row.teamId,
    refreshed.access_token,
    Number(refreshed.expires_in ?? 3600),
    refreshed.refresh_token,
  );
  return refreshed.access_token;
}

async function simpleUpload(
  accessToken: string,
  remotePath: string,
  bytes: Uint8Array,
  mimeType: string,
) {
  const response = await fetch(
    `${GRAPH}/me/drive/root:/${remotePath}:/content`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType || "application/octet-stream",
      },
      body: Buffer.from(bytes),
    },
  );
  if (!response.ok) {
    throw new Error(`OneDrive upload failed (${response.status})`);
  }
}

async function sessionUpload(
  accessToken: string,
  remotePath: string,
  bytes: Uint8Array,
  mimeType: string,
) {
  const create = await fetch(
    `${GRAPH}/me/drive/root:/${remotePath}:/createUploadSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: {
          "@microsoft.graph.conflictBehavior": "rename",
          name: remotePath.split("/").pop(),
        },
      }),
    },
  );
  const session = (await create.json().catch(() => null)) as
    | { uploadUrl?: string }
    | null;
  if (!create.ok || !session?.uploadUrl) {
    throw new Error("OneDrive upload session failed");
  }

  const response = await fetch(session.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Length": String(bytes.length),
      "Content-Range": `bytes 0-${bytes.length - 1}/${bytes.length}`,
      "Content-Type": mimeType || "application/octet-stream",
    },
    body: Buffer.from(bytes),
  });
  if (!response.ok) {
    throw new Error("OneDrive session upload failed");
  }
}

export async function uploadTeamFileToOneDrive(input: {
  teamId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  pathParts: string[];
}) {
  const row = await fetchOneDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.isEnabled || !row.refreshToken) {
    return { ok: true as const, skipped: true as const };
  }

  const accessToken = await getAccessToken(row);
  const folderParts = sanitizeOneDrivePathParts([
    ...row.folderPath.split("/"),
    ...input.pathParts,
  ]);
  const fileName = sanitizeSegment(input.fileName) || "file";
  const remotePath = encodeGraphPath([...folderParts, fileName]);

  if (input.bytes.length <= ONEDRIVE_SIMPLE_UPLOAD_MAX_BYTES) {
    await simpleUpload(accessToken, remotePath, input.bytes, input.mimeType);
  } else {
    await sessionUpload(accessToken, remotePath, input.bytes, input.mimeType);
  }
  return { ok: true as const, skipped: false as const };
}
