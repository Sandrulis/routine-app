import { isLegacyDemoMemberId } from "@/app/lib/clear-legacy-demo-storage";
import {
  DEFAULT_LIST_ACCESS_LEVEL,
  parseAccessMap,
  parseListAccessLevel,
  type ListAccessLevel,
} from "@/app/lib/list-access";
import {
  parseTaskChecklists,
  type TaskChecklist,
} from "@/app/lib/task-checklists";

export type WorkListKind = "list" | "folder";

export type WorkList = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  sortOrder: number;
  kind: WorkListKind;
  isPrivate: boolean;
  createdBy: string | null;
  defaultAccessLevel: ListAccessLevel;
  viewerUserIds: string[];
  viewerRoleIds: string[];
  viewerUserAccess: Record<string, ListAccessLevel>;
  viewerRoleAccess: Record<string, ListAccessLevel>;
  hiddenStatusIds: string[];
  statusOrder: string[];
  statusGroupOverrides: Record<string, string>;
};

export function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );
}

export function parseStatusGroupMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: Record<string, string> = {};
  for (const [id, group] of Object.entries(value as Record<string, unknown>)) {
    if (!id.trim() || typeof group !== "string" || !group.trim()) continue;
    result[id] = group;
  }
  return result;
}

export type WorkTaskStatus = "todo" | "in_progress" | "done";
export type WorkTaskKind = "task" | "subtask" | "folder";

export type WorkTask = {
  id: string;
  listId: string;
  parentId: string | null;
  kind: WorkTaskKind;
  title: string;
  description: string;
  status: WorkTaskStatus;
  statusChangedAt: string | null;
  deletedAt: string | null;
  archivedAt: string | null;
  createdAt: string | null;
  assigneeIds: string[];
  startDate: string | null;
  dueDate: string | null;
  sortOrder: number;
  checklists: TaskChecklist[];
  hiddenStatusIds: string[];
  statusOrder: string[];
  statusGroupOverrides: Record<string, string>;
};

export type ListColor = {
  id: string;
  bg: string;
  fg: string;
};

export const LISTS_STORAGE_KEY = "routine-app-work-lists";
export const TASKS_STORAGE_KEY = "routine-app-work-tasks-v3";

export function scopedStorageKey(
  base: string,
  userId: string | null,
  teamId: string | null,
): string {
  if (userId && teamId) return `${base}:${userId}:${teamId}`;
  return base;
}

export const LIST_COLORS: ListColor[] = [
  { id: "black", bg: "#18181b", fg: "#ffffff" },
  { id: "midnight", bg: "#0f172a", fg: "#ffffff" },
  { id: "slate", bg: "#334155", fg: "#ffffff" },
  { id: "zinc", bg: "#71717a", fg: "#ffffff" },
  { id: "silver", bg: "#a1a1aa", fg: "#18181b" },
  { id: "stone", bg: "#78716c", fg: "#ffffff" },
  { id: "brown", bg: "#92400e", fg: "#ffffff" },
  { id: "navy", bg: "#1e3a8a", fg: "#ffffff" },
  { id: "indigo", bg: "#6366f1", fg: "#ffffff" },
  { id: "blue", bg: "#3b82f6", fg: "#ffffff" },
  { id: "ocean", bg: "#0284c7", fg: "#ffffff" },
  { id: "sky", bg: "#0ea5e9", fg: "#ffffff" },
  { id: "ice", bg: "#7dd3fc", fg: "#18181b" },
  { id: "cyan", bg: "#06b6d4", fg: "#ffffff" },
  { id: "teal", bg: "#14b8a6", fg: "#ffffff" },
  { id: "mint", bg: "#2dd4bf", fg: "#18181b" },
  { id: "emerald", bg: "#10b981", fg: "#ffffff" },
  { id: "green", bg: "#22c55e", fg: "#ffffff" },
  { id: "forest", bg: "#166534", fg: "#ffffff" },
  { id: "lime", bg: "#84cc16", fg: "#18181b" },
  { id: "yellow", bg: "#eab308", fg: "#18181b" },
  { id: "gold", bg: "#ca8a04", fg: "#18181b" },
  { id: "amber", bg: "#f59e0b", fg: "#18181b" },
  { id: "orange", bg: "#f97316", fg: "#ffffff" },
  { id: "peach", bg: "#fdba74", fg: "#18181b" },
  { id: "rust", bg: "#c2410c", fg: "#ffffff" },
  { id: "coral", bg: "#fb7185", fg: "#ffffff" },
  { id: "rose", bg: "#f43f5e", fg: "#ffffff" },
  { id: "red", bg: "#dc2626", fg: "#ffffff" },
  { id: "crimson", bg: "#9f1239", fg: "#ffffff" },
  { id: "pink", bg: "#ec4899", fg: "#ffffff" },
  { id: "fuchsia", bg: "#d946ef", fg: "#ffffff" },
  { id: "purple", bg: "#a855f7", fg: "#ffffff" },
  { id: "violet", bg: "#8b5cf6", fg: "#ffffff" },
  { id: "lavender", bg: "#c4b5fd", fg: "#18181b" },
  { id: "grape", bg: "#7c3aed", fg: "#ffffff" },
  { id: "sand", bg: "#d6d3d1", fg: "#18181b" },
  { id: "aqua", bg: "#67e8f9", fg: "#18181b" },
];

