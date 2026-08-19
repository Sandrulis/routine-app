import type { NavTreeDropIntent } from "@/app/lib/nav-tree-move";
import {
  collectTemplateSubtreeIds,
  isTemplateFolder,
  isTemplateSubtask,
  templateSubtasks,
  templateTreeChildren,
  type WorkTemplateItem,
} from "@/app/lib/templates";

export type TemplateTreeItemKind = "folder" | "task" | "subtask";

export type TemplateTreeItemData = {
  kind: TemplateTreeItemKind;
  listId: string;
  parentId: string | null;
};

export function templateRootDroppableId(templateId: string): string {
  return `tmpl-root:${templateId}`;
}

export function isTemplateRootDroppableId(id: string, templateId: string): boolean {
  return id === templateRootDroppableId(templateId);
}

export function templateGroupEndDroppableId(
  templateId: string,
  parentId: string | null,
): string {
  return `tmpl-end:${templateId}:${parentId ?? "root"}`;
}

export function parseTemplateGroupEndDroppableId(
  id: string,
): { templateId: string; parentId: string | null } | null {
  if (!id.startsWith("tmpl-end:")) return null;
  const rest = id.slice("tmpl-end:".length);
  const sep = rest.indexOf(":");
  if (sep < 0) return null;
  const templateId = rest.slice(0, sep);
  const parentRaw = rest.slice(sep + 1);
  if (!templateId) return null;
  return { templateId, parentId: parentRaw === "root" ? null : parentRaw };
}

function itemFromId(
  id: string,
  items: WorkTemplateItem[],
): { kind: TemplateTreeItemKind; templateId: string; parentId: string | null } | null {
  const item = items.find((entry) => entry.id === id);
  if (!item) return null;
  return {
    kind: isTemplateSubtask(item)
      ? "subtask"
      : isTemplateFolder(item)
        ? "folder"
        : "task",
    templateId: item.templateId,
    parentId: item.parentId,
  };
}

function canUseParent(
  activeId: string,
  activeKind: TemplateTreeItemKind,
  nextParentId: string | null,
  items: WorkTemplateItem[],
): boolean {
  if (nextParentId === activeId) return false;
  if (activeKind === "subtask") {
    if (!nextParentId) return false;
    const parent = items.find((item) => item.id === nextParentId);
    return Boolean(parent && !isTemplateFolder(parent) && !isTemplateSubtask(parent));
  }
  if (nextParentId === null) return true;
  const parent = items.find((item) => item.id === nextParentId);
  if (!parent || !isTemplateFolder(parent)) return false;
  if (activeKind === "folder") {
    return !collectTemplateSubtreeIds(items, activeId).includes(nextParentId);
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

function treeSiblingIds(
  templateId: string,
  parentId: string | null,
  items: WorkTemplateItem[],
): string[] {
  return templateTreeChildren(items, parentId, templateId).map((item) => item.id);
}

export function resolveTemplateTreePlacement(args: {
  activeId: string;
  overId: string;
  templateId: string;
  items: WorkTemplateItem[];
  intent?: NavTreeDropIntent;
}): {
  nextParentId: string | null;
  orderedIds: string[];
  subtasksOnly: boolean;
} | null {
  const { activeId, overId, templateId, items } = args;
  const intent = args.intent ?? "inside";
  if (activeId === overId) return null;

  const active = itemFromId(activeId, items);
  if (!active || active.templateId !== templateId) return null;

  if (active.kind === "subtask") {
    const over = itemFromId(overId, items);
    if (over?.kind === "task" && intent === "inside") {
      if (!canUseParent(activeId, active.kind, overId, items)) return null;
      const siblingIds = templateSubtasks(items, overId).map((item) => item.id);
      return {
        nextParentId: overId,
        orderedIds: insertAmong(siblingIds, activeId, null, "end"),
        subtasksOnly: true,
      };
    }
    if (!over || over.kind !== "subtask") return null;
    if (over.parentId !== active.parentId) {
      if (!over.parentId || !canUseParent(activeId, active.kind, over.parentId, items)) {
        return null;
      }
      const siblingIds = templateSubtasks(items, over.parentId).map((item) => item.id);
      return {
        nextParentId: over.parentId,
        orderedIds: insertAmong(
          siblingIds,
          activeId,
          overId,
          intent === "after" ? "after" : "before",
        ),
        subtasksOnly: true,
      };
    }
    const siblingIds = templateSubtasks(items, active.parentId ?? "").map(
      (item) => item.id,
    );
    return {
      nextParentId: active.parentId,
      orderedIds: insertAmong(
        siblingIds,
        activeId,
        overId,
        intent === "after" ? "after" : "before",
      ),
      subtasksOnly: true,
    };
  }

  if (isTemplateRootDroppableId(overId, templateId)) {
    if (!canUseParent(activeId, active.kind, null, items)) return null;
    return {
      nextParentId: null,
      orderedIds: insertAmong(treeSiblingIds(templateId, null, items), activeId, null, "end"),
      subtasksOnly: false,
    };
  }

  const groupEnd = parseTemplateGroupEndDroppableId(overId);
  if (groupEnd && groupEnd.templateId === templateId) {
    if (!canUseParent(activeId, active.kind, groupEnd.parentId, items)) return null;
    return {
      nextParentId: groupEnd.parentId,
      orderedIds: insertAmong(
        treeSiblingIds(templateId, groupEnd.parentId, items),
        activeId,
        null,
        "end",
      ),
      subtasksOnly: false,
    };
  }

  const over = itemFromId(overId, items);
  if (!over || over.templateId !== templateId) return null;

  if (over.kind === "folder") {
    const nest =
      intent === "inside" && canUseParent(activeId, active.kind, overId, items);
    if (nest) {
      return {
        nextParentId: overId,
        orderedIds: insertAmong(
          treeSiblingIds(templateId, overId, items),
          activeId,
          null,
          "end",
        ),
        subtasksOnly: false,
      };
    }
    const nextParentId = over.parentId;
    if (!canUseParent(activeId, active.kind, nextParentId, items)) return null;
    return {
      nextParentId,
      orderedIds: insertAmong(
        treeSiblingIds(templateId, nextParentId, items),
        activeId,
        overId,
        intent === "after" ? "after" : "before",
      ),
      subtasksOnly: false,
    };
  }

  if (over.kind === "subtask") return null;

  const nextParentId = over.parentId;
  if (!canUseParent(activeId, active.kind, nextParentId, items)) return null;
  return {
    nextParentId,
    orderedIds: insertAmong(
      treeSiblingIds(templateId, nextParentId, items),
      activeId,
      overId,
      intent === "after" ? "after" : "before",
    ),
    subtasksOnly: false,
  };
}
