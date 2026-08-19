import type { WorkTaskStatus } from "@/app/lib/lists";
import { MAX_STORED_FILE_BYTES, mimeFromName } from "@/app/lib/list-files";

export const TASK_ACTIVITY_STORAGE_KEY = "routine-app-task-activity";
export const TASK_FILES_STORAGE_KEY = "routine-app-task-files";
export const TASK_FILE_CONTENT_PREFIX = "routine-app-task-file-content:";

export type TaskActivityKind =
  | "created"
  | "status"
  | "assignees"
  | "assignee_added"
  | "assignee_removed"
  | "start_date"
  | "due_date"
  | "comment"
  | "file"
  | "file_removed"
  | "file_renamed"
  | "title"
  | "description"
  | "moved"
  | "hidden"
  | "restored"
  | "checklist"
  | "reordered";

export type TaskActivityMetadata = Record<string, unknown>;

export type TaskActivity = {
  id: string;
  taskId: string;
  at: string;
  actorId: string;
  kind: TaskActivityKind;
  fromStatus?: WorkTaskStatus;
  toStatus?: WorkTaskStatus;
  assigneeIds?: string[];
  fromAssigneeIds?: string[];
  dateValue?: string | null;
  fromDateValue?: string | null;
  text?: string;
  previousText?: string;
  fileName?: string;
  fromParentId?: string | null;
  toParentId?: string | null;
  metadata?: TaskActivityMetadata;
};

export type TaskFile = {
  id: string;
  taskId: string;
  name: string;
  mimeType: string;
  size: number;
  hasContent: boolean;
  createdAt: string;
};

export function createActivityId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `activity-${crypto.randomUUID()}`;
  }
  return `activity-${Date.now()}`;
}

export function createTaskFileId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `task-file-${crypto.randomUUID()}`;
  }
  return `task-file-${Date.now()}`;
}

export function createActivity(
  input: Omit<TaskActivity, "id" | "at"> & {
    at?: string;
  },
): TaskActivity {
  return {
    ...input,
    id: createActivityId(),
    at: input.at ?? new Date().toISOString(),
  };
}

export function normalizeStoredActivities(value: unknown): TaskActivity[] | null {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("taskId" in item) ||
        !("kind" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const taskId = String(item.taskId);
      const kind = String(item.kind) as TaskActivityKind;
      const at =
        "at" in item && typeof item.at === "string"
          ? item.at
          : new Date().toISOString();
      const actorId =
        "actorId" in item && typeof item.actorId === "string"
          ? item.actorId
          : "";

      if (!id || !taskId || !kind) return null;
      return { ...(item as TaskActivity), id, taskId, kind, at, actorId };
    })
    .filter((item): item is TaskActivity => item !== null);

  return items;
}

export function normalizeStoredTaskFiles(value: unknown): TaskFile[] | null {
  if (!Array.isArray(value)) return null;

  const files = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("taskId" in item) ||
        !("name" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const taskId = String(item.taskId);
      const name = String(item.name).trim();
      if (!id || !taskId || !name) return null;
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
      const createdAt =
        "createdAt" in item && item.createdAt
          ? String(item.createdAt)
          : "2026-01-01T00:00:00.000Z";
      return { id, taskId, name, mimeType, size, hasContent, createdAt };
    })
    .filter((item): item is TaskFile => item !== null);

  return files;
}

export function sameIds(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const next = [...right].sort();
  return [...left].sort().every((id, index) => id === next[index]);
}

export function taskFileContentKey(fileId: string) {
  return `${TASK_FILE_CONTENT_PREFIX}${fileId}`;
}

const taskFileContentCache = new Map<string, string>();

export function hydrateTaskFileContents(contents: Record<string, string>) {
  taskFileContentCache.clear();
  for (const [id, content] of Object.entries(contents)) {
    taskFileContentCache.set(id, content);
  }
}

export function cacheTaskFileContent(fileId: string, content: string | null) {
  if (content) taskFileContentCache.set(fileId, content);
  else taskFileContentCache.delete(fileId);
}

export function readTaskFileContent(fileId: string): string | null {
  if (taskFileContentCache.has(fileId)) {
    return taskFileContentCache.get(fileId) ?? null;
  }
  try {
    return window.localStorage.getItem(taskFileContentKey(fileId));
  } catch {
    return null;
  }
}

export function removeTaskFileContent(fileId: string) {
  cacheTaskFileContent(fileId, null);
  try {
    window.localStorage.removeItem(taskFileContentKey(fileId));
  } catch {
    // ignore
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

export async function storeTaskFileContent(
  fileId: string,
  file: File,
): Promise<string | null> {
  if (file.size <= 0 || file.size > MAX_STORED_FILE_BYTES) return null;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    cacheTaskFileContent(fileId, dataUrl);
    return dataUrl;
  } catch {
    cacheTaskFileContent(fileId, null);
    return null;
  }
}

export function taskFilePreviewUrl(file: TaskFile): string | null {
  if (!file.hasContent) return null;
  const content = readTaskFileContent(file.id);
  if (!content) return null;
  if (content.startsWith("data:image/")) return content;
  if (file.mimeType.startsWith("image/")) return content;
  return null;
}
