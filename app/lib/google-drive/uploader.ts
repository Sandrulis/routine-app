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
const GOOGLE_APPS_SHORTCUT = "application/vnd.google-apps.shortcut";

const GOOGLE_APPS_EXPORT: Record<string, { binary: string; pdf: string }> = {
  "application/vnd.google-apps.document": {
    binary:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pdf: "application/pdf",
  },
  "application/vnd.google-apps.spreadsheet": {
    binary:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pdf: "application/pdf",
  },
  "application/vnd.google-apps.presentation": {
    binary:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    pdf: "application/pdf",
  },
  "application/vnd.google-apps.drawing": {
    binary: "application/pdf",
    pdf: "application/pdf",
  },
};

function withDriveQuery(url: string, params: Record<string, string> = {}) {
  const parsed = new URL(url);
  parsed.searchParams.set("supportsAllDrives", "true");
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value);
  }
  return parsed.toString();
}

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

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function driveList(
  accessToken: string,
  url: string,
): Promise<{ id?: string; createdTime?: string }[]> {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await response.json().catch(() => null)) as {
    files?: { id?: string; createdTime?: string }[];
    error?: { message?: string };
  } | null;
  if (!response.ok) {
    throw new Error(data?.error?.message || `Drive request failed (${response.status})`);
  }
  return Array.isArray(data?.files) ? data.files : [];
}

async function folderIdUsable(accessToken: string, folderId: string) {
  try {
    const response = await fetch(
      withDriveQuery(`${DRIVE_API}/files/${encodeURIComponent(folderId)}`, {
        fields: "id,trashed,mimeType",
      }),
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const data = (await response.json().catch(() => null)) as {
      id?: string;
      trashed?: boolean;
      mimeType?: string;
    } | null;
    return Boolean(
      response.ok &&
        data?.id &&
        data.trashed !== true &&
        data.mimeType === FOLDER_MIME,
    );
  } catch {
    return false;
  }
}

/** Reuse an existing sibling folder (Drive allows duplicate names and then creates "test (1)"). */
async function findFolderInParent(
  accessToken: string,
  name: string,
  parentId: string,
) {
  const q = [
    `'${escapeDriveQueryValue(parentId)}' in parents`,
    `name = '${escapeDriveQueryValue(name)}'`,
    `mimeType = '${FOLDER_MIME}'`,
    "trashed = false",
  ].join(" and ");
  const files = await driveList(
    accessToken,
    withDriveQuery(`${DRIVE_API}/files`, {
      q,
      fields: "files(id,createdTime)",
      pageSize: "20",
      includeItemsFromAllDrives: "true",
    }),
  );
  const ranked = files
    .filter((row) => row.id)
    .sort((a, b) =>
      String(a.createdTime || "").localeCompare(String(b.createdTime || "")),
    );
  return ranked[0]?.id || "";
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId: string,
) {
  const data = await driveJson(
    accessToken,
    withDriveQuery(`${DRIVE_API}/files`, { fields: "id" }),
    {
    method: "POST",
    body: JSON.stringify({
      name,
      mimeType: FOLDER_MIME,
      parents: [parentId],
    }),
  });
  return data.id as string;
}

async function ensureFolder(
  accessToken: string,
  name: string,
  parentId: string,
) {
  const existing = await findFolderInParent(accessToken, name, parentId);
  if (existing) return existing;
  return createFolder(accessToken, name, parentId);
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
    if (cached && (await folderIdUsable(accessToken, cached))) {
      parentId = cached;
      continue;
    }
    if (cached) delete cache[path];
    const id = await ensureFolder(accessToken, part, parentId);
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

  const response = await fetch(
    withDriveQuery(`${DRIVE_UPLOAD}/files`, {
      uploadType: "multipart",
      fields: "id",
    }),
    {
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
  const start = await fetch(
    withDriveQuery(`${DRIVE_UPLOAD}/files`, {
      uploadType: "resumable",
      fields: "id",
    }),
    {
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
  if (!row?.isConnected || !row.refreshToken) {
    return {
      ok: false as const,
      error: "errors.files_require_google_drive",
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
    storeOnServer: false as const,
    driveFileId,
  };
}

async function authorizedDriveGet(accessToken: string, url: string) {
  return fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function requestDriveFile(
  accessToken: string,
  driveFileId: string,
  preferPdf: boolean,
): Promise<{ response: Response; mimeType: string }> {
  const metaResponse = await authorizedDriveGet(
    accessToken,
    withDriveQuery(`${DRIVE_API}/files/${encodeURIComponent(driveFileId)}`, {
      fields: "id,mimeType,shortcutDetails",
    }),
  );
  const meta = (await metaResponse.json().catch(() => null)) as {
    mimeType?: string;
    shortcutDetails?: { targetId?: string };
    error?: { message?: string };
  } | null;

  if (metaResponse.ok && meta?.mimeType === GOOGLE_APPS_SHORTCUT) {
    const targetId = meta.shortcutDetails?.targetId?.trim();
    if (targetId && targetId !== driveFileId) {
      return requestDriveFile(accessToken, targetId, preferPdf);
    }
  }

  const driveMime = metaResponse.ok ? meta?.mimeType ?? "" : "";
  const exportAs = GOOGLE_APPS_EXPORT[driveMime];
  if (exportAs) {
    const wanted = preferPdf ? exportAs.pdf : exportAs.binary;
    const exported = await authorizedDriveGet(
      accessToken,
      withDriveQuery(
        `${DRIVE_API}/files/${encodeURIComponent(driveFileId)}/export`,
        { mimeType: wanted },
      ),
    );
    if (!exported.ok) {
      throw new Error(`Google Drive export failed (${exported.status})`);
    }
    return { response: exported, mimeType: wanted };
  }

  const media = await authorizedDriveGet(
    accessToken,
    withDriveQuery(`${DRIVE_API}/files/${encodeURIComponent(driveFileId)}`, {
      alt: "media",
      acknowledgeAbuse: "true",
    }),
  );
  if (!media.ok) {
    const detail = meta?.error?.message || `Google Drive download failed (${media.status})`;
    throw new Error(detail);
  }
  return {
    response: media,
    mimeType: media.headers.get("content-type") || "application/octet-stream",
  };
}

export async function openTeamGoogleDriveFile(input: {
  teamId: string;
  driveFileId: string;
  preferPdf?: boolean;
}) {
  const row = await fetchGoogleDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.refreshToken) {
    throw new Error("Google Drive not connected");
  }
  const accessToken = await getAccessToken(row);
  return requestDriveFile(accessToken, input.driveFileId, Boolean(input.preferPdf));
}

export async function downloadTeamGoogleDriveFile(input: {
  teamId: string;
  driveFileId: string;
}) {
  const opened = await openTeamGoogleDriveFile(input);
  const bytes = new Uint8Array(await opened.response.arrayBuffer());
  return { bytes, mimeType: opened.mimeType };
}

export async function renameTeamGoogleDriveFile(input: {
  teamId: string;
  driveFileId: string;
  fileName: string;
}) {
  const row = await fetchGoogleDriveSecretRow(input.teamId);
  if (!row?.isConnected || !row.refreshToken) {
    return { ok: true as const, skipped: true as const };
  }

  const accessToken = await getAccessToken(row);
  const fileName = sanitizeSegment(input.fileName) || "file";
  await driveJson(
    accessToken,
    withDriveQuery(
      `${DRIVE_API}/files/${encodeURIComponent(input.driveFileId)}`,
      { fields: "id" },
    ),
    {
      method: "PATCH",
      body: JSON.stringify({ name: fileName }),
    },
  );
  return { ok: true as const, skipped: false as const };
}
