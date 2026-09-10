import { isWorkItemArchived, type WorkTask } from "@/app/lib/lists";
import type { WorkTaskStatusDef } from "@/app/lib/list-statuses";
import {
  templateTreeChildren,
  type TemplateTaskStatusDef,
  type WorkTemplateItem,
} from "@/app/lib/templates";

export type MissingFolderStatus = {
  parentTaskId: string;
  listId: string;
  statuses: TemplateTaskStatusDef[];
  templateItem: WorkTemplateItem;
};

function statusLabelKey(label: string) {
  return label.trim().toLocaleLowerCase();
}

function titleKey(title: string) {
  return title.trim().toLocaleLowerCase();
}

function uniqueIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function sameIdList(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

function sameIdSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const other = new Set(right);
  return left.every((id) => other.has(id));
}

function sameOverrides(
  left: Record<string, string>,
  right: Record<string, string>,
): boolean {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every((key) => left[key] === right[key]);
}

function missingStatusesForTask(
  templateStatuses: TemplateTaskStatusDef[],
  existing: WorkTaskStatusDef[],
): TemplateTaskStatusDef[] {
  const have = new Set(
    existing.map((status) => statusLabelKey(status.label)).filter(Boolean),
  );
  return templateStatuses.filter(
    (status) => status.label.trim() && !have.has(statusLabelKey(status.label)),
  );
}

export function buildTemplateStatusIdMap(
  templateStatuses: TemplateTaskStatusDef[],
  existing: WorkTaskStatusDef[],
  createdByTemplateId?: Map<string, string>,
): Map<string, string> {
  const map = new Map(createdByTemplateId);
  for (const def of templateStatuses) {
    if (map.has(def.id)) continue;
    const match = existing.find(
      (status) => statusLabelKey(status.label) === statusLabelKey(def.label),
    );
    if (match) map.set(def.id, match.id);
  }
  return map;
}

function remapTemplateId(
  id: string,
  idMap: Map<string, string>,
  templateCustomIds: Set<string>,
): string | null {
  const mapped = idMap.get(id);
  if (mapped) return mapped;
  if (templateCustomIds.has(id)) return null;
  return id;
}

export function mappedTemplateStatusLayout(
  templateItem: WorkTemplateItem,
  idMap: Map<string, string>,
  extras: {
    extraStatusIds: string[];
    statusOrder: string[];
    hiddenStatusIds: string[];
    statusGroupOverrides: Record<string, string>;
  },
): {
  statusOrder: string[];
  hiddenStatusIds: string[];
  statusGroupOverrides: Record<string, string>;
} {
  const templateCustomIds = new Set(
    (templateItem.taskStatuses ?? []).map((status) => status.id),
  );
  const remap = (id: string) => remapTemplateId(id, idMap, templateCustomIds);
  const extraSet = new Set(extras.extraStatusIds);
  const remappedOrder = uniqueIds(
    (templateItem.statusOrder ?? [])
      .map(remap)
      .filter((id): id is string => Boolean(id)),
  );

  const statusOrder = uniqueIds(
    remappedOrder.length > 0
      ? [...remappedOrder, ...extras.extraStatusIds]
      : [...extras.statusOrder, ...extras.extraStatusIds],
  );
  const hiddenStatusIds = uniqueIds([
    ...(templateItem.hiddenStatusIds ?? [])
      .map(remap)
      .filter((id): id is string => Boolean(id)),
    ...extras.hiddenStatusIds.filter((id) => extraSet.has(id)),
  ]);
  const extraOverrides = Object.fromEntries(
    Object.entries(extras.statusGroupOverrides).filter(([id]) => extraSet.has(id)),
  );
  const statusGroupOverrides = {
    ...extraOverrides,
    ...Object.fromEntries(
      Object.entries(templateItem.statusGroupOverrides ?? {})
        .map(([id, groupKey]) => [remap(id), groupKey] as const)
        .filter((entry): entry is readonly [string, string] => Boolean(entry[0])),
    ),
  };

  return { statusOrder, hiddenStatusIds, statusGroupOverrides };
}

