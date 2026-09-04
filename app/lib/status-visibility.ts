import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

/** Groups that may have zero visible statuses in pickers (e.g. optional Done). */
export const OPTIONAL_VISIBLE_GROUPS = ["done"] as const;

/** Only one visible status at a time within these groups. */
export const EXCLUSIVE_VISIBLE_GROUPS = ["not_started", "closed"] as const;

export function isOptionalVisibleGroup(groupKey: string): boolean {
  return (OPTIONAL_VISIBLE_GROUPS as readonly string[]).includes(groupKey);
}

export function isExclusiveVisibleGroup(groupKey: string): boolean {
  return (EXCLUSIVE_VISIBLE_GROUPS as readonly string[]).includes(groupKey);
}

export function groupWouldHaveNoVisible(
  catalog: { id: string; groupKey: string }[],
  hiddenIds: string[],
  togglingOffId: string,
): boolean {
  const hidden = new Set(hiddenIds);
  const target = catalog.find((item) => item.id === togglingOffId);
  if (!target) return false;
  if (isOptionalVisibleGroup(target.groupKey)) return false;
  hidden.add(togglingOffId);
  return !catalog.some(
    (item) => item.groupKey === target.groupKey && !hidden.has(item.id),
  );
}

function enforceSingleVisibleInGroup(
  laidOut: TaskStatusSummary[],
  hidden: Set<string>,
  groupKey: string,
  eligible: (status: TaskStatusSummary) => boolean,
): void {
  const inGroup = laidOut.filter((status) => status.groupKey === groupKey);
  const choices = inGroup.filter(eligible);
  if (choices.length === 0) return;

  const keeper =
    laidOut.find(
      (status) =>
        status.groupKey === groupKey && eligible(status) && !hidden.has(status.id),
    ) ??
    laidOut.find((status) => status.groupKey === groupKey && eligible(status));

  if (!keeper) return;

  for (const status of inGroup) {
    if (status.id === keeper.id) hidden.delete(status.id);
    else hidden.add(status.id);
  }
}

/** Enforces exclusive not_started, mandatory system closed, and hides custom closed statuses. */
export function normalizeHiddenStatusIds(
  laidOut: TaskStatusSummary[],
  hiddenIds: string[],
  isSystemStatus: (status: TaskStatusSummary) => boolean,
): string[] {
  const hidden = new Set(hiddenIds);

  for (const status of laidOut) {
    if (status.groupKey === "closed" && !isSystemStatus(status)) {
      hidden.add(status.id);
    }
  }

  enforceSingleVisibleInGroup(laidOut, hidden, "not_started", () => true);
  enforceSingleVisibleInGroup(laidOut, hidden, "closed", isSystemStatus);

  return [...hidden];
}

export function hiddenIdsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((value, index) => value === b[index]);
}

export function canToggleStatusVisibility(
  laidOut: TaskStatusSummary[],
  catalog: TaskStatusSummary[],
  hiddenIds: string[],
  statusId: string,
  isSystemStatus: (status: TaskStatusSummary) => boolean,
): boolean {
  const status = catalog.find((item) => item.id === statusId);
  if (!status) return false;

  if (status.groupKey === "closed" && !isSystemStatus(status)) return false;

  const effective = normalizeHiddenStatusIds(laidOut, hiddenIds, isSystemStatus);
  const isHidden = effective.includes(statusId);
  if (isHidden) return true;

  return !groupWouldHaveNoVisible(catalog, effective, statusId);
}

export function toggleStatusVisibility(
  catalog: TaskStatusSummary[],
  hiddenIds: string[],
  statusId: string,
  isSystemStatus?: (status: TaskStatusSummary) => boolean,
): string[] | null {
  const status = catalog.find((item) => item.id === statusId);
  if (!status) return hiddenIds;

  const isSystem = isSystemStatus?.(status) ?? true;
  if (status.groupKey === "closed" && !isSystem) return null;

  const hidden = new Set(hiddenIds);

  if (hidden.has(statusId)) {
    hidden.delete(statusId);
    if (isExclusiveVisibleGroup(status.groupKey)) {
      for (const item of catalog) {
        if (item.groupKey === status.groupKey && item.id !== statusId) {
          hidden.add(item.id);
        }
      }
    }
    return [...hidden];
  }

  if (groupWouldHaveNoVisible(catalog, hiddenIds, statusId)) {
    return null;
  }
  hidden.add(statusId);
  return [...hidden];
}