export const DEFAULT_LIST_COLOR = "blue";

export const LIST_ICON_OPTIONS = [
  "fas fa-folder",
  "fas fa-folder-open",
  "fas fa-folder-tree",
  "fas fa-briefcase",
  "fas fa-building",
  "fas fa-house",
  "fas fa-users",
  "fas fa-user",
  "fas fa-people-group",
  "fas fa-handshake",
  "fas fa-star",
  "fas fa-heart",
  "fas fa-bookmark",
  "fas fa-flag",
  "fas fa-tag",
  "fas fa-tags",
  "fas fa-layer-group",
  "fas fa-clipboard-list",
  "fas fa-list-check",
  "fas fa-list",
  "fas fa-table",
  "fas fa-table-columns",
  "fas fa-border-all",
  "fas fa-calendar",
  "fas fa-calendar-days",
  "fas fa-clock",
  "fas fa-inbox",
  "fas fa-envelope",
  "fas fa-paper-plane",
  "fas fa-phone",
  "fas fa-comments",
  "fas fa-comment",
  "fas fa-bell",
  "fas fa-rocket",
  "fas fa-bullseye",
  "fas fa-chart-line",
  "fas fa-chart-pie",
  "fas fa-chart-column",
  "fas fa-file",
  "fas fa-file-lines",
  "fas fa-box",
  "fas fa-boxes-stacked",
  "fas fa-cube",
  "fas fa-cubes",
  "fas fa-puzzle-piece",
  "fas fa-cart-shopping",
  "fas fa-store",
  "fas fa-credit-card",
  "fas fa-wallet",
  "fas fa-coins",
  "fas fa-landmark",
  "fas fa-globe",
  "fas fa-map",
  "fas fa-map-pin",
  "fas fa-location-dot",
  "fas fa-car",
  "fas fa-truck",
  "fas fa-plane",
  "fas fa-ship",
  "fas fa-bicycle",
  "fas fa-anchor",
  "fas fa-wrench",
  "fas fa-gears",
  "fas fa-gear",
  "fas fa-screwdriver-wrench",
  "fas fa-lightbulb",
  "fas fa-bolt",
  "fas fa-fire",
  "fas fa-leaf",
  "fas fa-seedling",
  "fas fa-tree",
  "fas fa-sun",
  "fas fa-moon",
  "fas fa-cloud",
  "fas fa-camera",
  "fas fa-image",
  "fas fa-palette",
  "fas fa-pen",
  "fas fa-book",
  "fas fa-graduation-cap",
  "fas fa-flask",
  "fas fa-stethoscope",
  "fas fa-heart-pulse",
  "fas fa-dumbbell",
  "fas fa-futbol",
  "fas fa-music",
  "fas fa-headphones",
  "fas fa-video",
  "fas fa-tv",
  "fas fa-desktop",
  "fas fa-laptop",
  "fas fa-mobile-screen",
  "fas fa-code",
  "fas fa-terminal",
  "fas fa-bug",
  "fas fa-database",
  "fas fa-server",
  "fas fa-cloud-arrow-up",
  "fas fa-lock",
  "fas fa-key",
  "fas fa-shield-halved",
  "fas fa-link",
  "fas fa-share-nodes",
  "fas fa-hashtag",
  "fas fa-circle-check",
  "fas fa-circle-info",
  "fas fa-gift",
  "fas fa-trophy",
  "fas fa-medal",
  "fas fa-crown",
  "fas fa-gem",
  "fas fa-apple-whole",
  "fas fa-mug-saucer",
  "fas fa-utensils",
  "fas fa-paw",
  "fas fa-baby",
] as const;

