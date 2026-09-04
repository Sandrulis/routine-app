"use client";

import { useEffect, useId, useMemo, useState, useCallback } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { StatusGlyph } from "@/app/components/status-control";
import {
  GroupSeparator,
  SortableStatusRow,
  STATUS_GROUP_OPTIONS,
  statusDnDCollisionDetection,
  statusGroupLabel,
} from "@/app/components/status-settings-row";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  applyStatusGroupOverrides,
  canRemoveStatus,
  flattenGroupedStatusIds,
  groupedStatusLayout,
  insertStatusInGroupOrder,
  isListStatusGroup,
  mergeStatusCatalog,
  moveStatusInLayout,
  normalizeStatusColor,
  statusGroupDroppableId,
  type ListStatusGroup,
  type WorkTaskStatusDef,
} from "@/app/lib/list-statuses";
import {
  canToggleStatusVisibility,
  hiddenIdsEqual,
  normalizeHiddenStatusIds,
  toggleStatusVisibility,
} from "@/app/lib/status-visibility";
import { useLists } from "@/app/lib/lists-store";
import { useSystemTaskStatuses } from "@/app/lib/task-statuses";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";
import {
  createTemplateTaskStatusId,
  type TemplateTaskStatusDef,
  type WorkTemplateItem,
} from "@/app/lib/templates";

const GROUP_OPTIONS = STATUS_GROUP_OPTIONS;

const collisionDetection = statusDnDCollisionDetection;

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
  return { label: "", color: "#71717a", groupKey };
}

function templateCustomAsCatalog(item: WorkTemplateItem): WorkTaskStatusDef[] {
  return (item.taskStatuses ?? []).map((status) => ({
    id: status.id,
    label: status.label,
    labels: {},
    color: status.color,
    icon: status.icon ?? null,
    sortOrder: status.sortOrder,
    groupKey: status.groupKey,
    parentTaskId: item.id,
    listId: "",
  }));
}

function isTemplateCustomStatus(
  status: TaskStatusSummary,
  custom: TemplateTaskStatusDef[],
): status is TemplateTaskStatusDef & TaskStatusSummary {
  return custom.some((row) => row.id === status.id);
}

