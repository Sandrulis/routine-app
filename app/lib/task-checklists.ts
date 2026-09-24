export type TaskChecklistItem = {
  id: string;
  title: string;
  done: boolean;
  timeLogs: ChecklistTimeLog[];
  activeTimer: ChecklistActiveTimer | null;
};

export type ChecklistActorKind = "factory" | "member";

export type ChecklistActor = {
  id: string;
  name: string;
  kind: ChecklistActorKind;
};

export type ChecklistTimeLog = {
  id: string;
  startedAt: string;
  endedAt: string;
  spentMs: number;
  actorId?: string;
  actorName?: string;
  actorKind?: ChecklistActorKind;
};

export type ChecklistActiveTimer = {
  startedAt: string;
  accumulatedMs: number;
  runningSince: string | null;
  actorId?: string;
  actorName?: string;
  actorKind?: ChecklistActorKind;
};

export type TaskChecklist = {
  id: string;
  title: string;
  items: TaskChecklistItem[];
};

export function createChecklistId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `checklist-${crypto.randomUUID()}`;
  }
  return `checklist-${Date.now()}`;
}

export function createChecklistItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `checklist-item-${crypto.randomUUID()}`;
  }
  return `checklist-item-${Date.now()}`;
}

export function createChecklistTimeLogId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `checklist-time-${crypto.randomUUID()}`;
  }
  return `checklist-time-${Date.now()}`;
}

export function emptyChecklist(): TaskChecklist {
  return {
    id: createChecklistId(),
    title: "",
    items: [],
  };
}

function parseIso(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  return value;
}

function parseSpentMs(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : 0;
}

function parseTimeLog(value: unknown): ChecklistTimeLog | null {
  if (typeof value !== "object" || value === null || !("id" in value)) return null;
  const id = String((value as { id: unknown }).id).trim();
  const startedAt = "startedAt" in value ? parseIso(value.startedAt) : null;
  const endedAt = "endedAt" in value ? parseIso(value.endedAt) : null;
  if (!id || !startedAt || !endedAt) return null;
  const spentMs = "spentMs" in value ? parseSpentMs(value.spentMs) : 0;
  return { id, startedAt, endedAt, spentMs, ...parseActor(value) };
}

function parseActiveTimer(value: unknown): ChecklistActiveTimer | null {
  if (typeof value !== "object" || value === null) return null;
  const startedAt = "startedAt" in value ? parseIso(value.startedAt) : null;
  if (!startedAt) return null;
  const accumulatedMs =
    "accumulatedMs" in value ? parseSpentMs(value.accumulatedMs) : 0;
  const runningSince =
    "runningSince" in value ? parseIso(value.runningSince) : null;
  return { startedAt, accumulatedMs, runningSince, ...parseActor(value) };
}

function parseActor(value: object): Pick<ChecklistActiveTimer, "actorId" | "actorName" | "actorKind"> {
  const actorId = "actorId" in value && typeof value.actorId === "string" ? value.actorId.trim() : "";
  const actorName = "actorName" in value && typeof value.actorName === "string" ? value.actorName.trim() : "";
  const actorKind =
    "actorKind" in value && (value.actorKind === "factory" || value.actorKind === "member")
      ? value.actorKind
      : undefined;
  if (!actorId || !actorName || !actorKind) return {};
  return { actorId, actorName, actorKind };
}

export function checklistTimerOwnedBy(
  timer: Pick<ChecklistActiveTimer, "actorId" | "actorKind"> | null | undefined,
  actor: ChecklistActor | null | undefined,
) {
  if (!timer?.actorId || !timer.actorKind) return true;
  return Boolean(actor && timer.actorId === actor.id && timer.actorKind === actor.kind);
}

export function checklistActiveSpentMs(
  timer: ChecklistActiveTimer,
  nowMs = Date.now(),
): number {
  if (!timer.runningSince) return timer.accumulatedMs;
  const extra = nowMs - Date.parse(timer.runningSince);
  return timer.accumulatedMs + (Number.isFinite(extra) && extra > 0 ? extra : 0);
}

export function formatSpentDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

