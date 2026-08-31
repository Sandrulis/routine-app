"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  createDocsCategoryAction,
  deleteDocsCategoryAction,
  reorderDocsCategoriesAction,
  setDocsCategoryVisibleAction,
  setDocsEnabledAction,
  updateDocsCategoryAction,
} from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LoadingState } from "@/app/components/loading-state";
import {
  DocsSourceLanguageCode,
  DocsSourceLanguageNotice,
} from "@/app/components/docs-source-language-notice";
import { ListAppearancePicker } from "@/app/components/list-appearance-picker";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { DEFAULT_LIST_COLOR } from "@/app/lib/lists";
import type { DocsCategorySummary } from "@/app/lib/docs/types";

type CategoryDraft = {
  title: string;
  icon: string;
};

function emptyDraft(): CategoryDraft {
  return { title: "", icon: "fas fa-book" };
}

export function AdminDocsCategories({
  categories: initialCategories,
  enabled: initialEnabled,
}: {
  categories: DocsCategorySummary[];
  enabled: boolean;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [categories, setCategories] = useState(initialCategories);
  const [enabled, setEnabled] = useState(initialEnabled);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [iconOpen, setIconOpen] = useState(false);
  const iconTriggerRef = useRef<HTMLButtonElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocsCategorySummary | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingToggle, setPendingToggle] = useState(false);
  const [openingCategoryId, setOpeningCategoryId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  const initialDraft = editingId
    ? {
        title: categories.find((item) => item.id === editingId)?.title ?? "",
        icon: categories.find((item) => item.id === editingId)?.icon ?? "fas fa-book",
      }
    : emptyDraft();
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    if (!modalOpen) {
      setEditingId(null);
      setDraft(emptyDraft());
      setIconOpen(false);
    }
  }, [modalOpen]);

  function openCreate() {
    clearFeedback();
    setEditingId(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  }

  function openCategory(category: DocsCategorySummary) {
    if (openingCategoryId) return;
    setOpeningCategoryId(category.id);
    startTransition(() => {
      router.push(`/admin/docs/${category.id}`);
    });
  }

  function openEdit(category: DocsCategorySummary) {
    clearFeedback();
    setEditingId(category.id);
    setDraft({ title: category.title, icon: category.icon });
    setModalOpen(true);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    startTransition(async () => {
      const result = editingId
        ? await updateDocsCategoryAction(editingId, draft)
        : await createDocsCategoryAction(draft);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingId
          ? t("admin.docs.feedback.category_saved", "Kategorija saglabāta.")
          : t("admin.docs.feedback.category_created", "Kategorija pievienota."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      const result = await deleteDocsCategoryAction(deleteTarget.id);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("admin.docs.feedback.category_deleted", "Kategorija dzēsta."),
      });
      router.refresh();
    });
  }

  function handleVisibility(category: DocsCategorySummary) {
    const nextVisible = !category.isVisible;
    startTransition(async () => {
      setCategories((current) =>
        current.map((item) =>
          item.id === category.id ? { ...item, isVisible: nextVisible } : item,
        ),
      );
      const result = await setDocsCategoryVisibleAction(category.id, nextVisible);
      if (!result.ok) {
        setCategories((current) =>
          current.map((item) =>
            item.id === category.id ? { ...item, isVisible: category.isVisible } : item,
          ),
        );
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      router.refresh();
    });
  }

  function handleToggle(next: boolean) {
    setPendingToggle(true);
    startTransition(async () => {
      const previous = enabled;
      setEnabled(next);
      const result = await setDocsEnabledAction(next);
      setPendingToggle(false);
      if (!result.ok) {
        setEnabled(previous);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      showFeedback({
        type: "success",
        text: next
          ? t("admin.docs.feedback.enabled", "Dokumentācija ir aktīva kājenē.")
          : t("admin.docs.feedback.disabled", "Dokumentācija ir paslēpta no kājenes."),
      });
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isPending) return;

    const oldIndex = categories.findIndex((category) => category.id === active.id);
    const newIndex = categories.findIndex((category) => category.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(categories, oldIndex, newIndex).map((item, index) => ({
      ...item,
      sortOrder: index,
    }));
    setCategories(next);

    startTransition(async () => {
      const result = await reorderDocsCategoriesAction(next.map((item) => item.id));
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        setCategories(initialCategories);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        {t(
          "admin.docs.hint",
          "Kategorijas un apakškategorijas veido publisko dokumentāciju. Saturs pagaidām ir noklusējuma valodā.",
        )}
      </p>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-900">
            {t("admin.docs.enabled", "Rādīt dokumentāciju kājenē")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t(
              "admin.docs.enabled_help",
              "Kad ieslēgts, kājenē parādās saite Documentation uz publisko docs UI.",
            )}
          </p>
        </div>
        <ToggleSwitch
          checked={enabled}
          busy={pendingToggle}
          label={t("admin.docs.enabled", "Rādīt dokumentāciju kājenē")}
          onChange={handleToggle}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("admin.docs.category.add", "Jauna kategorija")}
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
                  <th className="px-5 py-3">{t("lists.fields.name", "Nosaukums")}</th>
                  <th className="px-5 py-3">{t("admin.docs.articles", "Apakškategorijas")}</th>
                  <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
                </tr>
              </thead>
              <SortableContext
                items={categories.map((category) => category.id)}
                strategy={verticalListSortingStrategy}
              >
                <tbody className="divide-y divide-zinc-100">
                  {categories.map((category) => (
                    <SortableCategoryRow
                      key={category.id}
                      category={category}
                      dragLabel={t("subtasks.drag", "Mainīt secību")}
                      disabled={isPending || Boolean(openingCategoryId)}
                      opening={openingCategoryId === category.id}
                      onOpen={openCategory}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onVisibility={handleVisibility}
                      t={t}
                    />
                  ))}
                  {categories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                        {t("admin.docs.categories.empty", "Vēl nav kategoriju.")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      {openingCategoryId ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-xl">
            <LoadingState />
          </div>
        </div>
      ) : null}

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingId
            ? t("admin.docs.category.edit", "Labot kategoriju")
            : t("admin.docs.category.add", "Jauna kategorija")
        }
        blocking={isPending}
        dirty={isDirty}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
            <DocsSourceLanguageNotice />
            <div>
              <label htmlFor="docs-category-title" className="text-sm font-medium text-zinc-800">
                {t("lists.fields.name", "Nosaukums")}
                <DocsSourceLanguageCode />
              </label>
              <input
                id="docs-category-title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {t("admin.file_types.icon", "Ikona")}
              </p>
              <button
                ref={iconTriggerRef}
                type="button"
                aria-expanded={iconOpen}
                onClick={() => setIconOpen((open) => !open)}
                className="mt-2 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 transition hover:bg-zinc-50"
              >
                <i className={draft.icon} aria-hidden="true" />
                <span className="font-mono text-xs text-zinc-500">{draft.icon}</span>
              </button>
              <ListAppearancePicker
                open={iconOpen}
                triggerRef={iconTriggerRef}
                name={draft.title}
                icon={draft.icon}
                color={DEFAULT_LIST_COLOR}
                showColors={false}
                allowEmptyIcon={false}
                onIconChange={(icon) => {
                  setDraft((current) => ({
                    ...current,
                    icon: icon ?? "fas fa-book",
                  }));
                  setIconOpen(false);
                }}
                onColorChange={() => undefined}
                onClose={() => setIconOpen(false)}
              />
            </div>
            <div className="flex justify-end border-t border-zinc-100 pt-4">
              <button
                type="submit"
                disabled={isPending || !isDirty || !draft.title.trim()}
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
        title={t("admin.docs.category.delete.title", "Dzēst kategoriju?")}
        description={t(
          "admin.docs.category.delete.description",
          "Kategorija “{name}” un visas tās apakškategorijas tiks dzēstas.",
          { name: deleteTarget?.title ?? "" },
        )}
        confirmLabel={isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SortableCategoryRow({
  category,
  dragLabel,
  disabled,
  opening,
  onOpen,
  onEdit,
  onDelete,
  onVisibility,
  t,
}: {
  category: DocsCategorySummary;
  dragLabel: string;
  disabled: boolean;
  opening: boolean;
  onOpen: (category: DocsCategorySummary) => void;
  onEdit: (category: DocsCategorySummary) => void;
  onDelete: (category: DocsCategorySummary) => void;
  onVisibility: (category: DocsCategorySummary) => void;
  t: ReturnType<typeof useTranslations>["t"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id, disabled });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`align-middle ${category.isVisible ? "" : "opacity-60"} ${
        isDragging ? "relative z-10 bg-white shadow-sm" : ""
      }`}
    >
      <td className="px-3 py-4">
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      </td>
      <td className="px-5 py-4">
        <Link
          href={`/admin/docs/${category.id}`}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
              return;
            }
            event.preventDefault();
            onOpen(category);
          }}
          className="inline-flex min-w-0 items-center gap-3 text-zinc-900 transition hover:text-zinc-600"
        >
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-50 text-zinc-600">
            <i className={category.icon} aria-hidden="true" />
          </span>
          <span className="font-medium">{category.title}</span>
          {opening ? (
            <i className="fas fa-circle-notch ui-spinner text-xs text-zinc-400" aria-hidden="true" />
          ) : null}
        </Link>
      </td>
      <td className="px-5 py-4 text-zinc-500">{category.articleCount}</td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <IconActionButton
            label={
              category.isVisible
                ? t("lists.statuses.hide", "Paslēpt")
                : t("lists.statuses.show", "Rādīt")
            }
            icon={category.isVisible ? "fas fa-eye-slash" : "fas fa-eye"}
            variant="muted"
            disabled={disabled}
            onClick={() => onVisibility(category)}
          />
          <IconActionButton
            label={t("actions.edit", "Labot")}
            icon="fas fa-pen"
            disabled={disabled}
            onClick={() => onEdit(category)}
          />
          <IconActionButton
            label={t("actions.delete", "Dzēst")}
            icon="fas fa-trash"
            variant="delete"
            disabled={disabled}
            onClick={() => onDelete(category)}
          />
        </div>
      </td>
    </tr>
  );
}
