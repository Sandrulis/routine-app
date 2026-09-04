"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  createTaskStatusAction,
  deleteTaskStatusAction,
  reorderTaskStatusesAction,
  updateTaskStatusAction,
} from "@/app/(app)/admin/actions";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { StatusGlyph } from "@/app/components/status-control";
import { StatusIconPickerModal } from "@/app/components/status-icon-picker-modal";
import {
  STATUS_GROUP_OPTIONS,
  statusDnDCollisionDetection,
} from "@/app/components/status-settings-row";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  groupWouldBeEmpty,
  isSingletonStatusGroup,
  LIST_STATUS_GROUPS,
  moveStatusInLayout,
  statusGroupDroppableId,
} from "@/app/lib/list-statuses";
import type {
  SiteLanguageSummary,
  TaskStatusSummary,
} from "@/app/lib/site-admin/types";

const GROUP_OPTIONS = STATUS_GROUP_OPTIONS;

const collisionDetection = statusDnDCollisionDetection;

type StatusDraft = {
  id: string;
  labels: Record<string, string>;
  color: string;
  icon: string | null;
  groupKey: string;
};

function emptyDraft(languages: SiteLanguageSummary[]): StatusDraft {
  return {
    id: "",
    labels: Object.fromEntries(languages.map((language) => [language.code, ""])),
    color: "#71717a",
    icon: null,
    groupKey: "active",
  };
}

function draftFromStatus(
  status: TaskStatusSummary,
  languages: SiteLanguageSummary[],
): StatusDraft {
  return {
    id: status.id,
    labels: Object.fromEntries(
      languages.map((language) => [
        language.code,
        status.labels[language.code] ?? "",
      ]),
    ),
    color: status.color,
    icon: status.icon ?? null,
    groupKey: status.groupKey,
  };
}

function statusInput(status: TaskStatusSummary) {
  return {
    labels: status.labels,
    color: status.color,
    icon: status.icon ?? null,
    groupKey: status.groupKey,
  };
}

