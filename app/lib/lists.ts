export type WorkListKind = "list" | "folder";

export type WorkList = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  color: string;
  kind: WorkListKind;
};

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
  assigneeIds: string[];
  startDate: string | null;
  dueDate: string | null;
  sortOrder: number;
};

export type ListColor = {
  id: string;
  bg: string;
  fg: string;
};

export const LISTS_STORAGE_KEY = "routine-app-work-lists";
export const TASKS_STORAGE_KEY = "routine-app-work-tasks-v3";

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

export function createDefaultLists(): WorkList[] {
  return [
    {
      id: "list-projects",
      name: "Projekti",
      description: "Aktīvie darba projekti.",
      icon: "fas fa-folder",
      color: "sky",
      kind: "list",
    },
    {
      id: "list-clients",
      name: "Klienti",
      description: "Klientu darbi un saziņa.",
      icon: "fas fa-briefcase",
      color: "amber",
      kind: "list",
    },
  ];
}

export function createDefaultTasks(): WorkTask[] {
  return withSiblingSortOrder([
    {
      id: "task-website",
      listId: "list-projects",
      parentId: null,
      kind: "task",
      title: "Mājas lapa",
      description: "Publiskās vietnes saturs un palaišana.",
      status: "in_progress",
      assigneeIds: ["anna"],
      startDate: "2026-08-01",
      dueDate: "2026-08-30",
    },
    {
      id: "task-website-copy",
      listId: "list-projects",
      parentId: "task-website",
      kind: "subtask",
      title: "Sagatavot sākuma lapas tekstu",
      description: "",
      status: "done",
      assigneeIds: ["marta"],
      startDate: "2026-08-01",
      dueDate: "2026-08-10",
    },
    {
      id: "task-website-launch",
      listId: "list-projects",
      parentId: "task-website",
      kind: "subtask",
      title: "Pārbaudīt palaišanas soļus",
      description: "",
      status: "todo",
      assigneeIds: ["janis"],
      startDate: "2026-08-12",
      dueDate: "2026-08-20",
    },
    {
      id: "task-website-photos",
      listId: "list-projects",
      parentId: "task-website",
      kind: "subtask",
      title: "Sagatavot foto materiālu",
      description: "",
      status: "in_progress",
      assigneeIds: ["marta", "anna"],
      startDate: "2026-08-08",
      dueDate: "2026-08-18",
    },
    {
      id: "task-website-public",
      listId: "list-projects",
      parentId: "task-website",
      kind: "task",
      title: "Publiskais saturs",
      description: "Teksti un materiāli publiskajai vietnei.",
      status: "in_progress",
      assigneeIds: ["marta"],
      startDate: "2026-08-01",
      dueDate: "2026-08-22",
    },
    {
      id: "task-docs",
      listId: "list-projects",
      parentId: null,
      kind: "task",
      title: "Iekšējā dokumentācija",
      description: "Komandas darba kārtības apraksts.",
      status: "todo",
      assigneeIds: ["janis"],
      startDate: null,
      dueDate: "2026-09-01",
    },
    {
      id: "task-ozols",
      listId: "list-clients",
      parentId: null,
      kind: "task",
      title: "SIA Ozols",
      description: "Jaunā klienta onboarding.",
      status: "in_progress",
      assigneeIds: ["kristaps"],
      startDate: "2026-08-04",
      dueDate: "2026-08-25",
    },
    {
      id: "task-ozols-offer",
      listId: "list-clients",
      parentId: "task-ozols",
      kind: "subtask",
      title: "Nosūtīt piedāvājumu",
      description: "",
      status: "todo",
      assigneeIds: ["kristaps", "anna"],
      startDate: "2026-08-05",
      dueDate: "2026-08-18",
    },
    {
      id: "task-liepa",
      listId: "list-clients",
      parentId: null,
      kind: "task",
      title: "SIA Liepa",
      description: "Ikdienas saziņa un termiņi.",
      status: "todo",
      assigneeIds: [],
      startDate: null,
      dueDate: null,
    },
  ]);
}

function siblingGroupKey(
  task: Pick<WorkTask, "listId" | "parentId" | "kind">,
) {
  const group = task.kind === "subtask" ? "subtask" : "item";
  return `${task.listId}:${task.parentId ?? ""}:${group}`;
}

function withSiblingSortOrder(
  tasks: Array<Omit<WorkTask, "sortOrder">>,
): WorkTask[] {
  const counts = new Map<string, number>();
  return tasks.map((task) => {
    const key = siblingGroupKey(task);
    const sortOrder = counts.get(key) ?? 0;
    counts.set(key, sortOrder + 1);
    return { ...task, sortOrder };
  });
}

function compareBySortOrder(a: WorkTask, b: WorkTask) {
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
      return { id, name, description, icon, color, kind };
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
      .map((id) => id.trim());
  }
  if ("assigneeId" in item && typeof item.assigneeId === "string" && item.assigneeId) {
    return [item.assigneeId];
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

      if (!id || !listId || !title) return null;
      return {
        id,
        listId,
        parentId,
        kind,
        title,
        description,
        status,
        assigneeIds,
        startDate,
        dueDate,
        sortOrder,
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

export function getListTasks(tasks: WorkTask[], listId: string): WorkTask[] {
  return tasks
    .filter(
      (task) =>
        task.listId === listId && task.parentId === null && task.kind !== "subtask",
    )
    .sort(compareBySortOrder);
}

export function getChildTasks(tasks: WorkTask[], parentId: string): WorkTask[] {
  return tasks
    .filter((task) => task.parentId === parentId && task.kind !== "subtask")
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
  return tasks
    .filter((task) => task.parentId === parentId && task.kind === "subtask")
    .sort(compareBySortOrder);
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

export function taskProgress(task: WorkTask, children: WorkTask[]) {
  if (children.length === 0) {
    const percent = task.status === "done" ? 100 : 0;
    return { done: percent === 100 ? 1 : 0, total: 0, percent };
  }

  const done = children.filter((child) => child.status === "done").length;
  return {
    done,
    total: children.length,
    percent: Math.round((done / children.length) * 100),
  };
}