export function createListId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `list-${crypto.randomUUID()}`;
  }
  return `list-${Date.now()}`;
}

export function createTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `task-${crypto.randomUUID()}`;
  }
  return `task-${Date.now()}`;
}

export function parseHexColor(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const r = withHash[1] ?? "";
    const g = withHash[2] ?? "";
    const b = withHash[3] ?? "";
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export function fadeHexColor(value: string, whiteMix = 0.58): string {
  const hex = parseHexColor(value);
  if (!hex) return value;
  const mix = Math.min(1, Math.max(0, whiteMix));
  const mixChannel = (start: number) =>
    Math.round(start + (255 - start) * mix)
      .toString(16)
      .padStart(2, "0");
  return `#${mixChannel(Number.parseInt(hex.slice(1, 3), 16))}${mixChannel(
    Number.parseInt(hex.slice(3, 5), 16),
  )}${mixChannel(Number.parseInt(hex.slice(5, 7), 16))}`;
}

function contrastFg(hex: string): string {
  const raw = hex.replace("#", "");
  const r = Number.parseInt(raw.slice(0, 2), 16);
  const g = Number.parseInt(raw.slice(2, 4), 16);
  const b = Number.parseInt(raw.slice(4, 6), 16);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;
  return luminance >= 160 ? "#18181b" : "#ffffff";
}

function defaultListTone(): ListColor {
  return LIST_COLORS.find((color) => color.id === DEFAULT_LIST_COLOR) ?? LIST_COLORS[0];
}

export function listColorById(colorId: string | null | undefined): ListColor {
  if (!colorId) return defaultListTone();
  const found = LIST_COLORS.find(
    (color) =>
      color.id === colorId || color.bg.toLowerCase() === colorId.toLowerCase(),
  );
  if (found) return found;
  const hex = parseHexColor(colorId);
  if (hex) {
    return { id: hex, bg: hex, fg: contrastFg(hex) };
  }
  return defaultListTone();
}

export function randomListColorId(): string {
  const index = Math.floor(Math.random() * LIST_COLORS.length);
  return LIST_COLORS[index]?.id ?? DEFAULT_LIST_COLOR;
}

export function listInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  return (words[0]?.[0] ?? "S").toUpperCase();
}

function siblingGroupKey(
  task: Pick<WorkTask, "listId" | "parentId" | "kind">,
) {
  const group = task.kind === "subtask" ? "subtask" : "item";
  return `${task.listId}:${task.parentId ?? ""}:${group}`;
}

export function compareBySortOrder(a: WorkTask, b: WorkTask) {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id.localeCompare(b.id);
}

