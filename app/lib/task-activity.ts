import { CURRENT_USER_ID } from "@/app/lib/team";
import type { WorkTaskStatus } from "@/app/lib/lists";
import { MAX_STORED_FILE_BYTES, mimeFromName } from "@/app/lib/list-files";

export const TASK_ACTIVITY_STORAGE_KEY = "routine-app-task-activity";
export const TASK_FILES_STORAGE_KEY = "routine-app-task-files";
export const TASK_FILE_CONTENT_PREFIX = "routine-app-task-file-content:";

export type TaskActivityKind =
  | "created"
  | "status"
  | "assignees"
  | "start_date"
  | "due_date"
  | "comment"
  | "file";

export type TaskActivity = {
  id: string;
  taskId: string;
  at: string;
  actorId: string;
  kind: TaskActivityKind;
  fromStatus?: WorkTaskStatus;
  toStatus?: WorkTaskStatus;
  assigneeIds?: string[];
  dateValue?: string | null;
  text?: string;
  fileName?: string;
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
  input: Omit<TaskActivity, "id" | "at" | "actorId"> & {
    actorId?: string;
    at?: string;
  },
): TaskActivity {
  return {
    ...input,
    id: createActivityId(),
    at: input.at ?? new Date().toISOString(),
    actorId: input.actorId ?? CURRENT_USER_ID,
  };
}

export function createDefaultActivities(): TaskActivity[] {
  return [
    createActivity({
      taskId: "task-website-copy",
      kind: "created",
      at: "2026-08-01T09:00:00",
      actorId: "anna",
    }),
    createActivity({
      taskId: "task-website-copy",
      kind: "assignees",
      assigneeIds: ["marta"],
      at: "2026-08-01T09:05:00",
      actorId: "anna",
    }),
    createActivity({
      taskId: "task-website-copy",
      kind: "status",
      fromStatus: "todo",
      toStatus: "done",
      at: "2026-08-10T16:20:00",
      actorId: "marta",
    }),
    createActivity({
      taskId: "task-website-copy",
      kind: "comment",
      text: "Sākuma lapas teksts ir gatavs pārskatīšanai.",
      at: "2026-08-10T16:22:00",
      actorId: "marta",
    }),
    createActivity({
      taskId: "task-website-copy",
      kind: "file",
      fileName: "sakuma-lapa.docx",
      at: "2026-08-10T16:23:00",
      actorId: "marta",
    }),
    createActivity({
      taskId: "task-website-launch",
      kind: "created",
      at: "2026-08-12T10:00:00",
      actorId: "janis",
    }),
    createActivity({
      taskId: "task-website-launch",
      kind: "file",
      fileName: "avansa_rekins_10018.pdf",
      at: "2026-08-12T10:05:00",
      actorId: "janis",
    }),
    createActivity({
      taskId: "task-website-launch",
      kind: "file",
      fileName: "Re Jumta kopnu piegade.html",
      at: "2026-08-12T10:08:00",
      actorId: "janis",
    }),
    createActivity({
      taskId: "task-website-photos",
      kind: "created",
      at: "2026-08-08T11:30:00",
      actorId: "anna",
    }),
    createActivity({
      taskId: "task-ozols-offer",
      kind: "created",
      at: "2026-08-05T08:40:00",
      actorId: "kristaps",
    }),
  ];
}

export function createDefaultTaskFiles(): TaskFile[] {
  return [
    {
      id: "task-file-copy",
      taskId: "task-website-copy",
      name: "sakuma-lapa.docx",
      mimeType: mimeFromName("sakuma-lapa.docx"),
      size: 24_576,
      hasContent: false,
      createdAt: "2026-08-10T16:23:00.000Z",
    },
    {
      id: "task-file-launch-invoice",
      taskId: "task-website-launch",
      name: "avansa_rekins_10018.pdf",
      mimeType: "application/pdf",
      size: 186_112,
      hasContent: true,
      createdAt: "2026-08-12T10:05:00.000Z",
    },
    {
      id: "task-file-launch-email",
      taskId: "task-website-launch",
      name: "Re Jumta kopnu piegade.html",
      mimeType: "text/html",
      size: 18_432,
      hasContent: true,
      createdAt: "2026-08-12T10:08:00.000Z",
    },
  ];
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
          : CURRENT_USER_ID;

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

export function readTaskFileContent(fileId: string): string | null {
  try {
    return window.localStorage.getItem(taskFileContentKey(fileId));
  } catch {
    return null;
  }
}

export function removeTaskFileContent(fileId: string) {
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
): Promise<boolean> {
  if (file.size <= 0 || file.size > MAX_STORED_FILE_BYTES) return false;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    window.localStorage.setItem(taskFileContentKey(fileId), dataUrl);
    return true;
  } catch {
    removeTaskFileContent(fileId);
    return false;
  }
}

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const DEMO_TASK_FILE_PREVIEWS: Record<string, string> = {
  "task-file-launch-invoice": svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
  <rect width="240" height="160" fill="#f4f4f5"/>
  <rect x="14" y="10" width="212" height="140" fill="#fff" stroke="#e4e4e7"/>
  <text x="26" y="36" font-family="system-ui,sans-serif" font-size="12" font-weight="700" fill="#18181b">AVANSA REKINS</text>
  <text x="26" y="52" font-family="system-ui,sans-serif" font-size="9" fill="#71717a">Nr. 10018</text>
  <rect x="26" y="66" width="188" height="5" fill="#d4d4d8"/>
  <rect x="26" y="80" width="148" height="5" fill="#e4e4e7"/>
  <rect x="26" y="94" width="168" height="5" fill="#e4e4e7"/>
  <rect x="26" y="108" width="112" height="5" fill="#e4e4e7"/>
  <rect x="26" y="126" width="72" height="12" fill="#dbeafe"/>
</svg>`),
  "task-file-launch-email": svgDataUrl(`
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="160" viewBox="0 0 240 160">
  <rect width="240" height="160" fill="#eef2ff"/>
  <rect x="12" y="10" width="216" height="140" fill="#fff" stroke="#e4e4e7"/>
  <rect x="12" y="10" width="216" height="28" fill="#f4f4f5"/>
  <text x="24" y="28" font-family="system-ui,sans-serif" font-size="9" fill="#52525b">Re: Jumta kopnu piegade</text>
  <rect x="24" y="52" width="120" height="6" fill="#d4d4d8"/>
  <rect x="24" y="68" width="188" height="5" fill="#e4e4e7"/>
  <rect x="24" y="82" width="176" height="5" fill="#e4e4e7"/>
  <rect x="24" y="96" width="152" height="5" fill="#e4e4e7"/>
  <rect x="24" y="110" width="164" height="5" fill="#e4e4e7"/>
  <rect x="24" y="128" width="88" height="10" fill="#dbeafe"/>
</svg>`),
};

export function mergeDefaultTaskFiles(files: TaskFile[]): TaskFile[] {
  const defaults = createDefaultTaskFiles();
  const ids = new Set(files.map((file) => file.id));
  const missing = defaults.filter((file) => !ids.has(file.id));
  return missing.length ? [...files, ...missing] : files;
}

export function ensureDefaultTaskFileContents() {
  if (typeof window === "undefined") return;
  for (const [id, dataUrl] of Object.entries(DEMO_TASK_FILE_PREVIEWS)) {
    const key = taskFileContentKey(id);
    try {
      if (!window.localStorage.getItem(key)) {
        window.localStorage.setItem(key, dataUrl);
      }
    } catch {
      // ignore quota
    }
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
