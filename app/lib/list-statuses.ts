import type { TaskStatusSummary } from "@/app/lib/site-admin/types";
import { parseHexColor } from "@/app/lib/lists";

export const LIST_STATUS_GROUPS = ["not_started", "active", "closed"] as const;

export type ListStatusGroup = (typeof LIST_STATUS_GROUPS)[number];

export type ListStatus = TaskStatusSummary & {
  listId: string;
};

export type WorkTaskStatusDef = TaskStatusSummary & {
  parentTaskId: string;
  listId: string;
};

export function createListStatusId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `lsts-${crypto.randomUUID()}`;
  }
  return `lsts-${Date.now()}`;
}

export function createWorkTaskStatusId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `wtst-${crypto.randomUUID()}`;
  }
  return `wtst-${Date.now()}`;
}

export function isListStatusGroup(value: string): value is ListStatusGroup {
  return (LIST_STATUS_GROUPS as readonly string[]).includes(value);
}

export function normalizeStatusColor(value: string): string {
  return parseHexColor(value) ?? "#71717a";
}

export function primaryStatusLabel(
  labels: Record<string, string>,
  fallback = "",
): string {
  return (
    labels.lv?.trim() ||
    Object.values(labels).find((text) => text.trim())?.trim() ||
    fallback.trim()
  );
}

export function normalizeStatusLabels(
  input: Record<string, string>,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const [code, text] of Object.entries(input)) {
    const trimmed = text.trim();
    if (trimmed) labels[code] = trimmed;
  }
  return labels;
}

export function parseStatusLabels(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const labels: Record<string, string> = {};
  for (const [code, text] of Object.entries(value as Record<string, unknown>)) {
    if (typeof text === "string" && text.trim()) {
      labels[code] = text.trim();
    }
  }
  return labels;
}

export function mapListStatusRow(row: {
  id: string;
  list_id: string;
  label: string;
  labels: unknown;
  color: string;
  sort_order: number;
  group_key: string;
}): ListStatus {
  const labels = parseStatusLabels(row.labels);
  const legacy = row.label?.trim() ?? "";
  const groupKey = isListStatusGroup(row.group_key) ? row.group_key : "active";
  return {
    id: row.id,
    listId: row.list_id,
    labels,
    label: legacy || primaryStatusLabel(labels),
    color: normalizeStatusColor(row.color),
    sortOrder: row.sort_order,
    groupKey,
  };
}

export function mapWorkTaskStatusRow(row: {
  id: string;
  parent_task_id: string;
  list_id: string;
  label: string;
  labels: unknown;
  color: string;
  sort_order: number;
  group_key: string;
}): WorkTaskStatusDef {
  const labels = parseStatusLabels(row.labels);
  const legacy = row.label?.trim() ?? "";
  const groupKey = isListStatusGroup(row.group_key) ? row.group_key : "active";
  return {
    id: row.id,
    parentTaskId: row.parent_task_id,
    listId: row.list_id,
    labels,
    label: legacy || primaryStatusLabel(labels),
    color: normalizeStatusColor(row.color),
    sortOrder: row.sort_order,
    groupKey,
  };
}

export function isCustomListStatus(
  status: TaskStatusSummary,
): status is ListStatus {
  return "listId" in status && typeof (status as ListStatus).listId === "string" && !("parentTaskId" in status);
}

export function isCustomWorkTaskStatus(
  status: TaskStatusSummary,
): status is WorkTaskStatusDef {
  return (
    "parentTaskId" in status &&
    typeof (status as WorkTaskStatusDef).parentTaskId === "string"
  );
}

export function isScopedCustomStatus(
  status: TaskStatusSummary,
): status is ListStatus | WorkTaskStatusDef {
  return isCustomListStatus(status) || isCustomWorkTaskStatus(status);
}

export function mergeStatusCatalog(
  system: TaskStatusSummary[],
  listStatuses: ListStatus[],
  listId?: string | null,
  workTaskStatuses: WorkTaskStatusDef[] = [],
  parentTaskId?: string | null,
): TaskStatusSummary[] {
  const listExtras =
    listId === undefined
      ? listStatuses
      : listId
        ? listStatuses.filter((status) => status.listId === listId)
        : [];
  const taskExtras = parentTaskId
    ? workTaskStatuses.filter((status) => status.parentTaskId === parentTaskId)
    : [];
  const seen = new Set(system.map((status) => status.id));
  const merged = [...system];
  for (const status of [...listExtras, ...taskExtras]) {
    if (seen.has(status.id)) continue;
    seen.add(status.id);
    merged.push(status);
  }
  return merged;
}