function colorFromLegacyTone(tone: string | undefined, index: number): string {
  if (tone?.includes("sky")) return "sky";
  if (tone?.includes("amber")) return "amber";
  if (tone?.includes("emerald")) return "emerald";
  if (tone?.includes("violet")) return "violet";
  if (tone?.includes("rose")) return "rose";
  if (tone?.includes("orange")) return "orange";
  if (tone?.includes("blue")) return "blue";
  return LIST_COLORS[index % LIST_COLORS.length].id;
}

export function normalizeStoredLists(value: unknown): WorkList[] | null {
  if (!Array.isArray(value)) return null;

  const lists = value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("name" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const name = String(item.name).trim();
      const description =
        "description" in item && typeof item.description === "string"
          ? item.description
          : "";
      const icon =
        "icon" in item && typeof item.icon === "string" && item.icon.trim()
          ? item.icon.trim()
          : null;
      const color =
        "color" in item && typeof item.color === "string"
          ? listColorById(item.color).id
          : colorFromLegacyTone(
              "iconToneClassName" in item && typeof item.iconToneClassName === "string"
                ? item.iconToneClassName
                : undefined,
              index,
            );

      if (!id || !name) return null;
      const kind =
        "kind" in item && item.kind === "folder" ? "folder" : "list";
      const isPrivate =
        "isPrivate" in item && item.isPrivate === true;
      const createdBy =
        "createdBy" in item && typeof item.createdBy === "string"
          ? item.createdBy
          : null;
      const viewerUserIds =
        "viewerUserIds" in item && Array.isArray(item.viewerUserIds)
          ? (item.viewerUserIds as unknown[]).filter(
              (id): id is string => typeof id === "string",
            )
          : [];
      const viewerRoleIds =
        "viewerRoleIds" in item && Array.isArray(item.viewerRoleIds)
          ? (item.viewerRoleIds as unknown[]).filter(
              (id): id is string => typeof id === "string",
            )
          : [];
      const viewerUserAccess = parseAccessMap(
        "viewerUserAccess" in item ? item.viewerUserAccess : undefined,
      );
      const viewerRoleAccess = parseAccessMap(
        "viewerRoleAccess" in item ? item.viewerRoleAccess : undefined,
      );
      for (const id of viewerUserIds) {
        if (!viewerUserAccess[id]) viewerUserAccess[id] = DEFAULT_LIST_ACCESS_LEVEL;
      }
      for (const id of viewerRoleIds) {
        if (!viewerRoleAccess[id]) viewerRoleAccess[id] = DEFAULT_LIST_ACCESS_LEVEL;
      }
      return {
        id,
        name,
        description,
        icon,
        color,
        kind,
        isPrivate,
        createdBy,
        defaultAccessLevel: parseListAccessLevel(
          "defaultAccessLevel" in item ? item.defaultAccessLevel : undefined,
        ),
        viewerUserIds: Object.keys(viewerUserAccess),
        viewerRoleIds: Object.keys(viewerRoleAccess),
        viewerUserAccess,
        viewerRoleAccess,
        hiddenStatusIds: parseIdList(
          "hiddenStatusIds" in item ? item.hiddenStatusIds : [],
        ),
        statusOrder: parseIdList("statusOrder" in item ? item.statusOrder : []),
        statusGroupOverrides: parseStatusGroupMap(
          "statusGroupOverrides" in item ? item.statusGroupOverrides : {},
        ),
      };
    })
    .filter((item): item is WorkList => item !== null);

  return lists;
}

function readIsoDate(item: object, key: string): string | null {
  if (!(key in item)) return null;
  const value = (item as Record<string, unknown>)[key];
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  return value;
}

function readAssigneeIds(item: object): string[] {
  if ("assigneeIds" in item && Array.isArray(item.assigneeIds)) {
    return item.assigneeIds
      .filter((id): id is string => typeof id === "string" && id.trim() !== "")
      .map((id) => id.trim())
      .filter((id) => !isLegacyDemoMemberId(id));
  }
  if ("assigneeId" in item && typeof item.assigneeId === "string" && item.assigneeId) {
    return isLegacyDemoMemberId(item.assigneeId) ? [] : [item.assigneeId];
  }
  return [];
}

