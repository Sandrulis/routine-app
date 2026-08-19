"use client";

import { type KeyboardEvent, type ReactNode } from "react";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import {
  NavTreeDnd,
  NavTreeEndDrop,
  NavTreeSortableGroup,
  NavTreeSortableItem,
} from "@/app/components/nav-tree-dnd";
import { useTranslations } from "@/app/components/translations-provider";
import {
  resolveTemplateTreePlacement,
  templateGroupEndDroppableId,
  type TemplateTreeItemData,
} from "@/app/lib/template-tree-move";
import {
  createTemplateItemId,
  isTemplateFolder,
  isTemplateSubtask,
  moveTemplateEditorItem,
  templateItemIcon,
  templateSubtasks,
  templateTreeChildren,
  type WorkTemplateItem,
} from "@/app/lib/templates";

function hasFilledTreeItems(
  items: WorkTemplateItem[],
  templateId: string,
  parentId: string | null,
): boolean {
  return templateTreeChildren(items, parentId, templateId).some((item) =>
    item.title.trim(),
  );
}

function collectDescendants(current: WorkTemplateItem[], rootId: string): string[] {
  const ids: string[] = [];
  const walk = (parent: string) => {
    for (const child of current.filter((item) => item.parentId === parent)) {
      ids.push(child.id);
      walk(child.id);
    }
  };
  walk(rootId);
  return ids;
}

function TemplateTreeBranch({
  parentId,
  depth,
  items,
  templateId,
  renderItem,
}: {
  parentId: string;
  depth: number;
  items: WorkTemplateItem[];
  templateId: string;
  renderItem: (item: WorkTemplateItem, depth: number) => ReactNode;
}) {
  const children = templateTreeChildren(items, parentId, templateId);
  const childIds = children.map((item) => item.id);

  return (
    <div className="space-y-2">
      <NavTreeSortableGroup itemIds={childIds}>
        {children.map((item) => renderItem(item, depth + 1))}
      </NavTreeSortableGroup>
      <NavTreeEndDrop id={templateGroupEndDroppableId(templateId, parentId)} />
    </div>
  );
}