function extraWorkStatusIds(
  existing: WorkTaskStatusDef[],
  idMap: Map<string, string>,
): string[] {
  const mapped = new Set(idMap.values());
  return existing
    .map((status) => status.id)
    .filter((id) => !mapped.has(id));
}

export function templateStatusLayoutNeedsSync(
  templateItem: WorkTemplateItem,
  workItem: WorkTask,
  existing: WorkTaskStatusDef[],
): boolean {
  const idMap = buildTemplateStatusIdMap(templateItem.taskStatuses ?? [], existing);
  const extraStatusIds = extraWorkStatusIds(existing, idMap);
  const expected = mappedTemplateStatusLayout(templateItem, idMap, {
    extraStatusIds,
    statusOrder: workItem.statusOrder ?? [],
    hiddenStatusIds: workItem.hiddenStatusIds ?? [],
    statusGroupOverrides: workItem.statusGroupOverrides ?? {},
  });

  const templateCustomIds = new Set(
    (templateItem.taskStatuses ?? []).map((status) => status.id),
  );
  const relatedIds = new Set(
    [
      ...(templateItem.statusOrder ?? []),
      ...(templateItem.hiddenStatusIds ?? []),
      ...Object.keys(templateItem.statusGroupOverrides ?? {}),
    ]
      .map((id) => remapTemplateId(id, idMap, templateCustomIds))
      .filter((id): id is string => Boolean(id)),
  );
  for (const id of idMap.values()) relatedIds.add(id);

  const actualOrder = (workItem.statusOrder ?? []).filter((id) => relatedIds.has(id));
  const expectedOrder = expected.statusOrder.filter((id) => relatedIds.has(id));
  if (!sameIdList(actualOrder, expectedOrder)) return true;

  const actualHidden = (workItem.hiddenStatusIds ?? []).filter((id) =>
    relatedIds.has(id),
  );
  const expectedHidden = expected.hiddenStatusIds.filter((id) => relatedIds.has(id));
  if (!sameIdSet(actualHidden, expectedHidden)) return true;

  const actualOverrides: Record<string, string> = {};
  const expectedOverrides: Record<string, string> = {};
  for (const id of relatedIds) {
    const actual = workItem.statusGroupOverrides?.[id];
    const next = expected.statusGroupOverrides[id];
    if (actual) actualOverrides[id] = actual;
    if (next) expectedOverrides[id] = next;
  }
  return !sameOverrides(actualOverrides, expectedOverrides);
}

function workFolderChildren(tasks: WorkTask[], parentId: string): WorkTask[] {
  return tasks
    .filter(
      (task) =>
        task.parentId === parentId &&
        task.kind !== "subtask" &&
        !task.deletedAt &&
        !isWorkItemArchived(task),
    )
    .slice()
    .sort((left, right) =>
      left.sortOrder !== right.sortOrder
        ? left.sortOrder - right.sortOrder
        : left.id.localeCompare(right.id),
    );
}

function matchWorkChild(
  templateItem: WorkTemplateItem,
  workChildren: WorkTask[],
  used: Set<string>,
): WorkTask | null {
  const wanted = titleKey(templateItem.title);
  const match = workChildren.find(
    (task) =>
      !used.has(task.id) &&
      task.kind === templateItem.kind &&
      titleKey(task.title) === wanted,
  );
  return match ?? null;
}

function collectFromBranch(
  templateItems: WorkTemplateItem[],
  templateId: string,
  templateParentId: string | null,
  workParentId: string,
  tasks: WorkTask[],
  workTaskStatuses: WorkTaskStatusDef[],
  out: MissingFolderStatus[],
) {
  const templateChildren = templateTreeChildren(
    templateItems,
    templateParentId,
    templateId,
  );
  const workChildren = workFolderChildren(tasks, workParentId);
  const used = new Set<string>();
  for (const item of templateChildren) {
    const workItem = matchWorkChild(item, workChildren, used);
    if (!workItem) continue;
    used.add(workItem.id);
    if (item.kind === "task") {
      const existing = workTaskStatuses.filter(
        (status) => status.parentTaskId === workItem.id,
      );
      const missing = missingStatusesForTask(item.taskStatuses ?? [], existing);
      if (
        missing.length > 0 ||
        templateStatusLayoutNeedsSync(item, workItem, existing)
      ) {
        out.push({
          parentTaskId: workItem.id,
          listId: workItem.listId,
          statuses: missing,
          templateItem: item,
        });
      }
    } else if (item.kind === "folder") {
      collectFromBranch(
        templateItems,
        templateId,
        item.id,
        workItem.id,
        tasks,
        workTaskStatuses,
        out,
      );
    }
  }
}