export function normalizeStoredTasks(value: unknown): WorkTask[] | null {
  if (!Array.isArray(value)) return null;

  const tasks = value
    .map((item, index) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("listId" in item) ||
        !("title" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const listId = String(item.listId);
      const title = String(item.title).trim();
      const description =
        "description" in item && typeof item.description === "string"
          ? item.description
          : "";
      const parentId =
        "parentId" in item && typeof item.parentId === "string"
          ? item.parentId
          : null;
      const kind =
        "kind" in item && item.kind === "folder"
          ? "folder"
          : "kind" in item && item.kind === "subtask"
            ? "subtask"
            : "kind" in item && item.kind === "task"
              ? "task"
              : parentId
                ? "subtask"
                : "task";
      const status =
        "status" in item &&
        (item.status === "in_progress" || item.status === "done")
          ? item.status
          : "todo";
      const assigneeIds = readAssigneeIds(item);
      const startDate = readIsoDate(item, "startDate");
      const dueDate = readIsoDate(item, "dueDate");
      const sortOrder =
        "sortOrder" in item &&
        typeof item.sortOrder === "number" &&
        Number.isFinite(item.sortOrder)
          ? item.sortOrder
          : index;
      const statusChangedAt =
        "statusChangedAt" in item &&
        (typeof item.statusChangedAt === "string" || item.statusChangedAt === null)
          ? item.statusChangedAt
          : null;
      const deletedAt =
        "deletedAt" in item &&
        (typeof item.deletedAt === "string" || item.deletedAt === null)
          ? item.deletedAt
          : null;
      const archivedAt =
        "archivedAt" in item &&
        (typeof item.archivedAt === "string" || item.archivedAt === null)
          ? item.archivedAt
          : null;
      const checklists = parseTaskChecklists(
        "checklists" in item ? item.checklists : [],
      );

      if (!id || !listId || !title) return null;
      return {
        id,
        listId,
        parentId,
        kind,
        title,
        description,
        status,
        statusChangedAt,
        deletedAt,
        archivedAt,
        createdAt:
          "createdAt" in item &&
          (typeof item.createdAt === "string" || item.createdAt === null)
            ? item.createdAt
            : null,
        assigneeIds,
        startDate,
        dueDate,
        sortOrder,
        checklists,
        hiddenStatusIds: parseIdList(
          "hiddenStatusIds" in item ? item.hiddenStatusIds : [],
        ),
        statusOrder: parseIdList("statusOrder" in item ? item.statusOrder : []),
        statusGroupOverrides: parseStatusGroupMap(
          "statusGroupOverrides" in item ? item.statusGroupOverrides : {},
        ),
      };
    })
    .filter((item): item is WorkTask => item !== null);

  return tasks;
}

export function isWorkSubtask(task: WorkTask): boolean {
  return task.kind === "subtask";
}

export function isWorkFolder(task: WorkTask): boolean {
  return task.kind === "folder";
}

export function workItemIcon(task: WorkTask): string {
  if (task.kind === "folder") return "far fa-folder";
  if (task.kind === "subtask") return "far fa-circle";
  return "fas fa-list-check";
}

export function isWorkItemArchived(task: Pick<WorkTask, "archivedAt">): boolean {
  return Boolean(task.archivedAt);
}

function parentIsArchived(tasks: WorkTask[], parentId: string | null): boolean {
  if (!parentId) return false;
  const parent = tasks.find((task) => task.id === parentId);
  return Boolean(parent && isWorkItemArchived(parent));
}

export function getListTasks(tasks: WorkTask[], listId: string): WorkTask[] {
  return tasks
    .filter(
      (task) =>
        task.listId === listId &&
        task.parentId === null &&
        task.kind !== "subtask" &&
        !isWorkItemArchived(task),
    )
    .sort(compareBySortOrder);
}