function emptyItemTime(): Pick<TaskChecklistItem, "timeLogs" | "activeTimer"> {
  return { timeLogs: [], activeTimer: null };
}

export function startChecklistItemTimer(
  item: TaskChecklistItem,
  nowIso = new Date().toISOString(),
  actor?: ChecklistActor | null,
): TaskChecklistItem {
  if (item.activeTimer?.runningSince) return item;
  if (item.activeTimer) {
    if (!checklistTimerOwnedBy(item.activeTimer, actor)) return item;
    return {
      ...item,
      activeTimer: { ...item.activeTimer, runningSince: nowIso },
    };
  }
  return {
    ...item,
    activeTimer: {
      startedAt: nowIso,
      accumulatedMs: 0,
      runningSince: nowIso,
      ...(actor
        ? { actorId: actor.id, actorName: actor.name, actorKind: actor.kind }
        : {}),
    },
  };
}

export function pauseChecklistItemTimer(
  item: TaskChecklistItem,
  nowMs = Date.now(),
  actor?: ChecklistActor | null,
): TaskChecklistItem {
  const timer = item.activeTimer;
  if (!timer?.runningSince || !checklistTimerOwnedBy(timer, actor)) return item;
  return {
    ...item,
    activeTimer: {
      ...timer,
      accumulatedMs: checklistActiveSpentMs(timer, nowMs),
      runningSince: null,
    },
  };
}

export function stopChecklistItemTimer(
  item: TaskChecklistItem,
  nowIso = new Date().toISOString(),
  nowMs = Date.now(),
  actor?: ChecklistActor | null,
): TaskChecklistItem {
  const timer = item.activeTimer;
  if (!timer || !checklistTimerOwnedBy(timer, actor)) return item;
  return {
    ...item,
    activeTimer: null,
    timeLogs: [
      ...(item.timeLogs ?? []),
      {
        id: createChecklistTimeLogId(),
        startedAt: timer.startedAt,
        endedAt: nowIso,
        spentMs: checklistActiveSpentMs(timer, nowMs),
        ...(timer.actorId && timer.actorName && timer.actorKind
          ? {
              actorId: timer.actorId,
              actorName: timer.actorName,
              actorKind: timer.actorKind,
            }
          : {}),
      },
    ],
  };
}

function parseItem(value: unknown): TaskChecklistItem | null {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return null;
  }
  const id = String((value as { id: unknown }).id).trim();
  if (!id) return null;
  const title =
    "title" in value && typeof value.title === "string" ? value.title : "";
  const done = "done" in value && value.done === true;
  const timeLogs =
    "timeLogs" in value && Array.isArray(value.timeLogs)
      ? value.timeLogs
          .map(parseTimeLog)
          .filter((entry): entry is ChecklistTimeLog => entry !== null)
      : [];
  const activeTimer =
    "activeTimer" in value ? parseActiveTimer(value.activeTimer) : null;
  return { id, title, done, timeLogs, activeTimer };
}

function parseChecklist(value: unknown): TaskChecklist | null {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return null;
  }
  const id = String((value as { id: unknown }).id).trim();
  if (!id) return null;
  const title =
    "title" in value && typeof value.title === "string" ? value.title : "";
  const items =
    "items" in value && Array.isArray(value.items)
      ? value.items
          .map(parseItem)
          .filter((item): item is TaskChecklistItem => item !== null)
      : [];
  return { id, title, items };
}

export function parseTaskChecklists(value: unknown): TaskChecklist[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseChecklist)
    .filter((item): item is TaskChecklist => item !== null);
}

