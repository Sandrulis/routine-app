"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, KeyboardEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { LoadingState } from "@/app/components/loading-state";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import {
  appendNotifications,
  notificationsForNewAssignees,
} from "@/app/lib/notifications";
import { fetchTeamTodos, replaceTeamTodos } from "@/app/lib/db/work-data";
import { useTeam } from "@/app/lib/team-store";
import {
  DELETE_ZONE_ID,
  createTodoId,
  getTeamMember,
  isTodoStatus,
  type TodoItem,
  type TodoStatus,
} from "@/app/lib/team-todo";

type TodoColumn = {
  status: TodoStatus;
  titleKey: string;
  fallbackTitle: string;
  emptyKey: string;
  fallbackEmpty: string;
};

const COLUMNS: TodoColumn[] = [
  {
    status: "todo",
    titleKey: "todo.columns.todo",
    fallbackTitle: "Darāms",
    emptyKey: "todo.empty.todo",
    fallbackEmpty: "Šajā kolonnā vēl nav darbu.",
  },
  {
    status: "in_progress",
    titleKey: "todo.columns.in_progress",
    fallbackTitle: "Procesā",
    emptyKey: "todo.empty.in_progress",
    fallbackEmpty: "Pārvelc darbu šeit, kad tas ir sākts.",
  },
  {
    status: "done",
    titleKey: "todo.columns.done",
    fallbackTitle: "Gatavs",
    emptyKey: "todo.empty.done",
    fallbackEmpty: "Pabeigtie darbi parādīsies šeit.",
  },
];

const todoCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  const deleteZoneCollision = pointerCollisions.find(
    (collision) => collision.id === DELETE_ZONE_ID,
  );

  if (deleteZoneCollision) {
    return [deleteZoneCollision];
  }

  return closestCorners(args);
};

function getTaskContainer(
  id: UniqueIdentifier | null | undefined,
  items: TodoItem[],
): TodoStatus | null {
  if (id == null) return null;

  const stringId = String(id);
  if (isTodoStatus(stringId)) return stringId;

  return items.find((item) => item.id === stringId)?.status ?? null;
}