export function getArchivedListRoots(
  tasks: WorkTask[],
  listId: string,
): WorkTask[] {
  return tasks
    .filter((task) => {
      if (
        task.listId !== listId ||
        task.kind === "subtask" ||
        !isWorkItemArchived(task)
      ) {
        return false;
      }
      return !parentIsArchived(tasks, task.parentId);
    })
    .sort(compareBySortOrder);
}

export function getChildTasks(tasks: WorkTask[], parentId: string): WorkTask[] {
  const archived = parentIsArchived(tasks, parentId);
  return tasks
    .filter(
      (task) =>
        task.parentId === parentId &&
        task.kind !== "subtask" &&
        isWorkItemArchived(task) === archived,
    )
    .sort(compareBySortOrder);
}

export function collectTaskSubtreeIds(
  tasks: WorkTask[],
  rootId: string,
): string[] {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const task of tasks) {
      if (task.parentId && ids.has(task.parentId) && !ids.has(task.id)) {
        ids.add(task.id);
        added = true;
      }
    }
  }
  return [...ids];
}

export function getTaskTree(tasks: WorkTask[], listId: string): WorkTask[] {
  const result: WorkTask[] = [];

  function walk(parentId: string | null) {
    const items = parentId
      ? getChildTasks(tasks, parentId)
      : getListTasks(tasks, listId);
    for (const item of items) {
      result.push(item);
      walk(item.id);
    }
  }

  walk(null);
  return result;
}

export function getSubtasks(tasks: WorkTask[], parentId: string): WorkTask[] {
  const archived = parentIsArchived(tasks, parentId);
  return tasks
    .filter(
      (task) =>
        task.parentId === parentId &&
        task.kind === "subtask" &&
        isWorkItemArchived(task) === archived,
    )
    .sort(compareBySortOrder);
}

export function getDescendantWorkItems(
  tasks: WorkTask[],
  parentId: string,
): WorkTask[] {
  const result: WorkTask[] = [];
  for (const child of getChildTasks(tasks, parentId)) {
    result.push(child);
    result.push(...getDescendantWorkItems(tasks, child.id));
  }
  return result;
}

export function getDescendantSubtasks(
  tasks: WorkTask[],
  parentId: string,
): WorkTask[] {
  const result: WorkTask[] = [];
  for (const child of getChildTasks(tasks, parentId)) {
    result.push(...getSubtasks(tasks, child.id));
    result.push(...getDescendantSubtasks(tasks, child.id));
  }
  return result;
}

export function isTaskDeleted(task: Pick<WorkTask, "deletedAt">): boolean {
  return Boolean(task.deletedAt);
}

export function isClosedTaskStatus(
  status: string,
  catalog?: { id: string; groupKey: string }[],
): boolean {
  const row = catalog?.find((item) => item.id === status);
  if (row) return row.groupKey === "closed";
  return status === "done";
}

export function isTaskActiveInLists(
  task: WorkTask,
  catalog?: { id: string; groupKey: string }[],
): boolean {
  return (
    !isTaskDeleted(task) &&
    !isWorkItemArchived(task) &&
    !isClosedTaskStatus(task.status, catalog)
  );
}

export function isTaskInArchive(
  task: WorkTask,
  catalog?: { id: string; groupKey: string }[],
): boolean {
  return isTaskDeleted(task) || isClosedTaskStatus(task.status, catalog);
}

export function nextSortOrder(
  tasks: WorkTask[],
  input: Pick<WorkTask, "listId" | "parentId" | "kind">,
): number {
  const key = siblingGroupKey(input);
  return (
    tasks
      .filter((task) => siblingGroupKey(task) === key)
      .reduce((max, task) => Math.max(max, task.sortOrder), -1) + 1
  );
}

export function applySortOrder(
  tasks: WorkTask[],
  orderedIds: string[],
): WorkTask[] {
  return tasks.map((task) => {
    const index = orderedIds.indexOf(task.id);
    if (index < 0) return task;
    return { ...task, sortOrder: index };
  });
}