function groupIndex(groupKey: string): number {
  const index = LIST_STATUS_GROUPS.indexOf(groupKey as ListStatusGroup);
  return index < 0 ? LIST_STATUS_GROUPS.length : index;
}

/** Opposite of the status picker: closed → active → not started. */
export function statusesByPriorityDesc<T extends { id: string }>(
  catalog: T[],
): T[] {
  return catalog.slice().reverse();
}

export function resolveStatusIdForTask(
  targetStatusId: string,
  taskCatalog: { id: string; label: string; groupKey: string }[],
  mergedCatalog: { id: string; label: string; groupKey: string }[] = taskCatalog,
): string | null {
  if (taskCatalog.some((status) => status.id === targetStatusId)) {
    return targetStatusId;
  }
  const target = mergedCatalog.find((status) => status.id === targetStatusId);
  if (!target) return null;
  const sameGroup = taskCatalog.filter(
    (status) => status.groupKey === target.groupKey,
  );
  const byLabel = sameGroup.find(
    (status) =>
      status.label.trim().toLowerCase() === target.label.trim().toLowerCase(),
  );
  if (byLabel) return byLabel.id;
  return sameGroup.length === 1 ? sameGroup[0]?.id ?? null : null;
}

export function compareTasksByStatusPriority(
  a: { id: string; status: string; sortOrder: number },
  b: { id: string; status: string; sortOrder: number },
  catalog: { id: string; groupKey: string }[],
): number {
  const indexOf = (statusId: string) => {
    const index = catalog.findIndex((item) => item.id === statusId);
    return index < 0 ? -1 : index;
  };
  const left = indexOf(a.status);
  const right = indexOf(b.status);
  if (left !== right) return right - left;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id.localeCompare(b.id);
}

type StatusLayoutSource = {
  hiddenStatusIds?: string[];
  statusOrder?: string[];
  statusGroupOverrides?: Record<string, string>;
};

/** Same catalog as `useTaskStatuses(listId, parentTaskId)` — layout, hidden, singleton groups. */
export function resolveStatusCatalogs(
  system: TaskStatusSummary[],
  listStatuses: ListStatus[],
  options: {
    listId?: string | null;
    parentTaskId?: string | null;
    workTaskStatuses?: WorkTaskStatusDef[];
    list?: StatusLayoutSource | null;
    parentTask?: StatusLayoutSource | null;
  } = {},
): { laidOut: TaskStatusSummary[]; visible: TaskStatusSummary[] } {
  const {
    listId,
    parentTaskId,
    workTaskStatuses = [],
    list,
    parentTask,
  } = options;
  const merged = applyStatusGroupOverrides(
    mergeStatusCatalog(
      system,
      listStatuses,
      listId,
      workTaskStatuses,
      parentTaskId,
    ),
    {
      ...(list?.statusGroupOverrides ?? {}),
      ...(parentTask?.statusGroupOverrides ?? {}),
    },
  );
  const layoutOrder =
    parentTaskId && parentTask?.statusOrder?.length
      ? parentTask.statusOrder
      : (list?.statusOrder ?? []);
  const laidOut = applyListStatusLayout(merged, layoutOrder);
  const hiddenIds = new Set(
    parentTaskId && parentTask
      ? (parentTask.hiddenStatusIds ?? [])
      : listId && list
        ? (list.hiddenStatusIds ?? [])
        : [],
  );
  const withoutHidden = laidOut.filter((status) => !hiddenIds.has(status.id));
  const visible =
    (listId && list) || (parentTaskId && parentTask)
      ? enforceSingletonGroups(withoutHidden).catalog
      : withoutHidden;
  return { laidOut, visible };
}

export function defaultSortedStatusCatalog(
  catalog: TaskStatusSummary[],
): TaskStatusSummary[] {
  return catalog.slice().sort((left, right) => {
    const groupDiff = groupIndex(left.groupKey) - groupIndex(right.groupKey);
    if (groupDiff !== 0) return groupDiff;
    const customDiff =
      Number(isScopedCustomStatus(left)) - Number(isScopedCustomStatus(right));
    if (customDiff !== 0) return customDiff;
    return left.sortOrder - right.sortOrder || left.id.localeCompare(right.id);
  });
}

export function applyListStatusLayout(
  catalog: TaskStatusSummary[],
  order: string[] = [],
): TaskStatusSummary[] {
  const byId = new Map(catalog.map((status) => [status.id, status]));
  const seen = new Set<string>();
  const ordered: TaskStatusSummary[] = [];
  for (const id of order) {
    const status = byId.get(id);
    if (!status || seen.has(id)) continue;
    seen.add(id);
    ordered.push(status);
  }
  const remaining = defaultSortedStatusCatalog(
    catalog.filter((status) => !seen.has(status.id)),
  );
  return [...ordered, ...remaining];
}