function TodoTaskCardShell({
  item,
  dragLabel,
  attributes,
  listeners,
  setNodeRef,
  style,
  dragging = false,
  onOpen,
}: {
  item: TodoItem;
  dragLabel: string;
  attributes?: ReturnType<typeof useSortable>["attributes"];
  listeners?: ReturnType<typeof useSortable>["listeners"];
  setNodeRef?: ReturnType<typeof useSortable>["setNodeRef"];
  style?: CSSProperties;
  dragging?: boolean;
  onOpen?: (item: TodoItem) => void;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { members } = useTeam();
  const assignee = getTeamMember(item.assigneeId, members);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!onOpen || dragging) return;
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onOpen(item);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen && !dragging ? () => onOpen(item) : undefined}
      onKeyDown={handleKeyDown}
      className={`flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-left shadow-sm transition ${
        dragging
          ? "shadow-lg ring-2 ring-blue-200"
          : onOpen
            ? "cursor-pointer hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
            : ""
      }`}
    >
      {attributes ? (
        <span
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
          className="shrink-0"
        >
          <DragHandle label={dragLabel} attributes={attributes} listeners={listeners} />
        </span>
      ) : (
        <span
          className="inline-flex h-7 w-6 shrink-0 items-center justify-center self-center rounded text-zinc-300"
          aria-hidden="true"
        >
          <i className="fas fa-grip-vertical text-[11px]" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5 text-zinc-900">{item.title}</p>
        {item.description.trim() ? (
          <p className="mt-1 line-clamp-2 whitespace-pre-wrap text-xs leading-5 text-zinc-500">
            {item.description}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {assignee ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
              <UserAvatar member={assignee} size="sm" />
              {assignee.name}
            </span>
          ) : (
            <span className="rounded-full bg-zinc-50 px-2 py-1 text-xs text-zinc-400">
              {t("todo.fields.unassigned", "Nepiešķirts")}
            </span>
          )}
          {item.dueDate ? (
            <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
              <i className="far fa-calendar text-[10px]" aria-hidden="true" />
              {formatDate(item.dueDate)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SortableTodoTaskCard({
  item,
  dragLabel,
  onOpen,
}: {
  item: TodoItem;
  dragLabel: string;
  onOpen: (item: TodoItem) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: item.id,
      animateLayoutChanges: () => false,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : undefined,
  };

  return (
    <TodoTaskCardShell
      item={item}
      dragLabel={dragLabel}
      attributes={attributes}
      listeners={listeners}
      setNodeRef={setNodeRef}
      style={style}
      onOpen={onOpen}
    />
  );
}

function TodoColumnView({
  column,
  items,
  onOpenTask,
}: {
  column: TodoColumn;
  items: TodoItem[];
  onOpenTask: (item: TodoItem) => void;
}) {
  const { t } = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id: column.status });
  const title = t(column.titleKey, column.fallbackTitle);

  return (
    <section
      ref={setNodeRef}
      className={`flex min-h-[360px] flex-col rounded-3xl border bg-zinc-50 p-4 transition ${
        isOver ? "border-blue-300 bg-blue-50/70" : "border-zinc-200"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-500 ring-1 ring-zinc-200">
          {items.length}
        </span>
      </div>

      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-1 flex-col gap-3">
          {items.length > 0 ? (
            items.map((item) => (
              <SortableTodoTaskCard
                key={item.id}
                item={item}
                dragLabel={t("todo.drag_task", "Pārvietot darbu: {name}", {
                  name: item.title,
                })}
                onOpen={onOpenTask}
              />
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white/70 px-4 py-10 text-center">
              <p className="text-sm text-zinc-500">
                {t(column.emptyKey, column.fallbackEmpty)}
              </p>
            </div>
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function DeleteDropZone() {
  const { t } = useTranslations();
  const { setNodeRef, isOver } = useDroppable({ id: DELETE_ZONE_ID });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border border-dashed px-5 py-6 text-center transition ${
        isOver
          ? "border-red-300 bg-red-50 text-red-800"
          : "border-zinc-300 bg-white text-zinc-500"
      }`}
    >
      <i className="fas fa-trash-can mb-2 text-lg" aria-hidden="true" />
      <p className="text-sm font-semibold">
        {t("todo.delete_zone.title", "Ievelc darbu šeit, lai to izdzēstu")}
      </p>
    </div>
  );
}

type TodoTaskModalMode = "create" | "edit";

function TodoTaskModal({
  item,
  mode,
  open,
  onOpenChange,
  onCreate,
  onSave,
}: {
  item: TodoItem | null;
  mode: TodoTaskModalMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (draft: Omit<TodoItem, "id" | "status">) => void;
  onSave: (item: TodoItem) => void;
}) {
  const { t } = useTranslations();
  const { members } = useTeam();
  const [draftTitle, setDraftTitle] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [draftAssigneeId, setDraftAssigneeId] = useState("");
  const [draftDueDate, setDraftDueDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setDraftTitle(mode === "edit" ? (item?.title ?? "") : "");
    setDraftDescription(mode === "edit" ? (item?.description ?? "") : "");
    setDraftAssigneeId(mode === "edit" ? (item?.assigneeId ?? "") : "");
    setDraftDueDate(mode === "edit" ? (item?.dueDate ?? "") : "");
  }, [item, mode, open]);

  const trimmedTitle = draftTitle.trim();
  const trimmedDescription = draftDescription.trim();
  const nextAssigneeId = draftAssigneeId || null;
  const nextDueDate = draftDueDate || null;
  const dirty =
    mode === "create"
      ? Boolean(trimmedTitle || trimmedDescription || nextAssigneeId || nextDueDate)
      : trimmedTitle !== (item?.title ?? "") ||
        trimmedDescription !== (item?.description ?? "").trim() ||
        nextAssigneeId !== (item?.assigneeId ?? null) ||
        nextDueDate !== (item?.dueDate ?? null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedTitle) return;

    const draft = {
      title: trimmedTitle,
      description: trimmedDescription,
      assigneeId: nextAssigneeId,
      dueDate: nextDueDate,
    };

    if (mode === "create") {
      onCreate(draft);
      onOpenChange(false);
      return;
    }

    if (!item) return;
    onSave({ ...item, ...draft });
    onOpenChange(false);
  }

  const title =
    mode === "create"
      ? t("todo.add.title", "Jauns uzdevums")
      : t("todo.edit.title", "Labot uzdevumu");
  const description =
    mode === "create"
      ? t(
          "todo.add.description",
          "Ieraksti nosaukumu un piešķir darbu komandas biedram.",
        )
      : t("todo.edit.description", "Atjauno uzdevuma datus.");

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="todo-edit-title" className="text-sm font-semibold text-zinc-700">
            {t("todo.fields.title", "Nosaukums")}
          </label>
          <input
            id="todo-edit-title"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("todo.fields.title_placeholder", "Uzdevuma nosaukums")}
            autoFocus
          />
        </div>

        <div>
          <label
            htmlFor="todo-edit-description"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("common.description", "Apraksts")}
          </label>
          <textarea
            id="todo-edit-description"
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("todo.fields.description_placeholder", "Īss apraksts")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="todo-edit-assignee"
              className="text-sm font-semibold text-zinc-700"
            >
              {t("todo.fields.assignee", "Atbildīgais")}
            </label>
            <select
              id="todo-edit-assignee"
              value={draftAssigneeId}
              onChange={(event) => setDraftAssigneeId(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            >
              <option value="">{t("todo.fields.unassigned", "Nepiešķirts")}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="todo-edit-due-date"
              className="text-sm font-semibold text-zinc-700"
            >
              {t("todo.fields.due_date", "Termiņš")}
            </label>
            <input
              id="todo-edit-due-date"
              type="date"
              value={draftDueDate}
              onChange={(event) => setDraftDueDate(event.target.value)}
              className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!trimmedTitle || (mode === "edit" && !dirty)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {mode === "create"
              ? t("actions.add", "Pievienot")
              : t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}

export function TeamTodoBoard() {
  const dndContextId = useId();
  const { t } = useTranslations();
  const { members, currentUser, currentTeam, isReady: teamReady } = useTeam();
  const { user: authUser, isReady: authReady } = useAuthSession();
  const { showFeedback } = useFeedbackToast();
  const userId = authUser?.id ?? null;
  const teamId = currentTeam?.id ?? null;
  const [items, setItems] = useState<TodoItem[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<TodoTaskModalMode | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const skipNextTodoPersist = useRef(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    if (!authReady || !teamReady) return;
    skipNextTodoPersist.current = true;
    setIsHydrated(false);

    if (!teamId || (userId && !teamId)) {
      setItems([]);
      setIsHydrated(true);
      return;
    }

    let cancelled = false;
    void fetchTeamTodos(teamId)
      .then((next) => {
        if (cancelled) return;
        setItems(next);
      })
      .catch((error) => {
        console.error("Failed to load todos", error);
        if (cancelled) return;
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        skipNextTodoPersist.current = true;
        setIsHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, [authReady, teamId, teamReady, userId]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!teamId || (userId && !teamId)) return;
    if (skipNextTodoPersist.current) {
      skipNextTodoPersist.current = false;
      return;
    }
    void replaceTeamTodos(teamId, items).catch((error) => {
      console.error("Failed to save todos", error);
    });
  }, [isHydrated, items, teamId, userId]);

  const visibleItems = useMemo(
    () =>
      selectedMemberId
        ? items.filter((item) => item.assigneeId === selectedMemberId)
        : items,
    [items, selectedMemberId],
  );

  const activeTask = useMemo(
    () => items.find((item) => item.id === activeTaskId) ?? null,
    [activeTaskId, items],
  );
  const editingTask = useMemo(
    () => items.find((item) => item.id === editingTaskId) ?? null,
    [editingTaskId, items],
  );

  function notifyNewAssignee(
    title: string,
    previousId: string | null,
    nextId: string | null,
  ) {
    const addedIds = nextId && nextId !== previousId ? [nextId] : [];
    appendNotifications(
      notificationsForNewAssignees({
        actorId: currentUser.id,
        addedIds,
        memberIds: members.map((member) => member.id),
        taskTitle: title,
        href: "/dashboard",
      }),
      authUser?.id ?? null,
      currentTeam?.id ?? null,
      members,
    );
  }

  function handleCreateTask(draft: Omit<TodoItem, "id" | "status">) {
    setItems((current) => [
      ...current,
      {
        id: createTodoId(),
        status: "todo",
        ...draft,
      },
    ]);
    notifyNewAssignee(draft.title, null, draft.assigneeId);
    showFeedback({ type: "success", text: t("todo.created", "Uzdevums pievienots.") });
  }

  function handleSaveTask(updatedItem: TodoItem) {
    const previous = items.find((item) => item.id === updatedItem.id) ?? null;
    setItems((current) =>
      current.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
    );
    notifyNewAssignee(
      updatedItem.title,
      previous?.assigneeId ?? null,
      updatedItem.assigneeId,
    );
    showFeedback({ type: "success", text: t("todo.updated", "Uzdevums saglabāts.") });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const activeId = String(event.active.id);
    const overId = event.over?.id;
    setActiveTaskId(null);

    if (!overId) return;

    if (String(overId) === DELETE_ZONE_ID) {
      setItems((current) => current.filter((item) => item.id !== activeId));
      showFeedback({ type: "success", text: t("todo.deleted", "Uzdevums dzēsts.") });
      return;
    }

    setItems((current) => {
      const activeItem = current.find((item) => item.id === activeId);
      if (!activeItem) return current;

      const sourceStatus = activeItem.status;
      const targetStatus = getTaskContainer(overId, current);
      if (!targetStatus) return current;

      const sourceItems = current.filter((item) => item.status === sourceStatus);
      const sourceIndex = sourceItems.findIndex((item) => item.id === activeId);
      if (sourceIndex < 0) return current;

      if (sourceStatus === targetStatus) {
        const targetItems = current.filter((item) => item.status === targetStatus);
        const targetIndex = targetItems.findIndex((item) => item.id === String(overId));
        if (targetIndex < 0 || sourceIndex === targetIndex) return current;

        const reorderedIds = arrayMove(
          targetItems.map((item) => item.id),
          sourceIndex,
          targetIndex,
        );
        return current
          .filter((item) => item.status !== targetStatus)
          .concat(
            reorderedIds
              .map((id) => current.find((item) => item.id === id))
              .filter((item): item is TodoItem => item != null),
          );
      }

      const targetItems = current.filter((item) => item.status === targetStatus);
      const overTaskIndex = targetItems.findIndex((item) => item.id === String(overId));
      const insertIndex = overTaskIndex >= 0 ? overTaskIndex : targetItems.length;
      const withoutActive = current.filter((item) => item.id !== activeId);
      const nextTargetItems = [
        ...targetItems.slice(0, insertIndex),
        { ...activeItem, status: targetStatus },
        ...targetItems.slice(insertIndex),
      ];

      return COLUMNS.flatMap((column) => {
        if (column.status === targetStatus) return nextTargetItems;
        return withoutActive.filter((item) => item.status === column.status);
      });
    });
  }

  if (!authReady || !teamReady || !isHydrated) {
    return (
      <SectionPage
        title={t("todo.page.title", "Komandas darbi")}
        subtitle={t(
          "todo.page.subtitle",
          "Pievieno, piešķir un pārvieto uzdevumus starp kolonnām.",
        )}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  return (
    <div>
      <div className="page pb-0">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedMemberId(null)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedMemberId == null
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-100"
            }`}
          >
            {t("team.filter.all", "Visi")}
          </button>
          {members.map((member) => {
            const isActive = selectedMemberId === member.id;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 pr-3 text-left transition ${
                  isActive
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <UserAvatar member={member} size="sm" />
                <span className="text-xs font-medium">{member.name}</span>
              </button>
            );
          })}
        </div>
      </div>
      <SectionPage
        title={t("todo.page.title", "Komandas darbi")}
        subtitle={t(
          "todo.page.subtitle",
          "Pievieno, piešķir un pārvieto uzdevumus starp kolonnām.",
        )}
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingTaskId(null);
              setTaskModalMode("create");
            }}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("actions.add", "Pievienot")}
          </button>
        }
      >
        <div className="space-y-4">
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={todoCollisionDetection}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveTaskId(null)}
          >
            <DeleteDropZone />

            <div className="grid gap-4 lg:grid-cols-3">
              {COLUMNS.map((column) => (
                <TodoColumnView
                  key={column.status}
                  column={column}
                  items={visibleItems.filter((item) => item.status === column.status)}
                  onOpenTask={(item) => {
                    setEditingTaskId(item.id);
                    setTaskModalMode("edit");
                  }}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <TodoTaskCardShell
                  item={activeTask}
                  dragging
                  dragLabel={t("todo.drag_task", "Pārvietot darbu: {name}", {
                    name: activeTask.title,
                  })}
                />
              ) : null}
            </DragOverlay>
          </DndContext>

          <TodoTaskModal
            item={editingTask}
            mode={taskModalMode ?? "create"}
            open={taskModalMode != null}
            onOpenChange={(open) => {
              if (!open) {
                setTaskModalMode(null);
                setEditingTaskId(null);
              }
            }}
            onCreate={handleCreateTask}
            onSave={handleSaveTask}
          />
        </div>
      </SectionPage>
    </div>
  );
}
