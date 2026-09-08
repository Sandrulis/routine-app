"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LoadingState } from "@/app/components/loading-state";
import { Tooltip } from "@/app/components/tooltip";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { USER_TODO_TITLE_MAX, type UserTodo } from "@/app/lib/user-todos";
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

function TodoRow({
  item,
  archive,
  completedLabel,
  disabled,
  onToggleDone,
  onDelete,
}: {
  item: UserTodo;
  archive: boolean;
  completedLabel: string | null;
  disabled?: boolean;
  onToggleDone: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslations();
  const deleteLabel = t("actions.delete", "Dzēst");

  return (
    <li className="group/item flex items-start gap-2 rounded-lg px-1 py-1.5">
      <TodoCheck
        checked={item.isDone}
        label={item.title}
        disabled={disabled}
        onToggle={onToggleDone}
      />
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm leading-5 ${
            archive ? "text-zinc-500 line-through" : "text-zinc-800"
          }`}
        >
          {item.title}
        </p>
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
    </li>
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
    setTodoDone,
    removeTodo,
  } = todos;
  const [draft, setDraft] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, setPending] = useState(false);

  if (!enabled) return null;

  const title = t("user_todo.title", "Darāmo saraksts");
  const archiveLabel = t("user_todo.archive", "Arhīvs");
  const visibleItems = archiveOpen ? archivedItems : activeItems;
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

  const panel = (
    <aside
      id="user-todo-rail"
      className={`fixed inset-y-0 right-0 w-[var(--app-todo-rail-width)] flex-col border-l border-zinc-200 bg-white ${
        mobileOpen
          ? "z-50 flex shadow-xl xl:z-40 xl:shadow-none"
          : "hidden z-40"
      } ${collapsed ? "xl:hidden" : "xl:flex"}`}
    >
      <div className="flex shrink-0 items-center gap-1 border-b border-zinc-200 px-3 py-2">
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
        ) : (
          <ul>
            {visibleItems.map((item) => (
              <TodoRow
                key={item.id}
                item={item}
                archive={archiveOpen}
                completedLabel={
                  item.completedAt
                    ? t("user_todo.completed_on", "Pabeigts {date}", {
                        date: formatDate(item.completedAt),
                      })
                    : null
                }
                disabled={pending}
                onToggleDone={() => void run(() => setTodoDone(item.id, !item.isDone))}
                onDelete={() => void run(() => removeTodo(item.id))}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );

  return panel;
}
