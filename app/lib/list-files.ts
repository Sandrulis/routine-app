import {
  getFileIconDisplay,
  isAllowedFileName,
  mimeFromFileName,
  renameKeepingExtension,
} from "@/app/lib/file-types";

export type ListFile = {
  id: string;
  listId: string;
  parentId: string | null;
  name: string;
  mimeType: string;
  size: number;
  hasContent: boolean;
  googleDriveFileId: string | null;
  createdAt: string;
  sortOrder: number;
};

export const LIST_FILES_STORAGE_KEY = "routine-app-list-files";
export const LIST_FILES_CHANGED_EVENT = "routine-app-list-files-changed";
export const MAX_STORED_FILE_BYTES = 1_500_000;

const LIST_FILE_CONTENT_PREFIX = "routine-app-list-file-content:";

let listFilesTeamId: string | null = null;
let listFilesCache: ListFile[] = [];
const listFileContentCache = new Map<string, string>();

export function hydrateListFiles(
  teamId: string | null,
  files: ListFile[],
  contents: Record<string, string> = {},
) {
  listFilesTeamId = teamId;
  listFilesCache = files;
  listFileContentCache.clear();
  for (const [id, content] of Object.entries(contents)) {
    listFileContentCache.set(id, content);
  }
  notifyFilesChanged();
}

export function createFileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `file-${crypto.randomUUID()}`;
  }
  return `file-${Date.now()}`;
}

export function filePageHref(listId: string, fileId: string): string {
  return `/lists/${listId}/files/${fileId}`;
}

export function taskFilePageHref(
  listId: string,
  taskId: string,
  fileId: string,
): string {
  return `/lists/${listId}/tasks/${taskId}/files/${fileId}`;
}

