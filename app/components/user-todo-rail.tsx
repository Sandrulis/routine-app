"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LoadingState } from "@/app/components/loading-state";
import {
  SortableTaskItem,
  type SortableTaskHandle,
} from "@/app/components/sortable-task-group";
import { Tooltip } from "@/app/components/tooltip";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import {
  USER_TODO_TITLE_MAX,
  normalizeTodoTitle,
  type UserTodo,
} from "@/app/lib/user-todos";
import { useUserTodos } from "@/app/lib/use-user-todos";

function TodoCheck({
  checked,
  label,
  disabled,
  onToggle,
}: {
  checked: boolean;
  label: string;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded border transition disabled:cursor-not-allowed ${
        checked
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-zinc-300 bg-white text-transparent hover:border-zinc-400"
      }`}
    >
      <i className="fas fa-check text-[9px]" aria-hidden="true" />
    </button>
  );
}

function TodoRowBody({
  item,
  archive,
  completedLabel,
  disabled,
  drag,
  onToggleDone,
  onRename,
  onDelete,
}: {
  item: UserTodo;
  archive: boolean;
  completedLabel: string | null;
  disabled?: boolean;
  drag?: SortableTaskHandle;
  onToggleDone: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const editingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.title);
  const deleteLabel = t("actions.delete", "Dzēst");
  const editLabel = t("actions.edit", "Labot");
  const titleClassName = `text-sm leading-5 ${
    archive ? "text-zinc-500 line-through" : "text-zinc-800"
  }`;

  useEffect(() => {
    if (!editing) {
      setDraft(item.title);
      return;
    }
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    const length = input.value.length;
    input.setSelectionRange(length, length);
  }, [editing, item.title]);

  function startEdit() {
    if (disabled) return;
    editingRef.current = true;
    setDraft(item.title);
    setEditing(true);
  }

  function cancelEdit() {
    editingRef.current = false;
    setDraft(item.title);
    setEditing(false);
  }

  function commitEdit() {
    if (!editingRef.current) return;
    editingRef.current = false;
    const next = normalizeTodoTitle(draft);
    setEditing(false);
    if (!next || next === item.title) {
      setDraft(item.title);
      return;
    }
    onRename(next);
  }

  function onTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commitEdit();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
    }
  }

  return (
    <div
      className={`group/item flex items-start gap-1 rounded-lg px-1 py-1.5 ${
        drag?.isDragging ? "relative z-20 bg-white shadow-sm" : ""
      }`}
    >
      {drag ? (
        <DragHandle
          label={t("subtasks.drag", "Mainīt secību")}
          attributes={drag.attributes}
          listeners={drag.listeners}
        />
      ) : null}
      <TodoCheck
        checked={item.isDone}
        label={item.title}
        disabled={disabled}
        onToggle={onToggleDone}
      />
      <div
        className={`min-w-0 flex-1 ${
          editing || disabled ? "" : "cursor-text"
        }`}
        onClick={editing || disabled ? undefined : startEdit}
      >
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            maxLength={USER_TODO_TITLE_MAX}
            aria-label={editLabel}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onTitleKeyDown}
            onBlur={commitEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className={`h-5 w-full bg-transparent outline-none ${titleClassName}`}
          />
        ) : (
          <button
            type="button"
            disabled={disabled}
            onClick={startEdit}
            onPointerDown={(event) => event.stopPropagation()}
            className={`block w-full min-w-0 text-left ${titleClassName} ${
              disabled ? "cursor-not-allowed" : "cursor-text"
            }`}
          >
            {item.title}
          </button>
        )}
        {archive && completedLabel ? (
          <p className="mt-0.5 text-[11px] leading-4 text-zinc-400">
            {completedLabel}
          </p>
        ) : null}
      </div>
      <Tooltip label={deleteLabel} align="end">
        <button
          type="button"
          aria-label={deleteLabel}
          disabled={disabled}
          onClick={onDelete}
          className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-300 opacity-0 transition group-hover/item:opacity-100 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:opacity-100 disabled:cursor-not-allowed"
        >
          <i className="fas fa-xmark text-[11px]" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}

export function UserTodoRail({
  collapsed = false,
  mobileOpen = false,
  onClose,
  sessionReady,
  todos,
}: {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onClose?: () => void;
  sessionReady: boolean;
  todos: ReturnType<typeof useUserTodos>;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { formatDate } = useDisplayPreferences();
  const { isEnabled } = useFrontendModules();
  const enabled = isEnabled(FRONTEND_MODULE_KEYS.todo);
  const {
    isReady,
    activeItems,
    archivedItems,
    addTodo,
    renameTodo,
    setTodoDone,
    removeTodo,
    reorderTodos,
  } = todos;
  const [draft, setDraft] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const dndContextId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (!enabled) return null;

  const title = t("user_todo.title", "Darāmo saraksts");
  const archiveLabel = t("user_todo.archive", "Arhīvs");
  const visibleItems = archiveOpen ? archivedItems : activeItems;
  const canReorder = !archiveOpen && activeItems.length > 1;
  const emptyLabel = archiveOpen
    ? t("user_todo.archive_empty", "Nav pabeigtu uzdevumu.")
    : t("user_todo.empty", "Nav darāmo uzdevumu.");

  async function run(action: () => Promise<void>) {
    if (pending) return;
    setPending(true);
    try {
      await action();
    } catch {
      showFeedback({
        type: "error",
        text: t("errors.user_todo_save_failed", "Neizdevās saglabāt darāmo."),
      });
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const titleValue = draft;
    if (!titleValue.trim()) return;
    setDraft("");
    void run(() => addTodo(titleValue));
  }

  function onDraftKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.currentTarget.blur();
    }
  }

  function completedLabelFor(item: UserTodo): string | null {
    if (!item.completedAt) return null;
    return t("user_todo.completed_on", "Pabeigts {date}", {
      date: formatDate(item.completedAt),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = activeItems.map((item) => item.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    void reorderTodos(arrayMove(ids, oldIndex, newIndex)).catch(() => {
      showFeedback({
        type: "error",
        text: t("errors.user_todo_save_failed", "Neizdevās saglabāt darāmo."),
      });
    });
  }

  const list = (
    <ul>
      {visibleItems.map((item) => {
        const body = (drag?: SortableTaskHandle) => (
          <TodoRowBody
            item={item}
            archive={archiveOpen}
            completedLabel={completedLabelFor(item)}
            disabled={pending}
            drag={drag}
            onToggleDone={() => void run(() => setTodoDone(item.id, !item.isDone))}
            onRename={(title) => void run(() => renameTodo(item.id, title))}
            onDelete={() => void run(() => removeTodo(item.id))}
          />
        );

        if (!canReorder) {
          return <li key={item.id}>{body()}</li>;
        }

        return (
          <SortableTaskItem key={item.id} id={item.id} as="li" disabled={pending}>
            {(handle) => body(handle)}
          </SortableTaskItem>
        );
      })}
    </ul>
  );

  const panel = (
    <aside
      id="user-todo-rail"
      className={`fixed inset-y-0 right-0 w-[var(--app-todo-rail-width)] flex-col border-l border-zinc-200 bg-white ${
        mobileOpen
          ? "z-50 flex shadow-xl xl:z-40 xl:shadow-none"
          : "hidden z-40"
      } ${collapsed ? "xl:hidden" : "xl:flex"}`}
    >
      <div className="flex h-[var(--app-topbar-height)] shrink-0 items-center gap-1 border-b border-zinc-200 px-3">
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
          {title}
        </h2>
        <IconActionButton
          label={archiveLabel}
          icon="fas fa-box-archive"
          variant="muted"
          pressed={archiveOpen}
          onClick={() => setArchiveOpen((open) => !open)}
        />
        {onClose ? (
          <IconActionButton
            label={t("actions.close", "Aizvērt")}
            icon="fas fa-xmark"
            variant="muted"
            onClick={() => onClose()}
          />
        ) : null}
      </div>

      {archiveOpen ? null : (
        <form onSubmit={onSubmit} className="shrink-0 border-b border-zinc-100 px-3 py-2">
          <input
            value={draft}
            maxLength={USER_TODO_TITLE_MAX}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={onDraftKeyDown}
            autoComplete="off"
            placeholder={t("user_todo.placeholder", "Jauns uzdevums")}
            aria-label={t("user_todo.placeholder", "Jauns uzdevums")}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400"
          />
        </form>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {!sessionReady || !isReady ? (
          <LoadingState compact />
        ) : visibleItems.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-zinc-400">{emptyLabel}</p>
        ) : canReorder ? (
          <DndContext
            id={dndContextId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={activeItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {list}
            </SortableContext>
          </DndContext>
        ) : (
          list
        )}
      </div>
    </aside>
  );

  return panel;
}
