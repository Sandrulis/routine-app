"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import type { ListStatus } from "@/app/lib/list-statuses";
import {
  applyStatusGroupOverrides,
  canRemoveStatus,
  enforceSingletonGroups,
  flattenGroupedStatusIds,
  groupedStatusLayout,
  insertStatusInGroupOrder,
  isCustomListStatus,
  isListStatusGroup,
  isSingletonStatusGroup,
  mergeStatusCatalog,
  moveStatusInLayout,
  statusGroupDroppableId,
  visibleStatusIdsAfter,
  type ListStatusGroup,
} from "@/app/lib/list-statuses";
import { useLists } from "@/app/lib/lists-store";
import type { WorkList } from "@/app/lib/lists";
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
    const merged = applyStatusGroupOverrides(
      mergeStatusCatalog(systemStatuses, custom, liveList.id),
      liveList.statusGroupOverrides,
    );
    return enforceSingletonGroups(merged).catalog;
  }, [custom, liveList, systemStatuses]);
  const groups = useMemo(
    () => groupedStatusLayout(catalog, liveList?.statusOrder ?? []),
    [catalog, liveList?.statusOrder],
  );
  const groupOverrides = liveList?.statusGroupOverrides ?? {};
  const [formOpen, setFormOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ListStatus | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const renameOriginal = renameId
    ? (() => {
        const customStatus = custom.find((status) => status.id === renameId);
        if (customStatus) return customStatus.label;
        return labelFor(renameId);
      })()
    : "";
  const renameDirty =
    renameId !== null && renameDraft.trim() !== renameOriginal.trim();
  const isDirty = JSON.stringify(draft) !== JSON.stringify(emptyDraft());

  useEffect(() => {
    if (open) return;
    setFormOpen(false);
    setRenameId(null);
    setRenameDraft("");
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
      if (status && isCustomListStatus(status)) {
        updateListStatus(statusId, { groupKey: "active" });
      }
    }
  }

  function saveLayout(patch: {
    statusOrder?: string[];
    statusGroupOverrides?: Record<string, string>;
    catalog?: TaskStatusSummary[];
    keepIds?: Partial<Record<ListStatusGroup, string>>;
  }) {
    if (!liveList) return;
    const nextCatalog = patch.catalog ?? catalog;
    const enforced = enforceSingletonGroups(nextCatalog, patch.keepIds);
    updateList(liveList.id, {
      statusOrder:
        patch.statusOrder ??
        flattenGroupedStatusIds(enforced.catalog, liveList.statusOrder),
      statusGroupOverrides: {
        ...(patch.statusGroupOverrides ?? groupOverrides),
        ...enforced.overrides,
      },
    });
    persistDisplaced(enforced.displacedIds, enforced.catalog);
  }

  function openCreate() {
    if (renameDirty) return;
    setRenameId(null);
    setDraft(emptyDraft());
    setFormOpen(true);
  }

  function startRename(statusId: string, currentLabel: string) {
    if (renameId === statusId) return;
    if (renameDirty) return;
    setRenameId(statusId);
    setRenameDraft(currentLabel);
  }

  function cancelRename() {
    setRenameId(null);
    setRenameDraft("");
  }

  function saveRename() {
    if (!renameId) return;
    const label = renameDraft.trim();
    if (!label) {
      showFeedback({
        type: "error",
        text: t("errors.status_label_required", "Norādi statusa nosaukumu."),
      });
      return;
    }
    if (label === renameOriginal.trim()) {
      cancelRename();
      return;
    }
    const customStatus = custom.find((status) => status.id === renameId);
    if (customStatus) {
      updateListStatus(renameId, { label });
    } else {
      renameSystemStatus(renameId, label);
    }
    cancelRename();
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
      keepIds: isSingletonStatusGroup(moved.toGroup)
        ? { [moved.toGroup]: String(active.id) }
        : undefined,
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
          "Bīdi statusus arī starp grupām — tad grupa nomainās automātiski. Sistēmas statusu var pārsaukt šīs komandas ietvaros. Katrā grupā jābūt vismaz vienam statusam. Grupās Nav sākts un Slēgts drīkst būt tikai viens statuss.",
        )}
        dirty={renameDirty}
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
                          const customStatus = isCustomListStatus(status)
                            ? status
                            : null;
                          const renamed = Boolean(
                            !customStatus && teamStatusLabels[status.id]?.trim(),
                          );
                          const displayLabel = customStatus
                            ? customStatus.label
                            : labelFor(status.id);
                          return (
                            <SortableStatusRow
                              key={status.id}
                              status={status}
                              label={displayLabel}
                              system={!customStatus}
                              renamed={renamed}
                              editing={renameId === status.id}
                              editValue={renameId === status.id ? renameDraft : displayLabel}
                              editDirty={renameId === status.id && renameDirty}
                              canDelete={
                                Boolean(customStatus) &&
                                canRemoveStatus(catalog, status.id)
                              }
                              dragLabel={t("admin.statuses.drag", "Mainīt secību")}
                              deleteDisabledLabel={t(
                                "errors.status_group_min_one",
                                "Katrā grupā jābūt vismaz vienam statusam.",
                              )}
                              systemBadge={t(
                                "lists.statuses.system.badge",
                                "Sistēma",
                              )}
                              renamedBadge={t(
                                "lists.statuses.renamed",
                                "Pārsaukts",
                              )}
                              onStartEdit={() => startRename(status.id, displayLabel)}
                              onEditValueChange={setRenameDraft}
                              onSaveEdit={saveRename}
                              onCancelEdit={cancelRename}
                              onReset={
                                renamed
                                  ? () => {
                                      if (renameId === status.id) cancelRename();
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

function GroupSeparator({
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

function SortableStatusRow({
  status,
  label,
  system,
  renamed,
  editing,
  editValue,
  editDirty,
  canDelete,
  dragLabel,
  deleteDisabledLabel,
  systemBadge,
  renamedBadge,
  onStartEdit,
  onEditValueChange,
  onSaveEdit,
  onCancelEdit,
  onReset,
  onDelete,
  t,
}: {
  status: TaskStatusSummary;
  label: string;
  system: boolean;
  renamed: boolean;
  editing: boolean;
  editValue: string;
  editDirty: boolean;
  canDelete: boolean;
  dragLabel: string;
  deleteDisabledLabel: string;
  systemBadge: string;
  renamedBadge: string;
  onStartEdit: () => void;
  onEditValueChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
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
      }`}
    >
      <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
      <StatusGlyph color={status.color} groupKey={status.groupKey} />
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
          {system ? (
            <span className="hidden text-[11px] font-medium uppercase tracking-wide text-zinc-400 sm:inline">
              {systemBadge}
            </span>
          ) : null}
          {renamed ? (
            <span className="hidden text-[11px] text-zinc-400 sm:inline">
              {renamedBadge}
            </span>
          ) : null}
        </>
      )}
      {onReset ? (
        <IconActionButton
          label={t("lists.statuses.reset_default", "Atjaunot noklusējuma nosaukumu")}
          icon="fas fa-rotate-left"
          variant="muted"
          onClick={onReset}
        />
      ) : null}
      {system ? null : (
        <IconActionButton
          label={
            canDelete
              ? t("actions.delete", "Dzēst")
              : deleteDisabledLabel
          }
          icon="fas fa-trash"
          variant="delete"
          disabled={!canDelete}
          onClick={() => onDelete?.()}
        />
      )}
    </li>
  );
}