export function getTaskAncestors(
  tasks: WorkTask[],
  task: WorkTask,
): WorkTask[] {
  const chain: WorkTask[] = [];
  const seen = new Set<string>();
  let currentId = task.parentId;

  while (currentId && !seen.has(currentId)) {
    seen.add(currentId);
    const parent = tasks.find((item) => item.id === currentId);
    if (!parent) break;
    if (parent.kind !== "subtask") chain.unshift(parent);
    currentId = parent.parentId;
  }

  return chain;
}

export type TaskLocationSegment =
  | { type: "list"; listId: string; label: string }
  | { type: "folder" | "task"; listId: string; taskId: string; label: string };

function ancestorsToLocationSegments(ancestors: WorkTask[]): TaskLocationSegment[] {
  return ancestors.map((item) => ({
    type: item.kind === "folder" ? "folder" : "task",
    listId: item.listId,
    taskId: item.id,
    label: item.title,
  }));
}

export function getSubtaskLocationSegments(
  tasks: WorkTask[],
  task: WorkTask,
  listName: string | null | undefined,
  options?: { includeListName?: boolean },
): TaskLocationSegment[] {
  const includeListName = options?.includeListName ?? true;
  const segments: TaskLocationSegment[] = [];
  if (includeListName && listName) {
    segments.push({ type: "list", listId: task.listId, label: listName });
  }
  segments.push(...ancestorsToLocationSegments(getTaskAncestors(tasks, task)));
  return segments;
}

export function getParentTaskLocationSegments(
  tasks: WorkTask[],
  parentId: string,
  listId: string,
  listName: string | null | undefined,
): TaskLocationSegment[] {
  const segments: TaskLocationSegment[] = [];
  if (listName) {
    segments.push({ type: "list", listId, label: listName });
  }
  const parent = tasks.find((item) => item.id === parentId);
  if (!parent) return segments;
  segments.push(
    ...ancestorsToLocationSegments([
      ...getTaskAncestors(tasks, parent),
      parent,
    ]),
  );
  return segments;
}

export function formatTaskLocationPath(
  listName: string | null | undefined,
  ancestors: WorkTask[],
  options?: { includeListName?: boolean },
): string {
  const includeListName = options?.includeListName ?? true;
  return [
    ...(includeListName && listName ? [listName] : []),
    ...ancestors.map((item) => item.title),
  ]
    .filter(Boolean)
    .join(" / ");
}

export function getSubtaskLocationPath(
  tasks: WorkTask[],
  task: WorkTask,
  listName: string | null | undefined,
  options?: { includeListName?: boolean },
): string {
  return formatTaskLocationPath(
    listName,
    getTaskAncestors(tasks, task),
    options,
  );
}

export function getParentTaskLocationPath(
  tasks: WorkTask[],
  parentId: string,
  listName: string | null | undefined,
): string {
  const parent = tasks.find((item) => item.id === parentId);
  if (!parent) {
    return listName ?? "";
  }
  return formatTaskLocationPath(listName, [
    ...getTaskAncestors(tasks, parent),
    parent,
  ]);
}

export type WorkProgressCatalog = { id: string; groupKey: string }[];

export type WorkProgress = {
  done: number;
  total: number;
  percent: number;
};

export function emptyWorkProgress(): WorkProgress {
  return { done: 0, total: 0, percent: 0 };
}

function workProgressFromCounts(done: number, total: number): WorkProgress {
  return {
    done,
    total,
    percent: total <= 0 ? 0 : Math.round((done / total) * 100),
  };
}

export function sumWorkProgress(
  left: WorkProgress,
  right: WorkProgress,
): WorkProgress {
  return workProgressFromCounts(left.done + right.done, left.total + right.total);
}

function isProgressCountable(task: Pick<WorkTask, "deletedAt">) {
  return !isTaskDeleted(task);
}

