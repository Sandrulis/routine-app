"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { StatusGlyph } from "@/app/components/status-control";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import type { WorkTaskStatusDef } from "@/app/lib/list-statuses";
import {
  applyStatusGroupOverrides,
  canRemoveStatus,
  enforceSingletonGroups,
  flattenGroupedStatusIds,
  groupedStatusLayout,
  insertStatusInGroupOrder,
  groupWouldBeEmpty,
  isCustomListStatus,
  isCustomWorkTaskStatus,
  isListStatusGroup,
  isSingletonStatusGroup,
  mergeStatusCatalog,
  moveStatusInLayout,
  normalizeStatusColor,
  statusGroupDroppableId,
  visibleStatusIdsAfter,
  type ListStatusGroup,
} from "@/app/lib/list-statuses";
import { useLists } from "@/app/lib/lists-store";
import type { WorkTask } from "@/app/lib/lists";
import { useSystemTaskStatuses } from "@/app/lib/task-statuses";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

const GROUP_OPTIONS = [
  { value: "not_started", labelKey: "status.group.not_started", fallback: "Nav sākts" },
  { value: "active", labelKey: "status.group.active", fallback: "Aktīvs" },
  { value: "closed", labelKey: "status.group.closed", fallback: "Slēgts" },
] as const;

const collisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) return pointerHits;
  return closestCenter(args);
};

type StatusDraft = {
  label: string;
  color: string;
  groupKey: string;
};

type EditDraft = {
  label: string;
  color: string;
};

function emptyDraft(groupKey: string = "active"): StatusDraft {
  return {
    label: "",
    color: "#71717a",
    groupKey,
  };
}