export function TemplateTaskStatusesModal({
  item,
  open,
  onOpenChange,
  onItemChange,
}: {
  item: WorkTemplateItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemChange: (item: WorkTemplateItem) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { statuses: systemStatuses, labelFor } = useSystemTaskStatuses();
  const { teamStatusLabels, renameSystemStatus, resetSystemStatusLabel } =
    useLists();

  const liveItem = item?.kind === "task" ? item : null;
  const custom = liveItem?.taskStatuses ?? [];

  const catalog = useMemo(() => {
    if (!liveItem) return [];
    return applyStatusGroupOverrides(
      mergeStatusCatalog(
        systemStatuses,
        [],
        null,
        templateCustomAsCatalog(liveItem),
        liveItem.id,
      ),
      liveItem.statusGroupOverrides ?? {},
    );
  }, [liveItem, systemStatuses]);

  const groups = useMemo(
    () => groupedStatusLayout(catalog, liveItem?.statusOrder ?? []),
    [catalog, liveItem?.statusOrder],
  );
  const laidOutStatuses = useMemo(
    () => groups.flatMap((group) => group.statuses),
    [groups],
  );
  const isTemplateSystemStatus = useCallback(
    (status: TaskStatusSummary) =>
      !isTemplateCustomStatus(status, liveItem?.taskStatuses ?? []),
    [liveItem?.taskStatuses],
  );
  const effectiveHiddenIds = useMemo(
    () =>
      normalizeHiddenStatusIds(
        laidOutStatuses,
        liveItem?.hiddenStatusIds ?? [],
        isTemplateSystemStatus,
      ),
    [isTemplateSystemStatus, laidOutStatuses, liveItem?.hiddenStatusIds],
  );

  const groupOverrides = liveItem?.statusGroupOverrides ?? {};
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({
    label: "",
    color: "#71717a",
  });
  const [deleteTarget, setDeleteTarget] = useState<TemplateTaskStatusDef | null>(
    null,
  );
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function editOriginalFor(statusId: string): EditDraft {
    const customStatus = custom.find((status) => status.id === statusId);
    if (customStatus) {
      return { label: customStatus.label, color: customStatus.color };
    }
    const status = catalog.find((row) => row.id === statusId);
    return {
      label: labelFor(statusId),
      color: status?.color ?? "#71717a",
    };
  }

  const editOriginal = editId
    ? editOriginalFor(editId)
    : { label: "", color: "#71717a" };
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

  useEffect(() => {
    if (!open || !liveItem) return;
    const current = liveItem.hiddenStatusIds ?? [];
    if (!hiddenIdsEqual(effectiveHiddenIds, current)) {
      saveLayout({ hiddenStatusIds: effectiveHiddenIds });
    }
  }, [effectiveHiddenIds, liveItem, open]);

  function toggleHidden(statusId: string) {
    if (!liveItem) return;
    const nextHidden = toggleStatusVisibility(
      catalog,
      effectiveHiddenIds,
      statusId,
      isTemplateSystemStatus,
    );
    if (!nextHidden) {
      showFeedback({
        type: "error",
        text: t(
          "errors.status_group_min_one",
          "Katrā grupā jābūt vismaz vienam statusam.",
        ),
      });
      return;
    }
    const normalized = normalizeHiddenStatusIds(
      laidOutStatuses,
      nextHidden,
      isTemplateSystemStatus,
    );
    saveLayout({ hiddenStatusIds: normalized });
  }

  function groupLabel(groupKey: string) {
    return statusGroupLabel(groupKey, t);
  }

  function saveLayout(patch: {
    statusOrder?: string[];
    statusGroupOverrides?: Record<string, string>;
    hiddenStatusIds?: string[];
    taskStatuses?: TemplateTaskStatusDef[];
    catalog?: TaskStatusSummary[];
  }) {
    if (!liveItem) return;
    const nextCatalog = patch.catalog ?? catalog;
    onItemChange({
      ...liveItem,
      statusOrder:
        patch.statusOrder ??
        flattenGroupedStatusIds(nextCatalog, liveItem.statusOrder),
      statusGroupOverrides: {
        ...groupOverrides,
        ...(patch.statusGroupOverrides ?? {}),
      },
      ...(patch.hiddenStatusIds !== undefined
        ? { hiddenStatusIds: patch.hiddenStatusIds }
        : {}),
      ...(patch.taskStatuses !== undefined
        ? { taskStatuses: patch.taskStatuses }
        : {}),
    });
  }

  function openCreate() {
    if (editDirty) return;
    setEditId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }

  function startEdit(statusId: string, currentLabel: string, currentColor: string) {
    if (editId === statusId || editDirty) return;
    setEditId(statusId);
    setEditDraft({ label: currentLabel, color: currentColor });
  }

  function cancelEdit() {
    setEditId(null);
    setEditDraft({ label: "", color: "#71717a" });
  }

  function saveEdit() {
    if (!editId || !liveItem) return;
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
      onItemChange({
        ...liveItem,
        taskStatuses: custom.map((status) =>
          status.id === editId
            ? {
                ...status,
                ...(labelChanged ? { label } : {}),
                ...(colorChanged ? { color: editDraft.color } : {}),
              }
            : status,
        ),
      });
    } else if (labelChanged) {
      renameSystemStatus(editId, label);
    }
    cancelEdit();
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!liveItem) return;
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

    const created: TemplateTaskStatusDef = {
      id: createTemplateTaskStatusId(),
      label,
      color: normalizeStatusColor(draft.color),
      groupKey: draft.groupKey,
      sortOrder: custom.length,
    };
    const createdSummary: TaskStatusSummary = {
      id: created.id,
      label: created.label,
      labels: {},
      color: created.color,
      icon: created.icon ?? null,
      sortOrder: created.sortOrder,
      groupKey: created.groupKey,
    };
    const nextCustom = [...custom, created];
    const nextCatalog = [...catalog, createdSummary];
    saveLayout({
      taskStatuses: nextCustom,
      statusOrder: insertStatusInGroupOrder(
        nextCatalog,
        liveItem.statusOrder,
        created.id,
        draft.groupKey,
      ),
      statusGroupOverrides: {
        ...groupOverrides,
        [created.id]: draft.groupKey,
      },
      catalog: nextCatalog,
    });
    showFeedback({
      type: "success",
      text: t("admin.statuses.feedback.created", "Statuss pievienots."),
    });
    setFormOpen(false);
    setDraft(emptyDraft());
  }

  function handleDelete() {
    if (!deleteTarget || !liveItem) return;
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
    saveLayout({
      taskStatuses: custom.filter((status) => status.id !== deleteTarget.id),
      statusOrder: flattenGroupedStatusIds(catalog, liveItem.statusOrder).filter(
        (id) => id !== deleteTarget.id,
      ),
      statusGroupOverrides: Object.fromEntries(
        Object.entries(groupOverrides).filter(([id]) => id !== deleteTarget.id),
      ),
      hiddenStatusIds: liveItem.hiddenStatusIds.filter(
        (id) => id !== deleteTarget.id,
      ),
      catalog: catalog.filter((status) => status.id !== deleteTarget.id),
    });
    setDeleteTarget(null);
    showFeedback({
      type: "success",
      text: t("admin.statuses.feedback.deleted", "Statuss dzēsts."),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!liveItem) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const moved = moveStatusInLayout(
      catalog,
      liveItem.statusOrder,
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
    let nextCustom = custom;
    if (
      activeStatus &&
      isTemplateCustomStatus(activeStatus, custom) &&
      moved.fromGroup !== moved.toGroup
    ) {
      nextCustom = custom.map((status) =>
        status.id === activeStatus.id
          ? { ...status, groupKey: moved.toGroup }
          : status,
      );
    }

    saveLayout({
      taskStatuses: nextCustom,
      statusOrder: moved.order,
      statusGroupOverrides: {
        ...groupOverrides,
        [String(active.id)]: moved.toGroup,
      },
      catalog: moved.catalog,
    });
  }

  return (
    <>
      <AppModal
        open={open && Boolean(liveItem)}
        onOpenChange={onOpenChange}
        title={t("tasks.statuses.title", "Statusi")}
        description={t(
          "templates.statuses.description",
          "Definē apakšuzdevumu statusus šim veidnes uzdevumam. Pievienojot šablonu mapē, statusi tiks izveidoti automātiski.",
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
              <ul>
                {groups.map((group) => (
                  <li key={group.id}>
                    <GroupSeparator
                      id={statusGroupDroppableId(group.id)}
                      label={groupLabel(group.id)}
                      empty={group.statuses.length === 0}
                      emptyLabel={t(
                        "lists.statuses.group.empty",
                        "Velc statusu šeit, lai pievienotu grupai.",
                      )}
                    />
                    <SortableContext
                      items={group.statuses.map((status) => status.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <ul className="divide-y divide-zinc-100">
                        {group.statuses.map((status) => {
                          const taskCustom = isTemplateCustomStatus(status, custom)
                            ? custom.find((row) => row.id === status.id) ?? null
                            : null;
                          const isSystem = !taskCustom;
                          const renamed = Boolean(
                            isSystem && teamStatusLabels[status.id]?.trim(),
                          );
                          const displayLabel = taskCustom
                            ? taskCustom.label
                            : labelFor(status.id);
                          const hiddenIds = new Set(effectiveHiddenIds);
                          const isHidden = hiddenIds.has(status.id);
                          const canToggleVisibility = canToggleStatusVisibility(
                            laidOutStatuses,
                            catalog,
                            liveItem?.hiddenStatusIds ?? [],
                            status.id,
                            isTemplateSystemStatus,
                          );
                          return (
                            <SortableStatusRow
                              key={status.id}
                              status={status}
                              label={displayLabel}
                              system={isSystem}
                              hidden={isHidden}
                              renamed={renamed}
                              editing={editId === status.id}
                              editValue={
                                editId === status.id ? editDraft.label : displayLabel
                              }
                              editColor={
                                editId === status.id ? editDraft.color : status.color
                              }
                              editDirty={editId === status.id && editDirty}
                              canDelete={
                                Boolean(taskCustom) &&
                                canRemoveStatus(catalog, status.id)
                              }
                              canToggleVisibility={canToggleVisibility}
                              visibilityDisabledLabel={t(
                                "errors.status_group_min_one",
                                "Katrā grupā jābūt vismaz vienam statusam.",
                              )}
                              dragLabel={t("admin.statuses.drag", "Mainīt secību")}
                              deleteDisabledLabel={t(
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
                              scopeKind={taskCustom ? "task" : "system"}
                              menuActions={{
                                changeColor: Boolean(taskCustom),
                                changeIcon: Boolean(taskCustom),
                                delete: Boolean(taskCustom),
                              }}
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
                              onToggleVisibility={() => toggleHidden(status.id)}
                              onChangeColor={
                                taskCustom
                                  ? (color) => {
                                      const nextCustom = custom.map((row) =>
                                        row.id === status.id ? { ...row, color } : row,
                                      );
                                      saveLayout({ taskStatuses: nextCustom });
                                    }
                                  : undefined
                              }
                              onChangeIcon={
                                taskCustom
                                  ? (icon) => {
                                      const nextCustom = custom.map((row) =>
                                        row.id === status.id ? { ...row, icon } : row,
                                      );
                                      saveLayout({ taskStatuses: nextCustom });
                                    }
                                  : undefined
                              }
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
                              t={t}
                            />
                          );
                        })}
                      </ul>
                    </SortableContext>
                  </li>
                ))}
              </ul>
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
              htmlFor="template-status-label"
              className="text-sm font-medium text-zinc-800"
            >
              {t("admin.statuses.label", "Nosaukums")}
            </label>
            <input
              id="template-status-label"
              value={draft.label}
              onChange={(event) =>
                setDraft((current) => ({ ...current, label: event.target.value }))
              }
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            />
          </div>
          <div>
            <label
              htmlFor="template-status-color"
              className="text-sm font-medium text-zinc-800"
            >
              {t("admin.statuses.color", "Krāsa")}
            </label>
            <div className="mt-2 flex items-center gap-3">
              <StatusGlyph color={draft.color} groupKey={draft.groupKey} />
              <input
                id="template-status-color"
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
            <label
              htmlFor="template-status-group"
              className="text-sm font-medium text-zinc-800"
            >
              {t("admin.statuses.group", "Grupa")}
            </label>
            <select
              id="template-status-group"
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