export function groupedStatusLayout(
  catalog: TaskStatusSummary[],
  order: string[] = [],
): { id: ListStatusGroup; statuses: TaskStatusSummary[] }[] {
  const laidOut = applyListStatusLayout(catalog, order);
  return LIST_STATUS_GROUPS.map((id) => ({
    id,
    statuses: laidOut.filter((status) => status.groupKey === id),
  }));
}

export function flattenGroupedStatusIds(
  catalog: TaskStatusSummary[],
  order: string[] = [],
): string[] {
  return groupedStatusLayout(catalog, order).flatMap((group) =>
    group.statuses.map((status) => status.id),
  );
}

export const STATUS_GROUP_DROPPABLE_PREFIX = "status-group:";

export function statusGroupDroppableId(groupKey: ListStatusGroup): string {
  return `${STATUS_GROUP_DROPPABLE_PREFIX}${groupKey}`;
}

export function parseStatusGroupDroppableId(
  value: string,
): ListStatusGroup | null {
  if (!value.startsWith(STATUS_GROUP_DROPPABLE_PREFIX)) return null;
  const groupKey = value.slice(STATUS_GROUP_DROPPABLE_PREFIX.length);
  return isListStatusGroup(groupKey) ? groupKey : null;
}

export function parseStatusGroupOverrides(
  value: unknown,
): Record<string, ListStatusGroup> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const overrides: Record<string, ListStatusGroup> = {};
  for (const [id, groupKey] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!id.trim() || typeof groupKey !== "string") continue;
    if (!isListStatusGroup(groupKey)) continue;
    overrides[id] = groupKey;
  }
  return overrides;
}

export function applyStatusGroupOverrides(
  catalog: TaskStatusSummary[],
  overrides: Record<string, string> = {},
): TaskStatusSummary[] {
  return catalog.map((status) => {
    const groupKey = overrides[status.id];
    if (!groupKey || !isListStatusGroup(groupKey) || groupKey === status.groupKey) {
      return status;
    }
    return { ...status, groupKey };
  });
}

export function moveStatusInLayout(
  catalog: TaskStatusSummary[],
  order: string[],
  activeId: string,
  overId: string,
): {
  catalog: TaskStatusSummary[];
  order: string[];
  fromGroup: ListStatusGroup;
  toGroup: ListStatusGroup;
} | null {
  const flat = groupedStatusLayout(catalog, order).flatMap(
    (group) => group.statuses,
  );
  const active = flat.find((status) => status.id === activeId);
  if (!active || !isListStatusGroup(active.groupKey)) return null;
  if (activeId === overId) return null;

  const without = flat.filter((status) => status.id !== activeId);
  const droppedGroup = parseStatusGroupDroppableId(overId);
  let toGroup: ListStatusGroup | null = droppedGroup;
  let insertAt = -1;

  if (droppedGroup) {
    let lastInGroup = -1;
    for (let index = without.length - 1; index >= 0; index -= 1) {
      if (without[index].groupKey === droppedGroup) {
        lastInGroup = index;
        break;
      }
    }
    insertAt =
      lastInGroup >= 0
        ? lastInGroup + 1
        : without.findIndex(
            (status) => groupIndex(status.groupKey) > groupIndex(droppedGroup),
          );
    if (insertAt < 0) insertAt = without.length;
  } else {
    const overIndex = without.findIndex((status) => status.id === overId);
    const overStatus = without[overIndex];
    if (overIndex < 0 || !overStatus || !isListStatusGroup(overStatus.groupKey)) {
      return null;
    }
    toGroup = overStatus.groupKey;
    insertAt = overIndex;
  }

  if (!toGroup) return null;

  const moved = { ...active, groupKey: toGroup };
  const nextFlat = [
    ...without.slice(0, insertAt),
    moved,
    ...without.slice(insertAt),
  ];
  const nextCatalog = catalog.map((status) =>
    status.id === activeId ? { ...status, groupKey: toGroup } : status,
  );
  const nextOrder = LIST_STATUS_GROUPS.flatMap((groupId) =>
    nextFlat
      .filter((status) => status.groupKey === groupId)
      .map((status) => status.id),
  );

  return {
    catalog: nextCatalog,
    order: nextOrder,
    fromGroup: active.groupKey,
    toGroup,
  };
}

export function replaceGroupStatusOrder(
  catalog: TaskStatusSummary[],
  order: string[],
  groupKey: ListStatusGroup,
  groupIds: string[],
): string[] {
  return groupedStatusLayout(catalog, order).flatMap((group) =>
    group.id === groupKey
      ? groupIds
      : group.statuses.map((status) => status.id),
  );
}