export function normalizeTaskChecklists(
  checklists: TaskChecklist[],
): TaskChecklist[] {
  return checklists.map((list) => ({
    id: list.id,
    title: list.title.trim(),
    items: list.items
      .map((item) => ({
        id: item.id,
        title: item.title.trim(),
        done: item.done,
        timeLogs: (item.timeLogs ?? []).map((entry) => ({
          id: entry.id,
          startedAt: entry.startedAt,
          endedAt: entry.endedAt,
          spentMs: entry.spentMs,
          ...(entry.actorId && entry.actorName && entry.actorKind
            ? {
                actorId: entry.actorId,
                actorName: entry.actorName,
                actorKind: entry.actorKind,
              }
            : {}),
        })),
        activeTimer: item.activeTimer
          ? {
              startedAt: item.activeTimer.startedAt,
              accumulatedMs: item.activeTimer.accumulatedMs,
              runningSince: item.activeTimer.runningSince,
              ...(item.activeTimer.actorId &&
              item.activeTimer.actorName &&
              item.activeTimer.actorKind
                ? {
                    actorId: item.activeTimer.actorId,
                    actorName: item.activeTimer.actorName,
                    actorKind: item.activeTimer.actorKind,
                  }
                : {}),
            }
          : null,
      }))
      .filter((item) => item.title.length > 0),
  }));
}

export function normalizeTemplateChecklists(
  checklists: TaskChecklist[],
): TaskChecklist[] {
  return normalizeTaskChecklists(checklists).map((list) => ({
    ...list,
    items: list.items.map((item) => ({
      ...item,
      done: false,
      ...emptyItemTime(),
    })),
  }));
}

export function templateChecklistsForApply(
  checklists: TaskChecklist[],
): TaskChecklist[] {
  return normalizeTemplateChecklists(checklists).map((list) => ({
    ...list,
    id: createChecklistId(),
    items: list.items.map((item) => ({
      ...item,
      id: createChecklistItemId(),
      done: false,
    })),
  }));
}

export function checklistsEqual(
  left: TaskChecklist[],
  right: TaskChecklist[],
): boolean {
  const a = normalizeTaskChecklists(left);
  const b = normalizeTaskChecklists(right);
  if (a.length !== b.length) return false;
  return a.every((list, index) => {
    const other = b[index];
    if (!other) return false;
    if (list.id !== other.id || list.title !== other.title) return false;
    if (list.items.length !== other.items.length) return false;
    return list.items.every((item, itemIndex) => {
      const otherItem = other.items[itemIndex];
      return (
        Boolean(otherItem) &&
        item.id === otherItem.id &&
        item.title === otherItem.title &&
        item.done === otherItem.done &&
        timersEqual(item.activeTimer, otherItem.activeTimer) &&
        timeLogsEqual(item.timeLogs, otherItem.timeLogs)
      );
    });
  });
}

function timeLogsEqual(left: ChecklistTimeLog[], right: ChecklistTimeLog[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((entry, index) => {
    const other = right[index];
    return (
      Boolean(other) &&
      entry.id === other.id &&
      entry.startedAt === other.startedAt &&
      entry.endedAt === other.endedAt &&
      entry.spentMs === other.spentMs &&
      entry.actorId === other.actorId &&
      entry.actorKind === other.actorKind
    );
  });
}

function timersEqual(
  left: ChecklistActiveTimer | null,
  right: ChecklistActiveTimer | null,
): boolean {
  if (!left || !right) return left === right;
  return (
    left.startedAt === right.startedAt &&
    left.accumulatedMs === right.accumulatedMs &&
    left.runningSince === right.runningSince &&
    left.actorId === right.actorId &&
    left.actorKind === right.actorKind
  );
}

export function namedChecklistItems(checklists: TaskChecklist[]): TaskChecklistItem[] {
  return normalizeTaskChecklists(checklists).flatMap((list) => list.items);
}

export function taskHasVisibleChecklists(
  checklists: TaskChecklist[] | undefined,
): boolean {
  return (checklists ?? []).some(
    (list) => list.items.length > 0 || list.title.trim().length > 0,
  );
}

export function toggleChecklistItemDone(
  checklists: TaskChecklist[],
  listId: string,
  itemId: string,
): TaskChecklist[] {
  return checklists.map((list) =>
    list.id !== listId
      ? list
      : {
          ...list,
          items: list.items.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item,
          ),
        },
  );
}

export function taskHasIncompleteChecklists(
  checklists: TaskChecklist[] | undefined,
): boolean {
  return namedChecklistItems(checklists ?? []).some((item) => !item.done);
}

export function checklistProgress(checklists: TaskChecklist[]): {
  done: number;
  total: number;
  percent: number;
} {
  const items = namedChecklistItems(checklists);
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
