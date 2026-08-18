import type { ListFile } from "@/app/lib/list-files";
import {
  collectTaskSubtreeIds,
  isWorkFolder,
  isWorkSubtask,
  type WorkTask,
} from "@/app/lib/lists";

export type NavTreeItemKind = "folder" | "task" | "file" | "subtask";

export type NavTreeItemData = {
  kind: NavTreeItemKind;
  listId: string;
  parentId: string | null;
};

export function navListRootDroppableId(listId: string): string {
  return `nav-root:${listId}`;
}

export function isNavListRootDroppableId(id: string, listId: string): boolean {
  return id === navListRootDroppableId(listId);
}

export function mixedTreeSiblings(
  listId: string,
  parentId: string | null,
  tasks: WorkTask[],
  files: ListFile[],
): { id: string; sortOrder: number }[] {
  const siblingTasks = (
    parentId
      ? tasks.filter(
          (task) =>
            task.listId === listId &&
            task.parentId === parentId &&
            task.kind !== "subtask",
        )
      : tasks.filter(
          (task) =>
            task.listId === listId &&
            task.parentId === null &&
            task.kind !== "subtask",
        )
  ).map((task) => ({ id: task.id, sortOrder: task.sortOrder }));
  const siblingFiles = files
    .filter((file) => file.listId === listId && file.parentId === parentId)
    .map((file) => ({ id: file.id, sortOrder: file.sortOrder }));
  return [...siblingTasks, ...siblingFiles].sort((left, right) =>
    left.sortOrder !== right.sortOrder
      ? left.sortOrder - right.sortOrder
      : left.id.localeCompare(right.id),
  );
}

function itemFromId(
  id: string,
  tasks: WorkTask[],
  files: ListFile[],
): { kind: NavTreeItemKind; listId: string; parentId: string | null } | null {
  const task = tasks.find((item) => item.id === id);
  if (task) {
    return {
      kind: isWorkSubtask(task)
        ? "subtask"
        : isWorkFolder(task)
          ? "folder"
          : "task",
      listId: task.listId,
      parentId: task.parentId,
    };
  }
  const file = files.find((item) => item.id === id);
  if (file) {
    return { kind: "file", listId: file.listId, parentId: file.parentId };
  }
  return null;
}

function canUseParent(
  activeId: string,
  activeKind: NavTreeItemKind,
  nextParentId: string | null,
  tasks: WorkTask[],
): boolean {
  if (nextParentId === activeId) return false;
  if (activeKind === "subtask") {
    if (!nextParentId) return false;
    const parent = tasks.find((task) => task.id === nextParentId);
    return Boolean(parent && !isWorkFolder(parent) && !isWorkSubtask(parent));
  }
  if (nextParentId === null) return true;
  const parent = tasks.find((task) => task.id === nextParentId);
  if (!parent || !isWorkFolder(parent)) return false;
  if (activeKind === "folder") {
    return !collectTaskSubtreeIds(tasks, activeId).includes(nextParentId);
  }
  return true;
}

function insertAmong(
  siblingIds: string[],
  activeId: string,
  overId: string | null,
  position: "before" | "after" | "end",
): string[] {
  const next = siblingIds.filter((id) => id !== activeId);
  if (!overId || overId === activeId || position === "end") {
    next.push(activeId);
    return next;
  }
  const overIndex = next.indexOf(overId);
  if (overIndex < 0) {
    next.push(activeId);
    return next;
  }
  next.splice(position === "after" ? overIndex + 1 : overIndex, 0, activeId);
  return next;
}

export type NavTreeDropIntent = "before" | "after" | "inside";

export function resolveNavTreePlacement(args: {
  activeId: string;
  overId: string;
  listId: string;
  tasks: WorkTask[];
  files: ListFile[];
  intent?: NavTreeDropIntent;
}): { nextParentId: string | null; orderedIds: string[]; nestIntoId: string | null } | null {
  const { activeId, overId, listId, tasks, files } = args;
  const intent = args.intent ?? "inside";
  if (activeId === overId) return null;

  const active = itemFromId(activeId, tasks, files);
  if (!active || active.listId !== listId) return null;

  if (active.kind === "subtask") {
    const over = itemFromId(overId, tasks, files);
    if (!over || over.kind !== "subtask" || over.parentId !== active.parentId) {
      return null;
    }
    const siblingIds = tasks
      .filter(
        (task) =>
          task.parentId === active.parentId && task.kind === "subtask",
      )
      .sort((left, right) =>
        left.sortOrder !== right.sortOrder
          ? left.sortOrder - right.sortOrder
          : left.id.localeCompare(right.id),
      )
      .map((task) => task.id);
    return {
      nextParentId: active.parentId,
      orderedIds: insertAmong(
        siblingIds,
        activeId,
        overId,
        intent === "after" ? "after" : "before",
      ),
      nestIntoId: null,
    };
  }

  if (isNavListRootDroppableId(overId, listId)) {
    if (!canUseParent(activeId, active.kind, null, tasks)) return null;
    const siblingIds = mixedTreeSiblings(listId, null, tasks, files).map(
      (item) => item.id,
    );
    return {
      nextParentId: null,
      orderedIds: insertAmong(siblingIds, activeId, null, "end"),
      nestIntoId: null,
    };
  }

  const over = itemFromId(overId, tasks, files);
  if (!over || over.listId !== listId) return null;

  if (over.kind === "folder") {
    const nest =
      intent === "inside" && canUseParent(activeId, active.kind, overId, tasks);
    if (nest) {
      const siblingIds = mixedTreeSiblings(listId, overId, tasks, files).map(
        (item) => item.id,
      );
      return {
        nextParentId: overId,
        orderedIds: insertAmong(siblingIds, activeId, null, "end"),
        nestIntoId: overId,
      };
    }
    const nextParentId = over.parentId;
    if (!canUseParent(activeId, active.kind, nextParentId, tasks)) return null;
    const siblingIds = mixedTreeSiblings(listId, nextParentId, tasks, files).map(
      (item) => item.id,
    );
    return {
      nextParentId,
      orderedIds: insertAmong(
        siblingIds,
        activeId,
        overId,
        intent === "after" ? "after" : "before",
      ),
      nestIntoId: null,
    };
  }

  if (over.kind === "subtask") return null;

  const nextParentId = over.parentId;
  if (!canUseParent(activeId, active.kind, nextParentId, tasks)) return null;
  const siblingIds = mixedTreeSiblings(listId, nextParentId, tasks, files).map(
    (item) => item.id,
  );
  return {
    nextParentId,
    orderedIds: insertAmong(
      siblingIds,
      activeId,
      overId,
      intent === "after" ? "after" : "before",
    ),
    nestIntoId: null,
  };
}