export function TemplateTreeEditor({
  templateId,
  items,
  onItemsChange,
  onFocusItemId,
}: {
  templateId: string;
  items: WorkTemplateItem[];
  onItemsChange: (items: WorkTemplateItem[]) => void;
  onFocusItemId: (id: string | null) => void;
}) {
  const { t } = useTranslations();
  const hasFilledRoots = hasFilledTreeItems(items, templateId, null);

  function createEmptyItem(
    parentId: string | null,
    kind: WorkTemplateItem["kind"],
    sortOrder: number,
  ): WorkTemplateItem {
    return {
      id: createTemplateItemId(),
      templateId,
      parentId,
      kind,
      title: "",
      description: "",
      sortOrder,
    };
  }

  function ensureTrailingEmptyRoot(current: WorkTemplateItem[]): WorkTemplateItem[] {
    const siblings = templateTreeChildren(current, null, templateId);
    const last = siblings[siblings.length - 1];
    if (last && !last.title.trim()) return current;
    return [...current, createEmptyItem(null, "task", siblings.length)];
  }

  function ensureTrailingEmptyRootForParent(
    current: WorkTemplateItem[],
    parentId: string,
  ): WorkTemplateItem[] {
    const siblings = templateTreeChildren(current, parentId, templateId);
    const last = siblings[siblings.length - 1];
    if (last && !last.title.trim()) return current;
    return [...current, createEmptyItem(parentId, "task", siblings.length)];
  }

  function ensureInitialEmptySubtask(
    current: WorkTemplateItem[],
    parentId: string,
  ): WorkTemplateItem[] {
    const subtasks = templateSubtasks(current, parentId);
    if (subtasks.length === 0) {
      return [...current, createEmptyItem(parentId, "subtask", 0)];
    }
    const last = subtasks[subtasks.length - 1];
    if (!last.title.trim()) return current;
    return [...current, createEmptyItem(parentId, "subtask", subtasks.length)];
  }

  function ensureTrailingEmptySubtask(
    current: WorkTemplateItem[],
    parentId: string,
  ): WorkTemplateItem[] {
    return ensureInitialEmptySubtask(current, parentId);
  }

  function collapseEmptySubtasks(
    current: WorkTemplateItem[],
    parentId: string,
  ): WorkTemplateItem[] {
    const subtasks = templateSubtasks(current, parentId);
    if (subtasks.some((child) => child.title.trim())) return current;
    if (subtasks.length <= 1) return current;
    const keep = subtasks[0];
    const dropIds = new Set(subtasks.slice(1).map((child) => child.id));
    return [
      ...current.filter((item) => !dropIds.has(item.id)),
      { ...keep, title: "", sortOrder: 0 },
    ];
  }

  function collapseEmptyRoots(current: WorkTemplateItem[]): WorkTemplateItem[] {
    const siblings = templateTreeChildren(current, null, templateId);
    if (siblings.some((root) => root.title.trim())) return current;
    if (siblings.length <= 1) return current;
    const keep = siblings[0];
    const dropIds = new Set(siblings.slice(1).map((root) => root.id));
    return [
      ...current.filter(
        (item) =>
          !dropIds.has(item.id) &&
          !(item.parentId && dropIds.has(item.parentId)),
      ),
      { ...keep, title: "", sortOrder: 0 },
    ];
  }

  function updateItemTitle(itemId: string, title: string) {
    const item = items.find((entry) => entry.id === itemId);
    const shouldRefocusRoot =
      item?.parentId === null &&
      !isTemplateSubtask(item) &&
      !item.title.trim() &&
      title.trim();

    const currentItem = items.find((entry) => entry.id === itemId);
    if (!currentItem) return;

    let next = items.map((entry) =>
      entry.id === itemId ? { ...entry, title } : entry,
    );

    if (title.trim()) {
      if (isTemplateSubtask(currentItem)) {
        next = ensureTrailingEmptySubtask(next, currentItem.parentId ?? "");
      } else if (currentItem.parentId === null) {
        next = ensureTrailingEmptyRoot(next);
        if (currentItem.kind === "task") {
          next = ensureInitialEmptySubtask(next, itemId);
        }
      } else if (isTemplateFolder(currentItem)) {
        next = ensureTrailingEmptyRootForParent(next, currentItem.parentId);
      } else if (currentItem.kind === "task") {
        next = ensureTrailingEmptyRootForParent(next, currentItem.parentId);
        next = ensureInitialEmptySubtask(next, itemId);
      }
    } else if (isTemplateSubtask(currentItem)) {
      next = collapseEmptySubtasks(next, currentItem.parentId ?? "");
    } else if (currentItem.parentId === null) {
      next = collapseEmptyRoots(next);
      const dropIds = collectDescendants(items, itemId);
      next = next.filter(
        (entry) => entry.id === itemId || !dropIds.includes(entry.id),
      );
    }

    onItemsChange(next);
    if (shouldRefocusRoot) onFocusItemId(itemId);
  }

  function handleItemEnter(
    event: KeyboardEvent<HTMLInputElement>,
    itemId: string,
    title: string,
    parentId: string | null,
    subtasksOnly: boolean,
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (!title.trim()) return;

    let next = items;
    if (subtasksOnly && parentId) {
      next = ensureTrailingEmptySubtask(next, parentId);
    } else if (parentId === null) {
      next = ensureTrailingEmptyRoot(next);
    } else {
      next = ensureTrailingEmptyRootForParent(next, parentId);
    }

    const siblings = subtasksOnly
      ? templateSubtasks(next, parentId ?? "")
      : templateTreeChildren(next, parentId, templateId);
    const index = siblings.findIndex((entry) => entry.id === itemId);
    const focusTarget = siblings[index + 1];
    onItemsChange(next);
    if (focusTarget) onFocusItemId(focusTarget.id);
  }

  function removeItem(itemId: string) {
    const removed = items.find((item) => item.id === itemId);
    const dropIds = collectDescendants(items, itemId);
    let next = items.filter(
      (item) => item.id !== itemId && !dropIds.includes(item.id),
    );
    if (templateTreeChildren(next, null, templateId).length === 0) {
      next = [...next, createEmptyItem(null, "task", 0)];
    }
    if (removed && isTemplateSubtask(removed) && removed.parentId) {
      const parent = next.find((item) => item.id === removed.parentId);
      if (
        parent?.title.trim() &&
        templateSubtasks(next, removed.parentId).length === 0
      ) {
        next = [...next, createEmptyItem(removed.parentId, "subtask", 0)];
      }
    }
    onItemsChange(next);
  }

  function addFolder(parentId: string | null) {
    const siblings = templateTreeChildren(items, parentId, templateId);
    const created = createEmptyItem(parentId, "folder", siblings.length);
    onItemsChange([...items, created]);
    onFocusItemId(created.id);
  }

  function handlePlace(
    activeId: string,
    overId: string,
    intent: "before" | "after" | "inside",
  ) {
    const placement = resolveTemplateTreePlacement({
      activeId,
      overId,
      templateId,
      items,
      intent,
    });
    if (!placement) return;
    onItemsChange(
      moveTemplateEditorItem(
        templateId,
        items,
        activeId,
        placement.nextParentId,
        placement.orderedIds,
        placement.subtasksOnly,
      ),
    );
  }

  function renderSubtaskInput(taskId: string, child: WorkTemplateItem) {
    const subtasks = templateSubtasks(items, taskId);
    const hasFilledSubtasks = subtasks.some((entry) => entry.title.trim());

    return (
      <NavTreeSortableItem
        key={child.id}
        id={child.id}
        disabled={!child.title.trim()}
        data={{
          kind: "subtask",
          listId: templateId,
          parentId: taskId,
        }}
      >
        {(handle) => (
          <div
            ref={handle.setNodeRef}
            style={handle.style}
            className="flex items-center gap-2"
          >
            <DragHandle
              label={t("subtasks.drag", "Mainīt secību")}
              attributes={handle.attributes}
              listeners={child.title.trim() ? handle.listeners : undefined}
            />
            <i
              className={`${templateItemIcon("subtask")} w-4 shrink-0 text-center text-[7px] text-zinc-400`}
              aria-hidden="true"
            />
            <input
              data-template-item-id={child.id}
              value={child.title}
              onChange={(event) => updateItemTitle(child.id, event.target.value)}
              onKeyDown={(event) =>
                handleItemEnter(event, child.id, child.title, taskId, true)
              }
              className="min-h-9 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder={t(
                "subtasks.fields.title_placeholder",
                "Apakšuzdevuma nosaukums",
              )}
            />
            {hasFilledSubtasks ? (
              <IconActionButton
                label={t("actions.delete", "Dzēst")}
                icon="fas fa-xmark"
                variant="delete"
                onClick={() => removeItem(child.id)}
              />
            ) : null}
          </div>
        )}
      </NavTreeSortableItem>
    );
  }

  function renderTreeItem(item: WorkTemplateItem, depth: number) {
    const isFolder = isTemplateFolder(item);
    const isRoot = item.parentId === null;
    const showDelete =
      isRoot && hasFilledRoots ? item.title.trim() : !isRoot && item.title.trim();
    const subtasks = templateSubtasks(items, item.id);
    const showSubtasks = item.kind === "task" && item.title.trim();
    const treeData: TemplateTreeItemData = {
      kind: isFolder ? "folder" : "task",
      listId: templateId,
      parentId: item.parentId,
    };

    return (
      <div key={item.id} style={{ marginLeft: depth > 0 ? depth * 16 : 0 }}>
        <NavTreeSortableItem
          id={item.id}
          disabled={!item.title.trim()}
          data={treeData}
        >
          {(handle) => (
            <div
              ref={handle.setNodeRef}
              style={handle.style}
              className={
                !hasFilledRoots && isRoot
                  ? "rounded-2xl border border-dashed border-zinc-200 px-3 py-2"
                  : isFolder
                    ? "rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2"
                    : "rounded-xl border border-zinc-200 bg-white px-3 py-2"
              }
            >
              <div className="flex items-center gap-2">
                <DragHandle
                  label={t("subtasks.drag", "Mainīt secību")}
                  attributes={handle.attributes}
                  listeners={item.title.trim() ? handle.listeners : undefined}
                />
                <i
                  className={`${templateItemIcon(item.kind)} w-4 shrink-0 text-center text-sm ${
                    isFolder ? "text-amber-600" : "text-zinc-500"
                  }`}
                  aria-hidden="true"
                />
                <input
                  data-template-item-id={item.id}
                  value={item.title}
                  onChange={(event) => updateItemTitle(item.id, event.target.value)}
                  onKeyDown={(event) =>
                    handleItemEnter(
                      event,
                      item.id,
                      item.title,
                      item.parentId,
                      false,
                    )
                  }
                  className="min-h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder={
                    isFolder
                      ? t("templates.fields.folder_placeholder", "Mapes nosaukums")
                      : t(
                          "tasks.fields.list_placeholder",
                          "Uzdevumu saraksta nosaukums",
                        )
                  }
                />
                {isFolder ? (
                  <IconActionButton
                    label={t("templates.items.add_folder", "Apakšmape")}
                    icon="fas fa-folder-plus"
                    variant="muted"
                    onClick={() => addFolder(item.id)}
                  />
                ) : null}
                {showDelete ? (
                  <IconActionButton
                    label={t("actions.delete", "Dzēst")}
                    icon="fas fa-trash"
                    variant="delete"
                    onClick={() => removeItem(item.id)}
                  />
                ) : null}
              </div>
              {showSubtasks ? (
                <div className="mt-2 space-y-2 pl-8">
                  <NavTreeSortableGroup itemIds={subtasks.map((entry) => entry.id)}>
                    {subtasks.map((child) => renderSubtaskInput(item.id, child))}
                  </NavTreeSortableGroup>
                </div>
              ) : null}
              {isFolder ? (
                <div className="mt-2 pl-2">
                  <TemplateTreeBranch
                    parentId={item.id}
                    depth={0}
                    renderItem={renderTreeItem}
                    items={items}
                    templateId={templateId}
                  />
                </div>
              ) : null}
            </div>
          )}
        </NavTreeSortableItem>
      </div>
    );
  }

  const rootItems = templateTreeChildren(items, null, templateId);
  const rootIds = rootItems.map((item) => item.id);

  return (
    <NavTreeDnd
      onPlace={handlePlace}
      renderOverlay={(activeId) => {
        const active = items.find((item) => item.id === activeId);
        if (!active) return null;
        return (
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-lg">
            {active.title.trim() || "…"}
          </div>
        );
      }}
    >
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => addFolder(null)}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl bg-zinc-100 px-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            <i className="far fa-folder text-xs" aria-hidden="true" />
            {t("templates.items.add_folder", "Mapes")}
          </button>
        </div>
        <NavTreeSortableGroup itemIds={rootIds}>
          {rootItems.map((item) => renderTreeItem(item, 0))}
        </NavTreeSortableGroup>
        <NavTreeEndDrop id={templateGroupEndDroppableId(templateId, null)} />
      </div>
    </NavTreeDnd>
  );
}
