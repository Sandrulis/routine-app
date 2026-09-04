"use client";

import { useEffect, useId, useMemo, useState } from "react";
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
import { DragHandle } from "@/app/components/drag-handle";
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
import type { ListStatus } from "@/app/lib/list-statuses";
import {
  applyStatusGroupOverrides,
  canRemoveStatus,
  flattenGroupedStatusIds,
  groupedStatusLayout,
  insertStatusInGroupOrder,
  isCustomListStatus,
  isListStatusGroup,
  mergeStatusCatalog,
  moveStatusInLayout,
  normalizeStatusColor,
  statusGroupDroppableId,
  visibleStatusIdsAfter,
  type ListStatusGroup,
} from "@/app/lib/list-statuses";
import {
  canToggleStatusVisibility,
  hiddenIdsEqual,
  normalizeHiddenStatusIds,
  toggleStatusVisibility,
} from "@/app/lib/status-visibility";
import { useLists } from "@/app/lib/lists-store";
import type { WorkList } from "@/app/lib/lists";
import { useSystemTaskStatuses } from "@/app/lib/task-statuses";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

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
  return {
    label: "",
    color: "#71717a",
    groupKey,
  };
}

export function ListStatusesModal({
  list,
  open,
  onOpenChange,
}: {
  list: WorkList | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { statuses: systemStatuses, labelFor } = useSystemTaskStatuses();
  const {
    lists,
    listStatuses,
    updateList,
    addListStatus,
    updateListStatus,
    deleteListStatus,
    reassignTasksOffStatus,
    teamStatusLabels,
    renameSystemStatus,
    resetSystemStatusLabel,
  } = useLists();
  const liveList =
    (list && lists.find((item) => item.id === list.id)) || list;
  const custom = useMemo(
    () =>
      liveList
        ? listStatuses.filter((status) => status.listId === liveList.id)
        : [],
    [liveList, listStatuses],
  );
  const catalog = useMemo(() => {
    if (!liveList) return [];
    return applyStatusGroupOverrides(
      mergeStatusCatalog(systemStatuses, custom, liveList.id),
      liveList.statusGroupOverrides,
    );
  }, [custom, liveList, systemStatuses]);
  const groups = useMemo(
    () => groupedStatusLayout(catalog, liveList?.statusOrder ?? []),
    [catalog, liveList?.statusOrder],
  );
  const laidOutStatuses = useMemo(
    () => groups.flatMap((group) => group.statuses),
    [groups],
  );
  const effectiveHiddenIds = useMemo(
    () =>
      normalizeHiddenStatusIds(
        laidOutStatuses,
        liveList?.hiddenStatusIds ?? [],
        (status) => !isCustomListStatus(status),
      ),
    [laidOutStatuses, liveList?.hiddenStatusIds],
  );
  const groupOverrides = liveList?.statusGroupOverrides ?? {};
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editId, setEditId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft>({ label: "", color: "#71717a" });
  const [deleteTarget, setDeleteTarget] = useState<ListStatus | null>(null);
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function editOriginalFor(statusId: string): EditDraft {
    const customStatus = custom.find((status) => status.id === statusId);
    if (customStatus) {
      return { label: customStatus.label, color: customStatus.color };
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
    return statusGroupLabel(groupKey, t);
  }

  function saveLayout(patch: {
    statusOrder?: string[];
    statusGroupOverrides?: Record<string, string>;
    hiddenStatusIds?: string[];
    catalog?: TaskStatusSummary[];
  }) {
    if (!liveList) return;
    const nextCatalog = patch.catalog ?? catalog;
    updateList(liveList.id, {
      statusOrder:
        patch.statusOrder ??
        flattenGroupedStatusIds(nextCatalog, liveList.statusOrder),
      statusGroupOverrides: patch.statusGroupOverrides ?? groupOverrides,
      ...(patch.hiddenStatusIds !== undefined
        ? { hiddenStatusIds: patch.hiddenStatusIds }
        : {}),
    });
  }

  useEffect(() => {
    if (!open || !liveList) return;
    const current = liveList.hiddenStatusIds ?? [];
    if (!hiddenIdsEqual(effectiveHiddenIds, current)) {
      updateList(liveList.id, { hiddenStatusIds: effectiveHiddenIds });
    }
  }, [effectiveHiddenIds, liveList, open, updateList]);

  function toggleHidden(statusId: string) {
    if (!liveList) return;
    const nextHidden = toggleStatusVisibility(
      catalog,
      effectiveHiddenIds,
      statusId,
      (status) => !isCustomListStatus(status),
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
      (status) => !isCustomListStatus(status),
    );
    updateList(liveList.id, { hiddenStatusIds: normalized });
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
      updateListStatus(editId, {
        ...(labelChanged ? { label } : {}),
        ...(colorChanged ? { color: editDraft.color } : {}),
      });
    } else if (labelChanged) {
      renameSystemStatus(editId, label);
    }
    cancelEdit();
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!liveList) return;
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

    const created = addListStatus(liveList.id, {
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
      statusOrder: insertStatusInGroupOrder(
        nextCatalog,
        liveList.statusOrder,
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
  }

  function handleDelete() {
    if (!deleteTarget || !liveList) return;
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
      liveList.statusOrder,
      deleteTarget.id,
    );
    const closedStatusIds = catalog
      .filter((status) => status.groupKey === "closed")
      .map((status) => status.id);
    reassignTasksOffStatus(
      liveList.id,
      deleteTarget.id,
      preferred,
      closedStatusIds,
    );
    saveLayout({
      statusOrder: flattenGroupedStatusIds(catalog, liveList.statusOrder).filter(
        (id) => id !== deleteTarget.id,
      ),
      statusGroupOverrides: Object.fromEntries(
        Object.entries(groupOverrides).filter(([id]) => id !== deleteTarget.id),
      ),
      hiddenStatusIds: (liveList.hiddenStatusIds ?? []).filter(
        (id) => id !== deleteTarget.id,
      ),
      catalog: catalog.filter((status) => status.id !== deleteTarget.id),
    });
    deleteListStatus(deleteTarget.id);
    setDeleteTarget(null);
    showFeedback({
      type: "success",
      text: t("admin.statuses.feedback.deleted", "Statuss dzēsts."),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!liveList) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const moved = moveStatusInLayout(
      catalog,
      liveList.statusOrder,
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
    if (activeStatus && isCustomListStatus(activeStatus) && moved.fromGroup !== moved.toGroup) {
      updateListStatus(activeStatus.id, { groupKey: moved.toGroup });
    }

    saveLayout({
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
        open={open && Boolean(liveList)}
        onOpenChange={onOpenChange}
        title={t("lists.statuses.title", "Statusi")}
        description={t(
          "lists.statuses.description",
          "Atzīmē statusus, lai tie būtu redzami sarakstā. Grupā Nav sākts vienlaikus var būt aktīvs tikai viens. Bīdi statusus starp grupām — grupa nomainās automātiski.",
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
                          const customStatus = isCustomListStatus(status)
                            ? status
                            : null;
                          const renamed = Boolean(
                            !customStatus && teamStatusLabels[status.id]?.trim(),
                          );
                          const displayLabel = customStatus
                            ? customStatus.label
                            : labelFor(status.id);
                          const hiddenIds = new Set(effectiveHiddenIds);
                          const isHidden = hiddenIds.has(status.id);
                          const canToggleVisibility = canToggleStatusVisibility(
                            laidOutStatuses,
                            catalog,
                            liveList?.hiddenStatusIds ?? [],
                            status.id,
                            (item) => !isCustomListStatus(item),
                          );
                          return (
                            <SortableStatusRow
                              key={status.id}
                              status={status}
                              label={displayLabel}
                              system={!customStatus}
                              hidden={isHidden}
                              renamed={renamed}
                              editing={editId === status.id}
                              editValue={editId === status.id ? editDraft.label : displayLabel}
                              editColor={editId === status.id ? editDraft.color : status.color}
                              editDirty={editId === status.id && editDirty}
                              canDelete={
                                Boolean(customStatus) &&
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
                              renamedBadge={t(
                                "lists.statuses.renamed",
                                "Pārsaukts",
                              )}
                              scopeKind={customStatus ? "list" : "system"}
                              menuActions={{
                                changeColor: Boolean(customStatus),
                                changeIcon: Boolean(customStatus),
                                delete: Boolean(customStatus),
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
                                customStatus
                                  ? (color) => updateListStatus(status.id, { color })
                                  : undefined
                              }
                              onChangeIcon={
                                customStatus
                                  ? (icon) => updateListStatus(status.id, { icon })
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
                                customStatus
                                  ? () => setDeleteTarget(customStatus)
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