export function workProgressFromItems(
  items: WorkTask[],
  catalog?: WorkProgressCatalog,
): WorkProgress {
  const visible = items.filter(isProgressCountable);
  if (visible.length === 0) return emptyWorkProgress();
  const done = visible.filter((item) =>
    isClosedTaskStatus(item.status, catalog),
  ).length;
  return workProgressFromCounts(done, visible.length);
}

function progressChildTasks(tasks: WorkTask[], parentId: string): WorkTask[] {
  return tasks.filter(
    (task) =>
      task.parentId === parentId &&
      task.kind !== "subtask" &&
      isProgressCountable(task),
  );
}

function progressSubtasks(tasks: WorkTask[], parentId: string): WorkTask[] {
  return tasks.filter(
    (task) =>
      task.parentId === parentId &&
      task.kind === "subtask" &&
      isProgressCountable(task),
  );
}

function progressListRoots(tasks: WorkTask[], listId: string): WorkTask[] {
  return tasks.filter(
    (task) =>
      task.listId === listId &&
      task.parentId === null &&
      task.kind !== "subtask" &&
      isProgressCountable(task),
  );
}

function progressDescendantTasks(tasks: WorkTask[], parentId: string): WorkTask[] {
  const result: WorkTask[] = [];
  for (const child of progressChildTasks(tasks, parentId)) {
    if (child.kind === "task") result.push(child);
    result.push(...progressDescendantTasks(tasks, child.id));
  }
  return result;
}

export function taskProgress(
  task: WorkTask,
  children: WorkTask[],
  catalog?: WorkProgressCatalog,
): WorkProgress {
  const counted = workProgressFromItems(children, catalog);
  if (counted.total > 0) return counted;
  const closed = isClosedTaskStatus(task.status, catalog);
  return { done: closed ? 1 : 0, total: 0, percent: closed ? 100 : 0 };
}

export function workProgressById(
  allTasks: WorkTask[],
  catalog?: WorkProgressCatalog,
): Map<string, WorkProgress> {
  const map = new Map<string, WorkProgress>();
  const visiting = new Set<string>();

  function compute(task: WorkTask): WorkProgress {
    const cached = map.get(task.id);
    if (cached) return cached;
    if (visiting.has(task.id)) return emptyWorkProgress();
    visiting.add(task.id);

    let result: WorkProgress;
    if (!isProgressCountable(task)) {
      result = emptyWorkProgress();
    } else if (isWorkSubtask(task)) {
      const closed = isClosedTaskStatus(task.status, catalog);
      result = {
        done: closed ? 1 : 0,
        total: 1,
        percent: closed ? 100 : 0,
      };
    } else if (isWorkFolder(task)) {
      const children = progressChildTasks(allTasks, task.id);
      result = children.reduce(
        (acc, child) => sumWorkProgress(acc, compute(child)),
        emptyWorkProgress(),
      );
      if (result.total === 0) {
        result = workProgressFromItems(
          progressDescendantTasks(allTasks, task.id),
          catalog,
        );
      }
    } else {
      result = taskProgress(task, progressSubtasks(allTasks, task.id), catalog);
    }

    visiting.delete(task.id);
    map.set(task.id, result);
    return result;
  }

  for (const task of allTasks) {
    compute(task);
  }
  return map;
}

export function listProgress(
  listId: string,
  allTasks: WorkTask[],
  catalog?: WorkProgressCatalog,
  progressById?: Map<string, WorkProgress>,
): WorkProgress {
  const byId = progressById ?? workProgressById(allTasks, catalog);
  const roots = progressListRoots(allTasks, listId);
  const summed = roots.reduce(
    (acc, task) =>
      sumWorkProgress(acc, byId.get(task.id) ?? emptyWorkProgress()),
    emptyWorkProgress(),
  );
  if (summed.total > 0) return summed;
  return workProgressFromItems(
    allTasks.filter(
      (task) =>
        task.listId === listId &&
        task.kind === "task" &&
        isProgressCountable(task),
    ),
    catalog,
  );
}
