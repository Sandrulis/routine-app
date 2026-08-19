export type WorkTemplateItemKind = "task" | "subtask" | "folder";

export type WorkTemplate = {
  id: string;
  teamId: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: string;
};

export type WorkTemplateItem = {
  id: string;
  templateId: string;
  parentId: string | null;
  kind: WorkTemplateItemKind;
  title: string;
  description: string;
  sortOrder: number;
};

export function createTemplateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tmpl-${crypto.randomUUID()}`;
  }
  return `tmpl-${Date.now()}`;
}

export function createTemplateItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `tpli-${crypto.randomUUID()}`;
  }
  return `tpli-${Date.now()}`;
}

export function isTemplateFolder(item: WorkTemplateItem): boolean {
  return item.kind === "folder";
}

export function isTemplateSubtask(item: WorkTemplateItem): boolean {
  return item.kind === "subtask";
}

export function templateItemIcon(kind: WorkTemplateItemKind): string {
  if (kind === "folder") return "far fa-folder";
  if (kind === "subtask") return "fas fa-circle";
  return "fas fa-list-check";
}

export function templateRootItems(
  items: WorkTemplateItem[],
  templateId: string,
): WorkTemplateItem[] {
  return items
    .filter(
      (item) =>
        item.templateId === templateId &&
        item.parentId === null &&
        item.kind !== "subtask",
    )
    .slice()
    .sort(compareTemplateItems);
}

export function templateChildItems(
  items: WorkTemplateItem[],
  parentId: string,
): WorkTemplateItem[] {
  return items
    .filter((item) => item.parentId === parentId)
    .slice()
    .sort(compareTemplateItems);
}

/** Folder/task bērni (bez apakšuzdevumiem). */
export function templateTreeChildren(
  items: WorkTemplateItem[],
  parentId: string | null,
  templateId: string,
): WorkTemplateItem[] {
  if (parentId === null) {
    return templateRootItems(items, templateId);
  }
  return templateChildItems(items, parentId).filter(
    (item) => item.kind !== "subtask",
  );
}

export function templateSubtasks(
  items: WorkTemplateItem[],
  taskId: string,
): WorkTemplateItem[] {
  return templateChildItems(items, taskId).filter(
    (item) => item.kind === "subtask",
  );
}

function compareTemplateItems(
  left: WorkTemplateItem,
  right: WorkTemplateItem,
): number {
  return left.sortOrder !== right.sortOrder
    ? left.sortOrder - right.sortOrder
    : left.id.localeCompare(right.id);
}

export function collectTemplateSubtreeIds(
  items: WorkTemplateItem[],
  rootId: string,
): string[] {
  const ids = new Set<string>([rootId]);
  let added = true;
  while (added) {
    added = false;
    for (const item of items) {
      if (item.parentId && ids.has(item.parentId) && !ids.has(item.id)) {
        ids.add(item.id);
        added = true;
      }
    }
  }
  return [...ids];
}

export function sanitizeTemplateItems(
  templateId: string,
  items: WorkTemplateItem[],
): WorkTemplateItem[] {
  const next: WorkTemplateItem[] = [];

  function walkTree(parentId: string | null) {
    const siblings = templateTreeChildren(items, parentId, templateId).filter(
      (item) => item.title.trim(),
    );
    siblings.forEach((item, index) => {
      next.push({
        ...item,
        templateId,
        parentId,
        title: item.title.trim(),
        description: item.description.trim(),
        sortOrder: index,
        kind: item.kind,
      });
      if (item.kind === "folder") {
        walkTree(item.id);
      } else if (item.kind === "task") {
        templateSubtasks(items, item.id)
          .filter((child) => child.title.trim())
          .forEach((child, childIndex) => {
            next.push({
              ...child,
              templateId,
              parentId: item.id,
              kind: "subtask",
              title: child.title.trim(),
              description: child.description.trim(),
              sortOrder: childIndex,
            });
          });
      }
    });
  }

  walkTree(null);
  return next;
}

function appendEmptyTask(
  templateId: string,
  items: WorkTemplateItem[],
  parentId: string | null,
): WorkTemplateItem[] {
  const siblings = templateTreeChildren(items, parentId, templateId);
  const last = siblings[siblings.length - 1];
  if (last && !last.title.trim()) return items;
  return [
    ...items,
    {
      id: createTemplateItemId(),
      templateId,
      parentId,
      kind: "task",
      title: "",
      description: "",
      sortOrder: siblings.length,
    },
  ];
}

function appendEmptySubtask(
  templateId: string,
  items: WorkTemplateItem[],
  taskId: string,
): WorkTemplateItem[] {
  const subtasks = templateSubtasks(items, taskId);
  const last = subtasks[subtasks.length - 1];
  if (last && !last.title.trim()) return items;
  return [
    ...items,
    {
      id: createTemplateItemId(),
      templateId,
      parentId: taskId,
      kind: "subtask",
      title: "",
      description: "",
      sortOrder: subtasks.length,
    },
  ];
}

/** Persistētie ieraksti + tukšās rindas redaktora ievadei (nav DB). */
export function prepareTemplateEditorItems(
  templateId: string,
  items: WorkTemplateItem[],
): WorkTemplateItem[] {
  const persisted = sanitizeTemplateItems(templateId, items);
  let next = [...persisted];

  function walkTree(parentId: string | null) {
    const siblings = templateTreeChildren(next, parentId, templateId);
    if (siblings.length === 0 && parentId === null) {
      next = appendEmptyTask(templateId, next, null);
      return;
    }
    next = appendEmptyTask(templateId, next, parentId);
    for (const item of siblings) {
      if (item.kind === "folder") {
        walkTree(item.id);
      } else if (item.kind === "task" && item.title.trim()) {
        next = appendEmptySubtask(templateId, next, item.id);
      }
    }
  }

  walkTree(null);
  return next;
}

export function sortTemplateItemsForInsert(
  items: WorkTemplateItem[],
): WorkTemplateItem[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  const depth = (id: string): number => {
    let level = 0;
    let current = byId.get(id);
    while (current?.parentId) {
      level += 1;
      current = byId.get(current.parentId);
    }
    return level;
  };
  return [...items].sort((left, right) => {
    const depthDiff = depth(left.id) - depth(right.id);
    if (depthDiff !== 0) return depthDiff;
    return compareTemplateItems(left, right);
  });
}

export function applyTemplateItemOrder(
  items: WorkTemplateItem[],
  parentId: string | null,
  orderedIds: string[],
  subtasksOnly: boolean,
): WorkTemplateItem[] {
  const idToIndex = new Map(orderedIds.map((id, index) => [id, index]));
  return items.map((item) => {
    const inGroup =
      subtasksOnly
        ? item.parentId === parentId && item.kind === "subtask"
        : item.parentId === parentId && item.kind !== "subtask";
    if (!inGroup) return item;
    const nextIndex = idToIndex.get(item.id);
    if (nextIndex === undefined) return item;
    return { ...item, sortOrder: nextIndex };
  });
}

export function moveTemplateEditorItem(
  templateId: string,
  items: WorkTemplateItem[],
  activeId: string,
  nextParentId: string | null,
  orderedIds: string[],
  subtasksOnly: boolean,
): WorkTemplateItem[] {
  let next = items.map((item) => {
    if (item.id !== activeId) return item;
    return { ...item, parentId: nextParentId };
  });
  next = applyTemplateItemOrder(next, nextParentId, orderedIds, subtasksOnly);
  return prepareTemplateEditorItems(templateId, sanitizeTemplateItems(templateId, next));
}