export function openHrefInNewTab(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

export function fileContentKey(fileId: string): string {
  return `${LIST_FILE_CONTENT_PREFIX}${fileId}`;
}

export function mimeFromName(name: string): string {
  return mimeFromFileName(name);
}

export function fileIconClassName(name: string): string {
  return getFileIconDisplay(name).icon;
}

export function fileIconColor(name: string): string {
  return getFileIconDisplay(name).color;
}

function groupThousands(value: string): string {
  const [integer, fraction] = value.split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

export function fileStoredBytes(file: { size: number }): number {
  const size = Number(file.size);
  return Number.isFinite(size) && size > 0 ? Math.round(size) : 0;
}

export function sumFileBytes(files: Array<{ size: number }>): number {
  return files.reduce((total, file) => total + fileStoredBytes(file), 0);
}

export type FileStorageBucketBytes = {
  /** Unique total of all tracked file sizes. */
  totalBytes: number;
  /** Bytes kept as content on Routine server. */
  serverBytes: number;
  /** Bytes uploaded to Google Drive (cloud). */
  cloudBytes: number;
};

export function sumFileStorageBuckets(
  files: Array<{
    size: number;
    hasContent?: boolean;
    googleDriveFileId?: string | null;
  }>,
): FileStorageBucketBytes {
  let totalBytes = 0;
  let serverBytes = 0;
  let cloudBytes = 0;
  for (const file of files) {
    const size = fileStoredBytes(file);
    if (size <= 0) continue;
    totalBytes += size;
    if (file.hasContent) serverBytes += size;
    if (file.googleDriveFileId) cloudBytes += size;
  }
  return { totalBytes, serverBytes, cloudBytes };
}

export function formatFileSize(bytes: number): string {
  const size = Number.isFinite(bytes) ? Math.max(0, bytes) : 0;
  if (size < 1024) return `${groupThousands(String(Math.round(size)))} B`;
  if (size < 1024 * 1024) {
    const kb = size / 1024;
    const value = kb >= 100 ? kb.toFixed(0) : kb.toFixed(1);
    return `${groupThousands(value)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    const mb = size / (1024 * 1024);
    const value = mb >= 100 ? mb.toFixed(0) : mb.toFixed(1);
    return `${groupThousands(value)} MB`;
  }
  const gb = size / (1024 * 1024 * 1024);
  const value = gb >= 100 ? gb.toFixed(0) : gb.toFixed(1);
  return `${groupThousands(value)} GB`;
}

export function nextItemSortOrder(items: Array<{ sortOrder: number }>): number {
  return items.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
}

function persistListFilePatches(
  patches: Array<{ id: string; parentId?: string | null; sortOrder?: number }>,
) {
  if (patches.length === 0 || !listFilesTeamId) return;
  void import("@/app/lib/db/work-data")
    .then(async ({ updateListFileRow }) => {
      await Promise.all(
        patches.map((patch) =>
          updateListFileRow(patch.id, {
            parentId: patch.parentId,
            sortOrder: patch.sortOrder,
          }),
        ),
      );
    })
    .catch((error) => {
      console.error("Failed to update list files", error);
    });
}

export function reorderStoredListFiles(orderedIds: string[]) {
  const all = readAllListFiles();
  const patches: Array<{ id: string; sortOrder: number }> = [];
  const next = all.map((file) => {
    const index = orderedIds.indexOf(file.id);
    if (index < 0) return file;
    patches.push({ id: file.id, sortOrder: index });
    return { ...file, sortOrder: index };
  });
  writeAllListFiles(next);
  persistListFilePatches(patches);
}

export function placeStoredListFile(
  fileId: string,
  parentId: string | null,
  orderedIds: string[],
) {
  const all = readAllListFiles();
  const patches: Array<{ id: string; parentId?: string | null; sortOrder: number }> =
    [];
  const next = all.map((file) => {
    if (file.id === fileId) {
      const sortOrder = Math.max(0, orderedIds.indexOf(fileId));
      patches.push({ id: file.id, parentId, sortOrder });
      return { ...file, parentId, sortOrder };
    }
    const index = orderedIds.indexOf(file.id);
    if (index < 0) return file;
    patches.push({ id: file.id, sortOrder: index });
    return { ...file, sortOrder: index };
  });
  writeAllListFiles(next);
  persistListFilePatches(patches);
}

export function childListFiles(
  files: ListFile[],
  listId: string,
  parentId: string | null,
): ListFile[] {
  return files
    .filter((file) => file.listId === listId && file.parentId === parentId)
    .slice()
    .sort((left, right) =>
      left.sortOrder !== right.sortOrder
        ? left.sortOrder - right.sortOrder
        : left.id.localeCompare(right.id),
    );
}

export function isTextFile(file: { name: string; mimeType: string }): boolean {
  if (file.mimeType.startsWith("text/")) return true;
  if (file.mimeType === "application/json" || file.mimeType === "application/xml") {
    return true;
  }
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ["txt", "md", "json", "csv", "log", "xml", "html", "css", "js", "ts"].includes(
    extension,
  );
}

export function decodeDataUrlText(dataUrl: string): string | null {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma < 0) return null;
    const meta = dataUrl.slice(0, comma);
    const data = dataUrl.slice(comma + 1);
    const bytes = meta.includes(";base64")
      ? Uint8Array.from(atob(data), (char) => char.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(data));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function notifyFilesChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(LIST_FILES_CHANGED_EVENT));
}

function writeAllListFiles(files: ListFile[]) {
  listFilesCache = files;
  notifyFilesChanged();
}

export function normalizeStoredFiles(value: unknown): ListFile[] | null {
  if (!Array.isArray(value)) return null;

  const files = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("listId" in item) ||
        !("name" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const listId = String(item.listId);
      const name = String(item.name).trim();
      if (!id || !listId || !name) return null;

      const parentId =
        "parentId" in item && item.parentId != null && String(item.parentId)
          ? String(item.parentId)
          : null;
      const mimeType =
        "mimeType" in item && item.mimeType
          ? String(item.mimeType)
          : mimeFromName(name);
      const size =
        "size" in item && typeof item.size === "number" && Number.isFinite(item.size)
          ? item.size
          : 0;
      const hasContent =
        "hasContent" in item ? Boolean(item.hasContent) : false;
      const googleDriveFileId =
        "googleDriveFileId" in item && item.googleDriveFileId
          ? String(item.googleDriveFileId)
          : null;
      const createdAt =
        "createdAt" in item && item.createdAt
          ? String(item.createdAt)
          : "2026-01-01T00:00:00.000Z";
      const hasExplicitOrder =
        "sortOrder" in item &&
        typeof item.sortOrder === "number" &&
        Number.isFinite(item.sortOrder);
      const sortOrder = hasExplicitOrder ? Number(item.sortOrder) : 1000;

      return {
        id,
        listId,
        parentId,
        name,
        mimeType,
        size,
        hasContent,
        googleDriveFileId,
        createdAt,
        sortOrder,
      };
    })
    .filter((item): item is ListFile => item !== null);

  return files;
}

export function readAllListFiles(): ListFile[] {
  return listFilesCache;
}

export function cacheListFileContent(fileId: string, content: string | null) {
  if (content) listFileContentCache.set(fileId, content);
  else listFileContentCache.delete(fileId);
}

export function readListFileContent(fileId: string): string | null {
  if (listFileContentCache.has(fileId)) {
    return listFileContentCache.get(fileId) ?? null;
  }
  try {
    return window.localStorage.getItem(fileContentKey(fileId));
  } catch {
    return null;
  }
}

function removeListFileContent(fileId: string) {
  listFileContentCache.delete(fileId);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

async function storeFileContent(fileId: string, file: File): Promise<string | null> {
  if (file.size <= 0 || file.size > MAX_STORED_FILE_BYTES) return null;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    listFileContentCache.set(fileId, dataUrl);
    return dataUrl;
  } catch {
    listFileContentCache.delete(fileId);
    return null;
  }
}

export async function addStoredListFile(
  listId: string,
  file: File,
  parentId: string | null = null,
  sortOrder?: number,
  options?: {
    storeContent?: boolean;
    googleDriveFileId?: string | null;
  },
): Promise<ListFile | null> {
  const fileName = file.name.trim() || "file";
  if (!isAllowedFileName(fileName)) {
    return null;
  }

  const googleDriveFileId = options?.googleDriveFileId?.trim() || null;
  const storeContent = options?.storeContent !== false;

  const all = readAllListFiles();
  const record: ListFile = {
    id: createFileId(),
    listId,
    parentId,
    name: fileName,
    mimeType: file.type || mimeFromName(fileName),
    size: Math.max(0, Math.round(file.size)),
    hasContent: false,
    googleDriveFileId,
    createdAt: new Date().toISOString(),
    sortOrder:
      sortOrder ??
      nextItemSortOrder(
        childListFiles(all, listId, parentId),
      ),
  };

  const content = storeContent ? await storeFileContent(record.id, file) : null;
  record.hasContent = Boolean(content);

  writeAllListFiles([...all, record]);
  if (listFilesTeamId) {
    const teamId = listFilesTeamId;
    try {
      const { insertListFile } = await import("@/app/lib/db/work-data");
      await insertListFile(teamId, record, content);
    } catch (error) {
      console.error("Failed to save list file", error);
      writeAllListFiles(all);
      removeListFileContent(record.id);
      return null;
    }
  }

  return record;
}

export function renameStoredListFile(fileId: string, name: string): ListFile | null {
  const all = readAllListFiles();
  const existing = all.find((file) => file.id === fileId);
  if (!existing) return null;
  const trimmed = renameKeepingExtension(existing.name, name);
  if (!trimmed) return null;

  let updated: ListFile | null = null;
  const next = all.map((file) => {
    if (file.id !== fileId) return file;
    const renamed: ListFile = {
      ...file,
      name: trimmed,
      mimeType: mimeFromName(trimmed),
    };
    updated = renamed;
    return renamed;
  });
  if (!updated) return null;
  const renamedFile: ListFile = updated;
  writeAllListFiles(next);
  if (listFilesTeamId) {
    void import("@/app/lib/db/work-data")
      .then(({ updateListFileName }) =>
        updateListFileName(fileId, trimmed, mimeFromName(trimmed)),
      )
      .catch((error) => {
        console.error("Failed to rename list file", error);
      });
  }
  if (renamedFile.googleDriveFileId) {
    void import("@/app/lib/google-drive/queue-upload").then(
      ({ queueGoogleDriveRename }) => {
        queueGoogleDriveRename({ kind: "list", id: fileId, name: trimmed });
      },
    );
  }
  return renamedFile;
}

export function deleteStoredListFile(fileId: string) {
  const all = readAllListFiles();
  writeAllListFiles(all.filter((file) => file.id !== fileId));
  removeListFileContent(fileId);
  if (listFilesTeamId) {
    void import("@/app/lib/db/work-data")
      .then(({ deleteListFileRow }) => deleteListFileRow(fileId))
      .catch((error) => {
        console.error("Failed to delete list file", error);
      });
  }
}

export function deleteStoredListFilesForList(listId: string) {
  const all = readAllListFiles();
  const removed = all.filter((file) => file.listId === listId);
  if (removed.length === 0) return;
  writeAllListFiles(all.filter((file) => file.listId !== listId));
  for (const file of removed) {
    removeListFileContent(file.id);
  }
  if (listFilesTeamId) {
    void import("@/app/lib/db/work-data")
      .then(({ deleteListFilesForList }) => deleteListFilesForList(listId))
      .catch((error) => {
        console.error("Failed to delete list files", error);
      });
  }
}

export function deleteStoredListFilesForParents(parentIds: Iterable<string>) {
  const ids = new Set(parentIds);
  if (ids.size === 0) return;
  const all = readAllListFiles();
  const removed = all.filter(
    (file) => file.parentId !== null && ids.has(file.parentId),
  );
  if (removed.length === 0) return;
  const removedIds = new Set(removed.map((file) => file.id));
  writeAllListFiles(all.filter((file) => !removedIds.has(file.id)));
  for (const file of removed) {
    removeListFileContent(file.id);
  }
  if (listFilesTeamId) {
    void import("@/app/lib/db/work-data")
      .then(({ deleteListFilesForParents }) =>
        deleteListFilesForParents([...ids]),
      )
      .catch((error) => {
        console.error("Failed to delete nested list files", error);
      });
  }
}
