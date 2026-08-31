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

async function parseDriveItemId(response: Response, fallbackMessage: string) {
  const data = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!response.ok || !data?.id) {
    throw new Error(fallbackMessage);
  }
  return data.id;
}

async function simpleUpload(
  accessToken: string,
  remotePath: string,
  bytes: Uint8Array,
  mimeType: string,
) {
  const response = await fetch(
    `${GRAPH}/me/drive/root:/${remotePath}:/content?@microsoft.graph.conflictBehavior=rename`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType || "application/octet-stream",
      },
      body: Buffer.from(bytes),
    },
  );
  return parseDriveItemId(
    response,
    `OneDrive upload failed (${response.status})`,
  );
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
  return parseDriveItemId(response, "OneDrive session upload failed");
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
    return {
      ok: false as const,
      error: "errors.files_require_onedrive",
    };
  }

  const accessToken = await getAccessToken(row);
  const folderParts = sanitizeOneDrivePathParts([
    ...row.folderPath.split("/"),
    ...input.pathParts,
  ]);
  const fileName = sanitizeSegment(input.fileName) || "file";
  const remotePath = encodeGraphPath([...folderParts, fileName]);

  const oneDriveFileId =
    input.bytes.length <= ONEDRIVE_SIMPLE_UPLOAD_MAX_BYTES
      ? await simpleUpload(accessToken, remotePath, input.bytes, input.mimeType)
      : await sessionUpload(accessToken, remotePath, input.bytes, input.mimeType);

  return {
    ok: true as const,
    skipped: false as const,
    oneDriveFileId,
  };
}

export async function downloadTeamOneDriveFile(input: {
  teamId: string;
  oneDriveFileId: string;
}) {
  const row = await fetchOneDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.refreshToken) {
    throw new Error("OneDrive not connected");
  }
  const accessToken = await getAccessToken(row);
  const response = await fetch(
    `${GRAPH}/me/drive/items/${encodeURIComponent(input.oneDriveFileId)}/content`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      redirect: "follow",
    },
  );
  if (!response.ok) {
    throw new Error(`OneDrive download failed (${response.status})`);
  }
  const mimeType =
    response.headers.get("content-type") || "application/octet-stream";
  const bytes = new Uint8Array(await response.arrayBuffer());
  return { bytes, mimeType };
}

export async function renameTeamOneDriveFile(input: {
  teamId: string;
  oneDriveFileId: string;
  fileName: string;
}) {
  const row = await fetchOneDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.isEnabled || !row.refreshToken) {
    return { ok: true as const, skipped: true as const };
  }

  const accessToken = await getAccessToken(row);
  const fileName = sanitizeSegment(input.fileName) || "file";
  const response = await fetch(
    `${GRAPH}/me/drive/items/${encodeURIComponent(input.oneDriveFileId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: fileName }),
    },
  );
  await parseDriveItemId(response, `OneDrive rename failed (${response.status})`);
  return { ok: true as const, skipped: false as const };
}
