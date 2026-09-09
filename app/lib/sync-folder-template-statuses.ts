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
};

function statusLabelKey(label: string) {
  return label.trim().toLocaleLowerCase();
}

function titleKey(title: string) {
  return title.trim().toLocaleLowerCase();
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
      const missing = missingStatusesForTask(
        item.taskStatuses ?? [],
        workTaskStatuses.filter((status) => status.parentTaskId === workItem.id),
      );
      if (missing.length > 0) {
        out.push({
          parentTaskId: workItem.id,
          listId: workItem.listId,
          statuses: missing,
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