export function TaskStatusesModal({
  task,
  open,
  onOpenChange,
}: {
  task: WorkTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { statuses: systemStatuses, labelFor } = useSystemTaskStatuses();
  const {
    lists,
    tasks,
    listStatuses,
    workTaskStatuses,
    updateTask,
    addWorkTaskStatus,
    updateWorkTaskStatus,
    deleteWorkTaskStatus,
    reassignSubtasksOffStatus,
    updateListStatus,
    teamStatusLabels,
    renameSystemStatus,
    resetSystemStatusLabel,
  } = useLists();
  const liveTask =
    (task && tasks.find((item) => item.id === task.id)) || task;
  const liveList = liveTask
    ? (lists.find((item) => item.id === liveTask.listId) ?? null)
    : null;
  const custom = useMemo(
    () =>
      liveTask
        ? workTaskStatuses.filter((status) => status.parentTaskId === liveTask.id)
        : [],
    [liveTask, workTaskStatuses],
  );
  const catalog = useMemo(() => {
    if (!liveTask) return [];
    const merged = applyStatusGroupOverrides(
      mergeStatusCatalog(
        systemStatuses,
        listStatuses.filter((status) => status.listId === liveTask.listId),
        liveTask.listId,
        custom,
        liveTask.id,
      ),
      {
        ...(liveList?.statusGroupOverrides ?? {}),
        ...liveTask.statusGroupOverrides,
      },
    );
    return enforceSingletonGroups(merged).catalog;
  }, [custom, liveList?.statusGroupOverrides, liveTask, listStatuses, systemStatuses]);
  const groups = useMemo(
    () =>
      groupedStatusLayout(
        catalog,
        liveTask?.statusOrder?.length
          ? liveTask.statusOrder
          : (liveList?.statusOrder ?? []),
      ),
    [catalog, liveList, liveTask],
  );
  const groupOverrides = {
    ...(liveList?.statusGroupOverrides ?? {}),
    ...(liveTask?.statusGroupOverrides ?? {}),
  };
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ label: "", color: "#71717a" });
  const [deleteTarget, setDeleteTarget] = useState<WorkTaskStatusDef | null>(null);
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function editOriginalFor(statusId: string): EditDraft {
    const taskStatus = custom.find((status) => status.id === statusId);
    if (taskStatus) {
      return { label: taskStatus.label, color: taskStatus.color };
    }
    const listStatus = listStatuses.find((status) => status.id === statusId);
    if (listStatus) {
      return { label: listStatus.label, color: listStatus.color };
    }
    const status = catalog.find((item) => item.id === statusId);
    return {
      label: labelFor(statusId),
      color: status?.color ?? "#71717a",
    };
  }

  const editOriginal = editId ? editOriginalFor(editId) : { label: "", color: "#71717a" };
  const editDirty =
    editId !== null &&
    (editDraft.label.trim() !== editOriginal.label.trim() ||
      normalizeStatusColor(editDraft.color) !==
        normalizeStatusColor(editOriginal.color));
  const isDirty = JSON.stringify(draft) !== JSON.stringify(emptyDraft());

  useEffect(() => {
    if (open) return;
    setFormOpen(false);
    setEditId(null);
    setEditDraft({ label: "", color: "#71717a" });
    setDeleteTarget(null);
    setDraft(emptyDraft());
  }, [open]);

  function groupLabel(groupKey: string) {
    const option = GROUP_OPTIONS.find((item) => item.value === groupKey);
    return option ? t(option.labelKey, option.fallback) : groupKey;
  }

  function persistDisplaced(
    displacedIds: string[],
    nextCatalog: TaskStatusSummary[],
  ) {
    for (const statusId of displacedIds) {
      const status = nextCatalog.find((item) => item.id === statusId);
      if (status && isCustomWorkTaskStatus(status)) {
        updateWorkTaskStatus(statusId, { groupKey: "active" });
      } else if (status && isCustomListStatus(status)) {
        updateListStatus(statusId, { groupKey: "active" });
      }
    }
  }

  function saveLayout(patch: {
    statusOrder?: string[];
    statusGroupOverrides?: Record<string, string>;
    hiddenStatusIds?: string[];
    catalog?: TaskStatusSummary[];
    keepIds?: Partial<Record<ListStatusGroup, string>>;
  }) {
    if (!liveTask) return;
    const nextCatalog = patch.catalog ?? catalog;
    const enforced = enforceSingletonGroups(nextCatalog, patch.keepIds);
    updateTask(liveTask.id, {
      statusOrder:
        patch.statusOrder ??
        flattenGroupedStatusIds(enforced.catalog, liveTask.statusOrder),
      statusGroupOverrides: {
        ...(patch.statusGroupOverrides ?? groupOverrides),
        ...enforced.overrides,
      },
      ...(patch.hiddenStatusIds !== undefined
        ? { hiddenStatusIds: patch.hiddenStatusIds }
        : {}),
    });
    persistDisplaced(enforced.displacedIds, enforced.catalog);
  }

  function toggleHidden(statusId: string) {
    if (!liveTask) return;
    const hidden = new Set(liveTask.hiddenStatusIds ?? []);
    if (hidden.has(statusId)) {
      hidden.delete(statusId);
    } else if (groupWouldBeEmpty(catalog, [...hidden], statusId)) {
      showFeedback({
        type: "error",
        text: t(
          "errors.status_group_min_one",
          "Katrā grupā jābūt vismaz vienam statusam.",
        ),
      });
      return;
    } else {
      hidden.add(statusId);
    }
    updateTask(liveTask.id, { hiddenStatusIds: [...hidden] });
  }

  function openCreate() {
    if (editDirty) return;
    setEditId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }

  function startEdit(statusId: string, currentLabel: string, currentColor: string) {
    if (editId === statusId) return;
    if (editDirty) return;
    setEditId(statusId);
    setEditDraft({ label: currentLabel, color: currentColor });
  }

  function cancelEdit() {
    setEditId(null);
    setEditDraft({ label: "", color: "#71717a" });
  }

  function saveEdit() {
    if (!editId) return;
    const label = editDraft.label.trim();
    if (!label) {
      showFeedback({
        type: "error",
        text: t("errors.status_label_required", "Norādi statusa nosaukumu."),
      });
      return;
    }
    const original = editOriginalFor(editId);
    const labelChanged = label !== original.label.trim();
    const colorChanged =
      normalizeStatusColor(editDraft.color) !== normalizeStatusColor(original.color);
    if (!labelChanged && !colorChanged) {
      cancelEdit();
      return;
    }
    const customStatus = custom.find((status) => status.id === editId);
    if (customStatus) {
      updateWorkTaskStatus(editId, {
        ...(labelChanged ? { label } : {}),
        ...(colorChanged ? { color: editDraft.color } : {}),
      });
    } else {
      const listCustom = listStatuses.find((status) => status.id === editId);
      if (listCustom) {
        updateListStatus(editId, {
          ...(labelChanged ? { label } : {}),
          ...(colorChanged ? { color: editDraft.color } : {}),
        });
      } else if (labelChanged) {
        renameSystemStatus(editId, label);
      }
    }
    cancelEdit();
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!liveTask) return;
    const label = draft.label.trim();
    if (!label) {
      showFeedback({
        type: "error",
        text: t("errors.status_label_required", "Norādi statusa nosaukumu."),
      });
      return;
    }
    if (!isListStatusGroup(draft.groupKey)) {
      showFeedback({
        type: "error",
        text: t("errors.status_group_invalid", "Izvēlies statusa grupu."),
      });
      return;
    }

    const created = addWorkTaskStatus(liveTask.id, liveTask.listId, {
      label,
      color: draft.color,
      groupKey: draft.groupKey,
    });
    if (!created) {
      showFeedback({
        type: "error",
        text: t("errors.status_create_failed", "Neizdevās pievienot statusu."),
      });
      return;
    }
    const nextCatalog = [...catalog, created];
    saveLayout({
      statusOrder:       insertStatusInGroupOrder(
        nextCatalog,
        liveTask.statusOrder,
        created.id,
        draft.groupKey,
      ),
      statusGroupOverrides: {
        ...groupOverrides,
        [created.id]: draft.groupKey,
      },
      catalog: nextCatalog,
      keepIds: isSingletonStatusGroup(draft.groupKey)
        ? { [draft.groupKey]: created.id }
        : undefined,
    });
    showFeedback({
      type: "success",
      text: t("admin.statuses.feedback.created", "Statuss pievienots."),
    });
    setFormOpen(false);
  }

  function handleDelete() {
    if (!deleteTarget || !liveTask) return;
    if (!canRemoveStatus(catalog, deleteTarget.id)) {
      showFeedback({
        type: "error",
        text: t(
          "errors.status_group_min_one",
          "Katrā grupā jābūt vismaz vienam statusam.",
        ),
      });
      return;
    }
    const preferred = visibleStatusIdsAfter(
      catalog,
      liveTask.statusOrder,
      deleteTarget.id,
    );
    const closedStatusIds = catalog
      .filter((status) => status.groupKey === "closed")
      .map((status) => status.id);
    reassignSubtasksOffStatus(
      liveTask.id,
      deleteTarget.id,
      preferred,
      closedStatusIds,
    );
    saveLayout({
      statusOrder: flattenGroupedStatusIds(catalog, liveTask.statusOrder).filter(
        (id) => id !== deleteTarget.id,
      ),
      statusGroupOverrides: Object.fromEntries(
        Object.entries(groupOverrides).filter(([id]) => id !== deleteTarget.id),
      ),
      hiddenStatusIds: liveTask.hiddenStatusIds.filter(
        (id) => id !== deleteTarget.id,
      ),
      catalog: catalog.filter((status) => status.id !== deleteTarget.id),
    });
    deleteWorkTaskStatus(deleteTarget.id);
    setDeleteTarget(null);
    showFeedback({
      type: "success",
      text: t("admin.statuses.feedback.deleted", "Statuss dzēsts."),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!liveTask) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const moved = moveStatusInLayout(
      catalog,
      liveTask.statusOrder,
      String(active.id),
      String(over.id),
    );
    if (!moved) return;
    if (
      moved.fromGroup !== moved.toGroup &&
      !canRemoveStatus(catalog, String(active.id))
    ) {
      showFeedback({
        type: "error",
        text: t(
          "errors.status_group_min_one",
          "Katrā grupā jābūt vismaz vienam statusam.",
        ),
      });
      return;
    }

    const activeStatus = catalog.find((status) => status.id === active.id);
    if (activeStatus && isCustomWorkTaskStatus(activeStatus) && moved.fromGroup !== moved.toGroup) {
      updateWorkTaskStatus(activeStatus.id, { groupKey: moved.toGroup });
    } else if (activeStatus && isCustomListStatus(activeStatus) && moved.fromGroup !== moved.toGroup) {
      updateListStatus(activeStatus.id, { groupKey: moved.toGroup });
    }

    saveLayout({
      statusOrder: moved.order,
      statusGroupOverrides: {
        ...groupOverrides,
        [String(active.id)]: moved.toGroup,
      },
      catalog: moved.catalog,
      keepIds: isSingletonStatusGroup(moved.toGroup)
        ? { [moved.toGroup]: String(active.id) }
        : undefined,
    });
  }

  return (
    <>
      <AppModal
        open={open && Boolean(liveTask)}
        onOpenChange={onOpenChange}
        title={t("tasks.statuses.title", "Statusi")}
        description={t(
          "tasks.statuses.description",
          "Pielāgo statusus šī uzdevuma apakšuzdevumiem. Bīdi statusus starp grupām — tad grupa nomainās automātiski. Katrā grupā jābūt vismaz vienam statusam.",
        )}
        dirty={editDirty}
        panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      >
        <div className="space-y-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700"
            >
              <i className="fas fa-plus text-xs" aria-hidden="true" />
              {t("admin.statuses.add", "Jauns statuss")}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-zinc-200">
            <DndContext
              id={dndContextId}
              sensors={sensors}
              collisionDetection={collisionDetection}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groups.flatMap((group) =>
                  group.statuses.map((status) => status.id),
                )}
                strategy={verticalListSortingStrategy}
              >
                <ul>
                  {groups.map((group) => (
                    <li key={group.id}>
                      <GroupSeparator
                        id={statusGroupDroppableId(group.id)}
                        label={groupLabel(group.id)}
                        empty={group.statuses.length === 0}
                        emptyLabel={t(
                          "lists.statuses.group.empty",
                          "Šajā grupā vēl nav statusu.",
                        )}
                      />
                      <ul className="divide-y divide-zinc-100">
                        {group.statuses.map((status) => {
                          const taskCustom = isCustomWorkTaskStatus(status)
                            ? status
                            : null;
                          const listCustom = isCustomListStatus(status)
                            ? status
                            : null;
                          const isSystem = !taskCustom && !listCustom;
                          const renamed = Boolean(
                            isSystem && teamStatusLabels[status.id]?.trim(),
                          );
                          const displayLabel = taskCustom
                            ? taskCustom.label
                            : listCustom
                              ? listCustom.label
                              : labelFor(status.id);
                          const hiddenIds = new Set(liveTask?.hiddenStatusIds ?? []);
                          const isHidden = hiddenIds.has(status.id);
                          const canHide =
                            !isHidden &&
                            !groupWouldBeEmpty(catalog, [...hiddenIds], status.id);
                          return (
                            <SortableStatusRow
                              key={status.id}
                              status={status}
                              label={displayLabel}
                              system={isSystem}
                              hidden={isHidden}
                              renamed={renamed}
                              editing={editId === status.id}
                              editValue={editId === status.id ? editDraft.label : displayLabel}
                              editColor={editId === status.id ? editDraft.color : status.color}
                              editDirty={editId === status.id && editDirty}
                              canDelete={
                                Boolean(taskCustom) &&
                                canRemoveStatus(catalog, status.id)
                              }
                              canHide={canHide}
                              dragLabel={t("admin.statuses.drag", "Mainīt secību")}
                              deleteDisabledLabel={t(
                                "errors.status_group_min_one",
                                "Katrā grupā jābūt vismaz vienam statusam.",
                              )}
                              hideDisabledLabel={t(
                                "errors.status_group_min_one",
                                "Katrā grupā jābūt vismaz vienam statusam.",
                              )}
                              systemBadge={t(
                                "lists.statuses.system.badge",
                                "Sistēma",
                              )}
                              listBadge={t(
                                "tasks.statuses.list.badge",
                                "Saraksts",
                              )}
                              taskBadge={t(
                                "tasks.statuses.task.badge",
                                "Uzdevums",
                              )}
                              renamedBadge={t(
                                "lists.statuses.renamed",
                                "Pārsaukts",
                              )}
                              onStartEdit={() =>
                                startEdit(status.id, displayLabel, status.color)
                              }
                              onEditValueChange={(value) =>
                                setEditDraft((current) => ({ ...current, label: value }))
                              }
                              onEditColorChange={(value) =>
                                setEditDraft((current) => ({ ...current, color: value }))
                              }
                              onSaveEdit={saveEdit}
                              onCancelEdit={cancelEdit}
                              onToggleHidden={() => toggleHidden(status.id)}
                              onReset={
                                renamed
                                  ? () => {
                                      if (editId === status.id) cancelEdit();
                                      resetSystemStatusLabel(status.id);
                                      showFeedback({
                                        type: "success",
                                        text: t(
                                          "lists.statuses.reset_done",
                                          "Atjaunots sistēmas nosaukums.",
                                        ),
                                      });
                                    }
                                  : undefined
                              }
                              onDelete={
                                taskCustom
                                  ? () => setDeleteTarget(taskCustom)
                                  : undefined
                              }
                              scopeKind={
                                taskCustom
                                  ? "task"
                                  : listCustom
                                    ? "list"
                                    : "system"
                              }
                              t={t}
                            />
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={formOpen}
        onOpenChange={setFormOpen}
        title={t("admin.statuses.add", "Jauns statuss")}
        description={t(
          "lists.statuses.form.description",
          "Norādi statusa nosaukumu, krāsu un grupu.",
        )}
        dirty={isDirty}
        overlayZIndex={60}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label
              htmlFor="list-status-label"
              className="text-sm font-medium text-zinc-800"
            >
              {t("admin.statuses.label", "Nosaukums")}
            </label>
            <input
              id="list-status-label"
              value={draft.label}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  label: event.target.value,
                }))
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            />
          </div>
          <div>
            <label htmlFor="list-status-color" className="text-sm font-medium text-zinc-800">
              {t("admin.statuses.color", "Krāsa")}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <StatusGlyph color={draft.color} groupKey={draft.groupKey} />
              <input
                id="list-status-color"
                type="color"
                value={draft.color}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, color: event.target.value }))
                }
                className="size-10 shrink-0 rounded-lg border border-zinc-200"
              />
              <input
                type="text"
                value={draft.color}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, color: event.target.value }))
                }
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
          </div>
          <div>
            <label htmlFor="list-status-group" className="text-sm font-medium text-zinc-800">
              {t("admin.statuses.group", "Grupa")}
            </label>
            <select
              id="list-status-group"
              value={draft.groupKey}
              onChange={(event) =>
                setDraft((current) => ({ ...current, groupKey: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            >
              {GROUP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey, option.fallback)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end border-t border-zinc-100 pt-4">
            <button
              type="submit"
              disabled={!isDirty}
              className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.save", "Saglabāt")}
            </button>
          </div>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("admin.statuses.delete.title", "Dzēst statusu?")}
        description={
          <>
            {t("admin.statuses.delete.confirm_prefix", "Vai tiešām dzēst statusu")}{" "}
            <span className="font-semibold text-zinc-900">
              {deleteTarget ? deleteTarget.label : ""}
            </span>
            ?
          </>
        }
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </>
  );
}

export function GroupSeparator({
  id,
  label,
  empty,
  emptyLabel,
}: {
  id: string;
  label: string;
  empty: boolean;
  emptyLabel: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`border-b border-zinc-200 bg-zinc-50 px-4 py-2 ${
        isOver ? "bg-sky-50" : ""
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </p>
      {empty ? (
        <p className="pt-1 text-sm text-zinc-400">{emptyLabel}</p>
      ) : null}
    </div>
  );
}

export function SortableStatusRow({
  status,
  label,
  system,
  hidden,
  renamed,
  editing,
  editValue,
  editColor,
  editDirty,
  canDelete,
  canHide,
  dragLabel,
  deleteDisabledLabel,
  hideDisabledLabel,
  systemBadge,
  listBadge,
  taskBadge,
  renamedBadge,
  scopeKind,
  onStartEdit,
  onEditValueChange,
  onEditColorChange,
  onSaveEdit,
  onCancelEdit,
  onToggleHidden,
  onReset,
  onDelete,
  t,
}: {
  status: TaskStatusSummary;
  label: string;
  system: boolean;
  hidden: boolean;
  renamed: boolean;
  editing: boolean;
  editValue: string;
  editColor: string;
  editDirty: boolean;
  canDelete: boolean;
  canHide: boolean;
  dragLabel: string;
  deleteDisabledLabel: string;
  hideDisabledLabel: string;
  systemBadge: string;
  listBadge: string;
  taskBadge: string;
  renamedBadge: string;
  scopeKind: "system" | "list" | "task";
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onEditColorChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onToggleHidden: () => void;
  onReset?: () => void;
  onDelete?: () => void;
  t: ReturnType<typeof useTranslations>["t"];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  useEffect(() => {
    if (!editing) return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, [editing]);

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex items-center gap-2 px-3 py-2.5 ${
        isDragging ? "relative z-10 bg-white shadow-sm" : ""
      } ${hidden ? "bg-zinc-50/80 opacity-70" : ""}`}
    >
      <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
      {editing && !system ? (
        <label
          className="relative inline-flex shrink-0 cursor-pointer"
          title={t("admin.statuses.color", "Krāsa")}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <StatusGlyph color={editColor} groupKey={status.groupKey} />
          <input
            type="color"
            value={editColor}
            aria-label={t("admin.statuses.color", "Krāsa")}
            onChange={(event) => onEditColorChange(event.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      ) : (
        <StatusGlyph color={status.color} groupKey={status.groupKey} />
      )}
      {editing ? (
        <input
          ref={inputRef}
          value={editValue}
          aria-label={label}
          onChange={(event) => onEditValueChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              if (editDirty) onSaveEdit();
              else onCancelEdit();
            }
            if (event.key === "Escape") {
              event.preventDefault();
              onCancelEdit();
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm font-medium text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
        />
      ) : (
        <button
          type="button"
          onClick={onStartEdit}
          className="min-w-0 flex-1 truncate rounded-lg px-2 py-1 text-left text-sm font-medium text-zinc-900 transition hover:bg-zinc-50"
        >
          {label}
        </button>
      )}
      {editDirty ? (
        <button
          type="button"
          onClick={onSaveEdit}
          onPointerDown={(event) => event.stopPropagation()}
          className="inline-flex shrink-0 items-center rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-zinc-700"
        >
          {t("actions.save", "Saglabāt")}
        </button>
      ) : null}
      {editing ? null : (
        <>
          {scopeKind === "system" ? (
            <span className="hidden text-[11px] font-medium uppercase tracking-wide text-zinc-400 sm:inline">
              {systemBadge}
            </span>
          ) : null}
          {scopeKind === "list" ? (
            <span className="hidden text-[11px] font-medium uppercase tracking-wide text-sky-600/80 sm:inline">
              {listBadge}
            </span>
          ) : null}
          {scopeKind === "task" ? (
            <span className="hidden text-[11px] font-medium uppercase tracking-wide text-violet-600/80 sm:inline">
              {taskBadge}
            </span>
          ) : null}
          {renamed ? (
            <span className="hidden text-[11px] text-zinc-400 sm:inline">
              {renamedBadge}
            </span>
          ) : null}
        </>
      )}
      <IconActionButton
        label={
          hidden
            ? t("lists.statuses.show", "Rādīt")
            : canHide
              ? t("lists.statuses.hide", "Paslēpt")
              : hideDisabledLabel
        }
        icon={hidden ? "fas fa-eye" : "fas fa-eye-slash"}
        variant="muted"
        disabled={!hidden && !canHide}
        onClick={onToggleHidden}
      />
      {onReset ? (
        <IconActionButton
          label={t("lists.statuses.reset_default", "Atjaunot noklusējuma nosaukumu")}
          icon="fas fa-rotate-left"
          variant="muted"
          onClick={onReset}
        />
      ) : null}
      {onDelete ? (
        <IconActionButton
          label={
            canDelete
              ? t("actions.delete", "Dzēst")
              : deleteDisabledLabel
          }
          icon="fas fa-trash"
          variant="delete"
          disabled={!canDelete}
          onClick={() => onDelete()}
        />
      ) : null}
    </li>
  );
}