export function insertStatusInGroupOrder(
  catalog: TaskStatusSummary[],
  order: string[],
  statusId: string,
  groupKey: ListStatusGroup,
): string[] {
  return groupedStatusLayout(catalog, order).flatMap((group) => {
    const ids = group.statuses
      .map((status) => status.id)
      .filter((id) => id !== statusId);
    if (group.id === groupKey) return [...ids, statusId];
    return ids;
  });
}

export const SINGLETON_STATUS_GROUPS = ["not_started", "closed"] as const;

export function isSingletonStatusGroup(
  groupKey: string,
): groupKey is (typeof SINGLETON_STATUS_GROUPS)[number] {
  return (SINGLETON_STATUS_GROUPS as readonly string[]).includes(groupKey);
}

export function applyTeamStatusLabels(
  catalog: TaskStatusSummary[],
  overrides: Record<string, string> = {},
): TaskStatusSummary[] {
  return catalog.map((status) => {
    if (isCustomListStatus(status)) return status;
    const label = overrides[status.id]?.trim();
    if (!label) return status;
    const labels = { ...status.labels };
    for (const code of Object.keys(labels)) {
      labels[code] = label;
    }
    if (Object.keys(labels).length === 0) {
      labels.lv = label;
    }
    return { ...status, label, labels };
  });
}

export function parseTeamStatusLabels(
  rows: { status_id: string; label: string }[] | null | undefined,
): Record<string, string> {
  const labels: Record<string, string> = {};
  for (const row of rows ?? []) {
    const statusId = row.status_id?.trim();
    const label = row.label?.trim();
    if (!statusId || !label) continue;
    labels[statusId] = label;
  }
  return labels;
}

/** Extra not_started / closed statuses are moved to active. */
export function enforceSingletonGroups(
  catalog: TaskStatusSummary[],
  keepIds: Partial<Record<ListStatusGroup, string>> = {},
): {
  catalog: TaskStatusSummary[];
  overrides: Record<string, ListStatusGroup>;
  displacedIds: string[];
} {
  const byId = new Map(catalog.map((status) => [status.id, { ...status }]));
  const overrides: Record<string, ListStatusGroup> = {};
  const displacedIds: string[] = [];

  for (const groupKey of SINGLETON_STATUS_GROUPS) {
    const inGroup = [...byId.values()].filter(
      (status) => status.groupKey === groupKey,
    );
    if (inGroup.length <= 1) continue;
    const preferred = keepIds[groupKey];
    const keep =
      (preferred && inGroup.some((status) => status.id === preferred)
        ? preferred
        : inGroup[0]?.id) ?? null;
    if (!keep) continue;
    for (const status of inGroup) {
      if (status.id === keep) continue;
      const next = byId.get(status.id);
      if (!next) continue;
      next.groupKey = "active";
      byId.set(status.id, next);
      overrides[status.id] = "active";
      displacedIds.push(status.id);
    }
  }

  return {
    catalog: catalog.map((status) => byId.get(status.id) ?? status),
    overrides,
    displacedIds,
  };
}

export function groupWouldBeEmpty(
  items: { id: string; groupKey: string }[],
  hiddenIds: string[] = [],
  removeId: string,
): boolean {
  const hidden = new Set(hiddenIds);
  const target = items.find((item) => item.id === removeId);
  if (!target) return false;
  return !items.some(
    (item) =>
      item.id !== removeId &&
      item.groupKey === target.groupKey &&
      !hidden.has(item.id),
  );
}

export function canRemoveStatus(
  catalog: TaskStatusSummary[],
  statusId: string,
): boolean {
  return !groupWouldBeEmpty(catalog, [], statusId);
}

export function visibleStatusIdsAfter(
  catalog: TaskStatusSummary[],
  order: string[],
  statusId: string,
): string[] {
  const laidOut = applyListStatusLayout(catalog, order);
  const remaining = laidOut.filter((status) => status.id !== statusId);
  if (remaining.length === 0) return [];
  const start = laidOut.findIndex((status) => status.id === statusId);
  const groupKey = laidOut[start]?.groupKey;
  const remainingIds = new Set(remaining.map((status) => status.id));
  const sameGroup: string[] = [];
  const others: string[] = [];
  for (let index = 0; index < laidOut.length; index += 1) {
    const actual = start < 0 ? index : (start + 1 + index) % laidOut.length;
    const candidate = laidOut[actual];
    if (!candidate || !remainingIds.has(candidate.id)) continue;
    if (groupKey && candidate.groupKey === groupKey) {
      sameGroup.push(candidate.id);
    } else {
      others.push(candidate.id);
    }
  }
  return [...sameGroup, ...others];
}
