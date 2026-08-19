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
import { AssigneeCell } from "@/app/components/subtask-table";
import { TaskChecklists } from "@/app/components/task-checklists";
import { useTranslations } from "@/app/components/translations-provider";
import {
  resolveTemplateTreePlacement,
  templateGroupEndDroppableId,
  type TemplateTreeItemData,
} from "@/app/lib/template-tree-move";
import {
  emptyChecklist,
  type TaskChecklist,
} from "@/app/lib/task-checklists";
import {
  createTemplateItemId,
  emptyTemplateItem,
  isTemplateFolder,
  isTemplateSubtask,
  moveTemplateEditorItem,
  templateItemIcon,
  templateSubtasks,
  templateTreeChildren,
  type WorkTemplateItem,
  type WorkTemplateItemKind,
} from "@/app/lib/templates";

const TASK_INPUT_CLASS =
  "min-h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm font-semibold text-zinc-900 outline-none placeholder:font-normal placeholder:text-zinc-400 focus:ring-0";

const SUBTASK_INPUT_CLASS =
  "min-h-8 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:ring-0";

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

function TemplateKindBadge({
  kind,
  hasCustomStatuses = false,
}: {
  kind: WorkTemplateItemKind;
  hasCustomStatuses?: boolean;
}) {
  const isFolder = kind === "folder";
  const isSubtask = kind === "subtask";
  const isTaskWithStatuses = kind === "task" && hasCustomStatuses;

  return (
    <span
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-xl ${
        isFolder
          ? "bg-amber-100 text-amber-700"
          : isSubtask
            ? "bg-zinc-100 text-zinc-500"
            : isTaskWithStatuses
              ? "bg-violet-100 text-violet-700 ring-2 ring-violet-300/70"
              : "bg-sky-100 text-sky-700"
      }`}
    >
      <i
        className={`${templateItemIcon(kind)} ${isSubtask ? "text-[7px]" : "text-sm"}`}
        aria-hidden="true"
      />
    </span>
  );
}

function TemplateAssigneeChip({
  assigneeIds,
  onChange,
}: {
  assigneeIds: string[];
  onChange: (next: string[]) => void;
}) {
  const { t } = useTranslations();

  return (
    <div
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-2 py-1 ring-1 ring-zinc-200/70"
      title={t("todo.fields.assignee", "Atbildīgais")}
    >
      <i
        className="fas fa-user-plus text-[10px] text-zinc-400"
        aria-hidden="true"
      />
      <AssigneeCell assigneeIds={assigneeIds} onChange={onChange} />
    </div>
  );
}

function TemplateSubtaskExtras({
  assigneeIds,
  checklists,
  onAssigneesChange,
  onChecklistsChange,
}: {
  assigneeIds: string[];
  checklists: TaskChecklist[];
  onAssigneesChange: (next: string[]) => void;
  onChecklistsChange: (next: TaskChecklist[]) => void;
}) {
  const { t } = useTranslations();
  const hasChecklists = checklists.length > 0;

  return (
    <div className="mt-2 space-y-2 border-t border-zinc-100/90 pt-2 pl-1">
      <div className="flex flex-wrap items-center gap-2">
        <TemplateAssigneeChip
          assigneeIds={assigneeIds}
          onChange={onAssigneesChange}
        />
        {!hasChecklists ? (
          <button
            type="button"
            onClick={() => onChecklistsChange([emptyChecklist()])}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-lg bg-white px-2.5 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200/70 transition hover:bg-zinc-50 hover:text-zinc-900"
          >
            <i className="fas fa-list-check text-[10px]" aria-hidden="true" />
            {t("templates.items.add_checklist", "Checklist")}
          </button>
        ) : null}
      </div>
      {hasChecklists ? (
        <div className="rounded-xl bg-white/80 p-2 ring-1 ring-zinc-200/60">
          <TaskChecklists
            checklists={checklists}
            onChange={onChecklistsChange}
            defaultExpanded
          />
        </div>
      ) : null}
    </div>
  );
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
    <div className="mt-2 space-y-2 border-l-2 border-amber-200/70 pl-3">
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
  onOpenStatuses,
}: {
  templateId: string;
  items: WorkTemplateItem[];
  onItemsChange: (items: WorkTemplateItem[]) => void;
  onFocusItemId: (id: string | null) => void;
  onOpenStatuses?: (itemId: string) => void;
}) {
  const { t } = useTranslations();
  const hasFilledRoots = hasFilledTreeItems(items, templateId, null);

  function createEmptyItem(
    parentId: string | null,
    kind: WorkTemplateItem["kind"],
    sortOrder: number,
  ): WorkTemplateItem {
    return emptyTemplateItem({
      id: createTemplateItemId(),
      templateId,
      parentId,
      kind,
      sortOrder,
    });
  }

  function updateItemField(
    itemId: string,
    patch: Partial<Pick<WorkTemplateItem, "assigneeIds" | "checklists">>,
  ) {
    onItemsChange(
      items.map((entry) =>
        entry.id === itemId ? { ...entry, ...patch } : entry,
      ),
    );
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
    const filled = Boolean(child.title.trim());

    return (
      <NavTreeSortableItem
        key={child.id}
        id={child.id}
        disabled={!filled}
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
            className={`rounded-xl p-2 transition ${
              filled
                ? "bg-white ring-1 ring-zinc-200/70"
                : "bg-transparent ring-1 ring-transparent"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <DragHandle
                label={t("subtasks.drag", "Mainīt secību")}
                attributes={handle.attributes}
                listeners={filled ? handle.listeners : undefined}
              />
              <TemplateKindBadge kind="subtask" />
              <input
                data-template-item-id={child.id}
                value={child.title}
                onChange={(event) => updateItemTitle(child.id, event.target.value)}
                onKeyDown={(event) =>
                  handleItemEnter(event, child.id, child.title, taskId, true)
                }
                className={SUBTASK_INPUT_CLASS}
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
            {filled ? (
              <TemplateSubtaskExtras
                assigneeIds={child.assigneeIds ?? []}
                checklists={child.checklists ?? []}
                onAssigneesChange={(next) =>
                  updateItemField(child.id, { assigneeIds: next })
                }
                onChecklistsChange={(next) =>
                  updateItemField(child.id, { checklists: next })
                }
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
    const filledSubtaskCount = subtasks.filter((entry) => entry.title.trim()).length;
    const customStatusCount = item.taskStatuses?.length ?? 0;
    const hasCustomStatuses = item.kind === "task" && customStatusCount > 0;
    const treeData: TemplateTreeItemData = {
      kind: isFolder ? "folder" : "task",
      listId: templateId,
      parentId: item.parentId,
    };

    const cardClass = !hasFilledRoots && isRoot
      ? "overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/50"
      : isFolder
        ? "overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white shadow-sm ring-1 ring-amber-100/60"
        : "overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-sm ring-1 ring-zinc-950/[0.03]";

    return (
      <div key={item.id} style={{ marginLeft: depth > 0 ? depth * 12 : 0 }}>
        <NavTreeSortableItem
          id={item.id}
          disabled={!item.title.trim()}
          data={treeData}
        >
          {(handle) => (
            <div ref={handle.setNodeRef} style={handle.style} className={cardClass}>
              <div
                className={`flex items-center gap-2 px-2 py-2 sm:px-3 ${
                  isFolder
                    ? "border-b border-amber-100/80 bg-amber-50/40"
                    : "border-b border-zinc-100 bg-zinc-50/60"
                }`}
              >
                <DragHandle
                  label={t("subtasks.drag", "Mainīt secību")}
                  attributes={handle.attributes}
                  listeners={item.title.trim() ? handle.listeners : undefined}
                />
                <TemplateKindBadge
                  kind={item.kind}
                  hasCustomStatuses={hasCustomStatuses}
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
                  className={TASK_INPUT_CLASS}
                  placeholder={
                    isFolder
                      ? t("templates.fields.folder_placeholder", "Mapes nosaukums")
                      : t(
                          "tasks.fields.list_placeholder",
                          "Uzdevumu saraksta nosaukums",
                        )
                  }
                />
                <div className="flex shrink-0 items-center gap-1">
                  {isFolder ? (
                    <IconActionButton
                      label={t("templates.items.add_folder", "Apakšmape")}
                      icon="fas fa-folder-plus"
                      variant="muted"
                      onClick={() => addFolder(item.id)}
                    />
                  ) : null}
                  {item.kind === "task" && item.title.trim() ? (
                    <>
                      <IconActionButton
                        label={
                          hasCustomStatuses
                            ? t(
                                "templates.statuses.configured",
                                "Pielāgoti statusi ({count})",
                                { count: customStatusCount },
                              )
                            : t("tasks.statuses.title", "Statusi")
                        }
                        icon="fas fa-signal"
                        variant={hasCustomStatuses ? "status" : "muted"}
                        pressed={hasCustomStatuses}
                        onClick={() => onOpenStatuses?.(item.id)}
                      />
                      <TemplateAssigneeChip
                        assigneeIds={item.assigneeIds ?? []}
                        onChange={(next) =>
                          updateItemField(item.id, { assigneeIds: next })
                        }
                      />
                    </>
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
              </div>

              {showSubtasks ? (
                <div className="px-3 py-3 sm:px-4">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      {t("templates.items.subtasks_label", "Apakšuzdevumi")}
                    </p>
                    {filledSubtaskCount > 0 ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                        {filledSubtaskCount}
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-2 border-l-2 border-sky-200/70 pl-3">
                    <NavTreeSortableGroup itemIds={subtasks.map((entry) => entry.id)}>
                      {subtasks.map((child) => renderSubtaskInput(item.id, child))}
                    </NavTreeSortableGroup>
                  </div>
                </div>
              ) : null}

              {isFolder ? (
                <div className="px-3 pb-3 sm:px-4">
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
          <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-900 shadow-lg ring-1 ring-zinc-950/5">
            <TemplateKindBadge kind={active.kind} />
            {active.title.trim() || "…"}
          </div>
        );
      }}
    >
      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => addFolder(null)}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <i className="far fa-folder text-xs text-amber-600" aria-hidden="true" />
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
