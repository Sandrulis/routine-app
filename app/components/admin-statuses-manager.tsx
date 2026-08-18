"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
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
import { IconActionButton } from "@/app/components/icon-action-button";
import { StatusGlyph } from "@/app/components/status-control";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  SiteLanguageSummary,
  TaskStatusSummary,
} from "@/app/lib/site-admin/types";

const GROUP_OPTIONS = [
  { value: "not_started", labelKey: "status.group.not_started", fallback: "Nav sākts" },
  { value: "active", labelKey: "status.group.active", fallback: "Aktīvs" },
  { value: "closed", labelKey: "status.group.closed", fallback: "Slēgts" },
];

type StatusDraft = {
  id: string;
  labels: Record<string, string>;
  color: string;
  groupKey: string;
};

function emptyDraft(languages: SiteLanguageSummary[]): StatusDraft {
  return {
    id: "",
    labels: Object.fromEntries(languages.map((language) => [language.code, ""])),
    color: "#71717a",
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
  const [isPending, startTransition] = useTransition();
  const [statuses, setStatuses] = useState(initialStatuses);
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

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    startTransition(async () => {
      const result = editingId
        ? await updateTaskStatusAction(editingId, {
            labels: draft.labels,
            color: draft.color,
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

    const oldIndex = statuses.findIndex((status) => status.id === active.id);
    const newIndex = statuses.findIndex((status) => status.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(statuses, oldIndex, newIndex);
    setStatuses(next);

    startTransition(async () => {
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
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-5 py-3">{t("admin.statuses.label", "Nosaukums")}</th>
                  <th className="px-5 py-3">{t("admin.statuses.color", "Krāsa")}</th>
                  <th className="px-5 py-3">{t("admin.statuses.group", "Grupa")}</th>
                  <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
                </tr>
              </thead>
              <SortableContext
                items={statuses.map((status) => status.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-zinc-100">
                  {statuses.map((status) => (
                    <SortableStatusRow
                      key={status.id}
                      status={status}
                      languages={languages}
                      dragLabel={t("admin.statuses.drag", "Mainīt secību")}
                      disabled={isPending}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      t={t}
                    />
                  ))}
                  {statuses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                        {t("admin.statuses.empty", "Nav neviena statusa.")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </SortableContext>
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
                <StatusGlyph color={draft.color} groupKey={draft.groupKey} />
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

function SortableStatusRow({
  status,
  languages,
  dragLabel,
  disabled,
  onEdit,
  onDelete,
  t,
}: {
  status: TaskStatusSummary;
  languages: SiteLanguageSummary[];
  dragLabel: string;
  disabled: boolean;
  onEdit: (status: TaskStatusSummary) => void;
  onDelete: (status: TaskStatusSummary) => void;
  t: ReturnType<typeof useTranslations>["t"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id, disabled });

  const groupOption = GROUP_OPTIONS.find((option) => option.value === status.groupKey);

  return (
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
          <StatusGlyph color={status.color} groupKey={status.groupKey} />
          <span className="font-mono text-[11px] text-zinc-500">{status.color}</span>
        </div>
      </td>
      <td className="px-5 py-4 text-zinc-600">
        {groupOption ? t(groupOption.labelKey, groupOption.fallback) : status.groupKey}
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <IconActionButton
            label={t("actions.edit", "Labot")}
            icon="fas fa-pen"
            onClick={() => onEdit(status)}
          />
          <IconActionButton
            label={t("actions.delete", "Dzēst")}
            icon="fas fa-trash"
            variant="delete"
            onClick={() => onDelete(status)}
          />
        </div>
      </td>
    </tr>
  );
}