export function AdminStatusesManager({
  statuses: initialStatuses,
  languages,
}: {
  statuses: TaskStatusSummary[];
  languages: SiteLanguageSummary[];
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft(languages));
  const [deleteTarget, setDeleteTarget] = useState<TaskStatusSummary | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState(initialStatuses);
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setStatuses(initialStatuses);
  }, [initialStatuses]);

  const initialDraft = editingId
    ? draftFromStatus(
        statuses.find((status) => status.id === editingId) ?? {
          id: "",
          labels: {},
          label: "",
          color: "#71717a",
          icon: null,
          sortOrder: 0,
          groupKey: "active",
        },
        languages,
      )
    : emptyDraft(languages);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    if (!modalOpen) {
      setEditingId(null);
      setDraft(emptyDraft(languages));
      setIconPickerOpen(false);
    }
  }, [languages, modalOpen]);

  function openCreate() {
    clearFeedback();
    setEditingId(null);
    setDraft(emptyDraft(languages));
    setModalOpen(true);
  }

  function openEdit(status: TaskStatusSummary) {
    clearFeedback();
    setEditingId(status.id);
    setDraft(draftFromStatus(status, languages));
    setModalOpen(true);
  }

  function quickUpdate(
    status: TaskStatusSummary,
    patch: Partial<Pick<StatusDraft, "color" | "icon">>,
  ) {
    clearFeedback();
    startTransition(async () => {
      const result = await updateTaskStatusAction(status.id, {
        ...statusInput(status),
        ...patch,
      });
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      showFeedback({
        type: "success",
        text: t("admin.statuses.feedback.saved", "Statuss saglabāts."),
      });
      router.refresh();
    });
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    startTransition(async () => {
      if (editingId) {
        const current = statuses.find((status) => status.id === editingId);
        if (
          current &&
          current.groupKey !== draft.groupKey &&
          groupWouldBeEmpty(statuses, [], editingId)
        ) {
          showFeedback({
            type: "error",
            text: translateActionError(t, "errors.status_group_min_one"),
          });
          return;
        }
      }

      const result = editingId
        ? await updateTaskStatusAction(editingId, {
            labels: draft.labels,
            color: draft.color,
            icon: draft.icon,
            groupKey: draft.groupKey,
          })
        : await createTaskStatusAction(draft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingId
          ? t("admin.statuses.feedback.saved", "Statuss saglabāts.")
          : t("admin.statuses.feedback.created", "Statuss pievienots."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      if (groupWouldBeEmpty(statuses, [], deleteTarget.id)) {
        showFeedback({
          type: "error",
          text: translateActionError(t, "errors.status_group_min_one"),
        });
        return;
      }

      const result = await deleteTaskStatusAction(deleteTarget.id);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("admin.statuses.feedback.deleted", "Statuss dzēsts."),
      });
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isPending) return;

    const order = LIST_STATUS_GROUPS.flatMap((groupId) =>
      statuses
        .filter((status) => status.groupKey === groupId)
        .map((status) => status.id),
    );
    const moved = moveStatusInLayout(
      statuses,
      order,
      String(active.id),
      String(over.id),
    );
    if (!moved) return;

    if (
      moved.fromGroup !== moved.toGroup &&
      groupWouldBeEmpty(statuses, [], String(active.id))
    ) {
      showFeedback({
        type: "error",
        text: translateActionError(t, "errors.status_group_min_one"),
      });
      return;
    }

    const byId = new Map(moved.catalog.map((status) => [status.id, status]));
    let next = moved.order
      .map((id) => byId.get(id))
      .filter((status): status is TaskStatusSummary => Boolean(status));
    if (isSingletonStatusGroup(moved.toGroup)) {
      next = next.map((status) =>
        status.groupKey === moved.toGroup && status.id !== String(active.id)
          ? { ...status, groupKey: "active" }
          : status,
      );
    }
    setStatuses(next);

    const current = statuses.find((status) => status.id === active.id);
    const displaced = next.filter(
      (status) =>
        status.groupKey === "active" &&
        statuses.some(
          (item) => item.id === status.id && item.groupKey === moved.toGroup,
        ),
    );
    startTransition(async () => {
      if (moved.fromGroup !== moved.toGroup && current) {
        const updateResult = await updateTaskStatusAction(current.id, {
          ...statusInput(current),
          groupKey: moved.toGroup,
        });
        if (!updateResult.ok) {
          showFeedback({
            type: "error",
            text: translateActionError(t, updateResult.error),
          });
          setStatuses(initialStatuses);
          return;
        }
      }
      for (const status of displaced) {
        const result = await updateTaskStatusAction(status.id, {
          ...statusInput(status),
          groupKey: "active",
        });
        if (!result.ok) {
          showFeedback({
            type: "error",
            text: translateActionError(t, result.error),
          });
          setStatuses(initialStatuses);
          return;
        }
      }

      const result = await reorderTaskStatusesAction(next.map((status) => status.id));
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        setStatuses(initialStatuses);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("admin.statuses.add", "Jauns statuss")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-5 py-3">
                    {t("admin.statuses.label", "Nosaukums")}
                  </th>
                  <th className="px-5 py-3">
                    {t("admin.statuses.color", "Krāsa")}
                  </th>
                  <th className="px-5 py-3 text-right">
                    {t("common.actions", "Darbības")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {GROUP_OPTIONS.map((group) => {
                  const groupStatuses = statuses.filter(
                    (status) => status.groupKey === group.value,
                  );
                  return (
                    <GroupSection
                      key={group.value}
                      id={statusGroupDroppableId(group.value)}
                      label={t(group.labelKey, group.fallback)}
                      empty={groupStatuses.length === 0}
                      emptyLabel={t(
                        "lists.statuses.group.empty",
                        "Velc statusu šeit, lai pievienotu grupai.",
                      )}
                    >
                      <SortableContext
                        items={groupStatuses.map((status) => status.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {groupStatuses.map((status) => (
                          <SortableStatusRow
                            key={status.id}
                            status={status}
                            languages={languages}
                            dragLabel={t("admin.statuses.drag", "Mainīt secību")}
                            disabled={isPending}
                            canDelete={!groupWouldBeEmpty(statuses, [], status.id)}
                            deleteDisabledLabel={t(
                              "errors.status_group_min_one",
                              "Katrā grupā jābūt vismaz vienam statusam.",
                            )}
                            onEdit={openEdit}
                            onDelete={setDeleteTarget}
                            onChangeColor={(color) => quickUpdate(status, { color })}
                            onChangeIcon={(icon) => quickUpdate(status, { icon })}
                            t={t}
                          />
                        ))}
                      </SortableContext>
                    </GroupSection>
                  );
                })}
              </tbody>
            </table>
          </DndContext>
        </div>
      </div>

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingId
            ? t("actions.edit", "Labot")
            : t("admin.statuses.add", "Jauns statuss")
        }
        description={t(
          "admin.statuses.form.description",
          "Norādi statusa nosaukumus valodās, krāsu un grupu.",
        )}
        blocking={isPending}
        dirty={isDirty}
        panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.code}>
                  <label
                    htmlFor={`status-label-${language.code}`}
                    className="text-sm font-medium text-zinc-800"
                  >
                    {t("admin.statuses.label", "Nosaukums")}{" "}
                    <span className="font-mono text-xs uppercase text-zinc-400">
                      {language.code}
                    </span>
                  </label>
                  <input
                    id={`status-label-${language.code}`}
                    value={draft.labels[language.code] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        labels: {
                          ...current.labels,
                          [language.code]: event.target.value,
                        },
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              ))}
            </div>
            <div>
              <label htmlFor="status-color" className="text-sm font-medium text-zinc-800">
                {t("admin.statuses.color", "Krāsa")}
              </label>
              <div className="mt-2 flex items-center gap-3">
                <StatusGlyph
                  color={draft.color}
                  groupKey={draft.groupKey}
                  icon={draft.icon}
                />
                <input
                  id="status-color"
                  type="color"
                  value={draft.color}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, color: event.target.value }))
                  }
                  className="size-10 shrink-0 cursor-pointer rounded-lg border border-zinc-200"
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
              <p className="text-sm font-medium text-zinc-800">
                {t("lists.statuses.menu.change_icon", "Mainīt ikonu")}
              </p>
              <button
                type="button"
                onClick={() => setIconPickerOpen(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-50"
              >
                <StatusGlyph
                  color={draft.color}
                  groupKey={draft.groupKey}
                  icon={draft.icon}
                />
                <span>
                  {draft.icon
                    ? draft.icon.replace(/^fas fa-/, "")
                    : t("lists.statuses.icon.default", "Nokl.")}
                </span>
              </button>
            </div>
            <div>
              <label htmlFor="status-group" className="text-sm font-medium text-zinc-800">
                {t("admin.statuses.group", "Grupa")}
              </label>
              <select
                id="status-group"
                value={draft.groupKey}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, groupKey: event.target.value }))
                }
                className="mt-2 w-full cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
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
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                ) : null}
                {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </fieldset>
        </form>
      </AppModal>

      <StatusIconPickerModal
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        color={draft.color}
        groupKey={draft.groupKey}
        value={draft.icon}
        onSave={(icon) => setDraft((current) => ({ ...current, icon }))}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("admin.statuses.delete.title", "Dzēst statusu?")}
        description={
          <>
            {t("admin.statuses.delete.confirm_prefix", "Vai tiešām dzēst statusu")}{" "}
            <span className="font-semibold text-zinc-900">{deleteTarget?.label}</span>?
          </>
        }
        confirmLabel={isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function GroupSection({
  id,
  label,
  empty,
  emptyLabel,
  children,
}: {
  id: string;
  label: string;
  empty: boolean;
  emptyLabel: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <>
      <tr>
        <td
          colSpan={4}
          ref={setNodeRef}
          className={`border-t border-zinc-200 bg-zinc-50 px-5 py-2.5 ${
            isOver ? "bg-sky-50 ring-2 ring-inset ring-sky-200" : ""
          } ${empty ? "min-h-14" : "min-h-9"}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            {label}
          </p>
          {empty ? (
            <p className="pt-1 text-sm text-zinc-400">{emptyLabel}</p>
          ) : null}
        </td>
      </tr>
      {children}
    </>
  );
}

function SortableStatusRow({
  status,
  languages,
  dragLabel,
  disabled,
  canDelete,
  deleteDisabledLabel,
  onEdit,
  onDelete,
  onChangeColor,
  onChangeIcon,
  t,
}: {
  status: TaskStatusSummary;
  languages: SiteLanguageSummary[];
  dragLabel: string;
  disabled: boolean;
  canDelete: boolean;
  deleteDisabledLabel: string;
  onEdit: (status: TaskStatusSummary) => void;
  onDelete: (status: TaskStatusSummary) => void;
  onChangeColor: (color: string) => void;
  onChangeIcon: (icon: string | null) => void;
  t: ReturnType<typeof useTranslations>["t"];
}) {
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id, disabled });

  useEffect(() => {
    if (!menuOpen || !menuButtonRef.current) {
      setMenuPosition(null);
      return;
    }
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(12, rect.right - 176),
    });
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (menuButtonRef.current?.contains(target)) return;
      const menu = document.getElementById(menuId);
      if (menu?.contains(target)) return;
      setMenuOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [menuId, menuOpen]);

  return (
    <>
      <tr
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        className={`align-top ${isDragging ? "relative z-10 bg-white shadow-sm" : ""}`}
      >
        <td className="px-3 py-4">
          <DragHandle
            label={dragLabel}
            attributes={attributes}
            listeners={listeners}
          />
        </td>
        <td className="px-5 py-4">
          <div className="flex items-start gap-2.5">
            <StatusGlyph
              color={status.color}
              groupKey={status.groupKey}
              icon={status.icon}
              className="mt-1"
            />
            <div className="min-w-0 space-y-1">
              <p className="font-mono text-[11px] text-zinc-400">{status.id}</p>
              {languages.map((language) => (
                <p key={language.code} className="text-sm text-zinc-600">
                  <span className="font-mono text-xs uppercase text-zinc-400">
                    {language.code}
                  </span>{" "}
                  {status.labels[language.code] || "—"}
                </p>
              ))}
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <StatusGlyph
              color={status.color}
              groupKey={status.groupKey}
              icon={status.icon}
            />
            <span className="font-mono text-[11px] text-zinc-500">{status.color}</span>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="flex justify-end">
            <button
              ref={menuButtonRef}
              type="button"
              aria-label={t("common.actions", "Darbības")}
              aria-expanded={menuOpen}
              disabled={disabled}
              onClick={() => setMenuOpen((current) => !current)}
              className="inline-flex size-8 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <i className="fas fa-ellipsis text-[13px]" aria-hidden="true" />
            </button>
            <input
              ref={colorInputRef}
              type="color"
              className="sr-only"
              value={status.color}
              onChange={(event) => onChangeColor(event.target.value)}
            />
          </div>
        </td>
      </tr>

      {menuOpen && menuPosition
        ? createPortal(
            <div
              id={menuId}
              role="menu"
              style={{
                position: "fixed",
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 70,
              }}
              className="w-44 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(status);
                }}
              >
                <i className="fas fa-pen w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                {t("lists.statuses.menu.rename", "Pārsaukt")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => {
                  setMenuOpen(false);
                  colorInputRef.current?.click();
                }}
              >
                <i className="fas fa-palette w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                {t("lists.statuses.menu.change_color", "Mainīt krāsu")}
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition hover:bg-zinc-50"
                onClick={() => {
                  setMenuOpen(false);
                  setIconPickerOpen(true);
                }}
              >
                <i className="fas fa-icons w-4 text-center text-xs text-zinc-400" aria-hidden="true" />
                {t("lists.statuses.menu.change_icon", "Mainīt ikonu")}
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!canDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => {
                  if (!canDelete) return;
                  setMenuOpen(false);
                  onDelete(status);
                }}
              >
                <i className="fas fa-trash w-4 text-center text-xs" aria-hidden="true" />
                {canDelete ? t("actions.delete", "Dzēst") : deleteDisabledLabel}
              </button>
            </div>,
            document.body,
          )
        : null}

      <StatusIconPickerModal
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        color={status.color}
        groupKey={status.groupKey}
        value={status.icon ?? null}
        onSave={onChangeIcon}
      />
    </>
  );
}