export function missingTemplateStatusesInFolder(input: {
  folderId: string;
  templateItems: WorkTemplateItem[];
  tasks: WorkTask[];
  workTaskStatuses: WorkTaskStatusDef[];
}): MissingFolderStatus[] {
  const templateId = input.templateItems[0]?.templateId ?? "";
  if (!templateId) return [];
  const out: MissingFolderStatus[] = [];
  collectFromBranch(
    input.templateItems,
    templateId,
    null,
    input.folderId,
    input.tasks,
    input.workTaskStatuses,
    out,
  );
  return out;
}

function mergeMissingStatuses(
  left: MissingFolderStatus[],
  right: MissingFolderStatus[],
): MissingFolderStatus[] {
  const byTask = new Map<string, MissingFolderStatus>();
  for (const row of [...left, ...right]) {
    const existing = byTask.get(row.parentTaskId);
    if (!existing) {
      byTask.set(row.parentTaskId, {
        ...row,
        statuses: [...row.statuses],
      });
      continue;
    }
    const have = new Set(
      existing.statuses.map((status) => statusLabelKey(status.label)),
    );
    for (const status of row.statuses) {
      const key = statusLabelKey(status.label);
      if (!key || have.has(key)) continue;
      existing.statuses.push(status);
      have.add(key);
    }
    const existingCount = existing.templateItem.taskStatuses?.length ?? 0;
    const nextCount = row.templateItem.taskStatuses?.length ?? 0;
    if (nextCount > existingCount) existing.templateItem = row.templateItem;
  }
  return [...byTask.values()];
}

export function collectMissingTemplateStatusesInFolder(input: {
  folderId: string;
  templateItemGroups: WorkTemplateItem[][];
  tasks: WorkTask[];
  workTaskStatuses: WorkTaskStatusDef[];
}): MissingFolderStatus[] {
  return input.templateItemGroups.reduce<MissingFolderStatus[]>(
    (acc, items) =>
      mergeMissingStatuses(
        acc,
        missingTemplateStatusesInFolder({
          folderId: input.folderId,
          templateItems: items,
          tasks: input.tasks,
          workTaskStatuses: input.workTaskStatuses,
        }),
      ),
    [],
  );
}

export function folderNeedsTemplateStatusSync(input: {
  folderId: string;
  templateItemGroups: WorkTemplateItem[][];
  tasks: WorkTask[];
  workTaskStatuses: WorkTaskStatusDef[];
}): boolean {
  return collectMissingTemplateStatusesInFolder(input).length > 0;
}

export function collectMissingTemplateStatusesInList(input: {
  listId: string;
  templateItemGroups: WorkTemplateItem[][];
  tasks: WorkTask[];
  workTaskStatuses: WorkTaskStatusDef[];
}): MissingFolderStatus[] {
  return input.tasks
    .filter(
      (task) =>
        task.listId === input.listId &&
        task.kind === "folder" &&
        !task.deletedAt &&
        !isWorkItemArchived(task),
    )
    .reduce(
      (acc, folder) =>
        mergeMissingStatuses(
          acc,
          collectMissingTemplateStatusesInFolder({
            folderId: folder.id,
            templateItemGroups: input.templateItemGroups,
            tasks: input.tasks,
            workTaskStatuses: input.workTaskStatuses,
          }),
        ),
      [] as MissingFolderStatus[],
    );
}

export function listNeedsTemplateStatusSync(input: {
  listId: string;
  templateItemGroups: WorkTemplateItem[][];
  tasks: WorkTask[];
  workTaskStatuses: WorkTaskStatusDef[];
}): boolean {
  return collectMissingTemplateStatusesInList(input).length > 0;
}
