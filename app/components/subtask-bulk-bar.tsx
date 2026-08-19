"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-context";
import { StatusGlyph } from "@/app/components/status-control";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { todayIsoDate } from "@/app/lib/format-display-date";
import {
  resolveEffectiveListAccess,
  userIsAssignee,
} from "@/app/lib/list-access";
import {
  getTaskAncestors,
  getTaskTree,
  isTaskDeleted,
  workItemIcon,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { teamRankLabel } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { taskHasIncompleteChecklists } from "@/app/lib/task-checklists";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

type BulkMenu = "status" | "assignees" | "dates" | "move";

function isoDateOffset(days: number): string {
  const [year, month, day] = todayIsoDate().split("-").map(Number);
  const date = new Date(year, month - 1, day + days);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function BulkDropup({
  open,
  trigger,
  onClose,
  labelledBy,
  className,
  children,
}: {
  open: boolean;
  trigger: HTMLElement | null;
  onClose: () => void;
  labelledBy: string;
  className?: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!open || !trigger || !panelRef.current) {
      setPosition(null);
      return;
    }
    const box = trigger.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, box.left + box.width / 2 - panel.width / 2),
      window.innerWidth - 12 - panel.width,
    );
    const top = Math.max(12, box.top - 8 - panel.height);
    setPosition({ top, left: Math.max(12, left) });
  }, [open, trigger]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (trigger?.contains(target)) return;
      onClose();
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [onClose, open, trigger]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-labelledby={labelledBy}
      data-app-modal-ignore-backdrop=""
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: "fixed",
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        zIndex: 80,
        opacity: position ? 1 : 0,
      }}
      className={`overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.16)] ${className ?? ""}`}
    >
      {children}
    </div>,
    document.body,
  );
}

function BulkBarButton({
  icon,
  label,
  pressed,
  disabled,
  danger = false,
  buttonRef,
  onClick,
}: {
  icon: string;
  label: string;
  pressed?: boolean;
  disabled?: boolean;
  danger?: boolean;
  buttonRef?: (node: HTMLButtonElement | null) => void;
  onClick: () => void;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : pressed
            ? "bg-white/15 text-white"
            : "text-zinc-200 hover:bg-white/10 hover:text-white"
      }`}
    >
      <i className={`${icon} text-[12px]`} aria-hidden="true" />
      {label}
    </button>
  );
}

export function SubtaskBulkBar({
  tasks,
  onClear,
}: {
  tasks: WorkTask[];
  onClear: () => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { lists, tasks: allTasks, updateTask, hideTask, moveSubtask } = useLists();
  const { currentUser, members, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const [menu, setMenu] = useState<BulkMenu | null>(null);
  const [dateField, setDateField] = useState<"startDate" | "dueDate">("dueDate");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggers = useRef<Partial<Record<BulkMenu, HTMLButtonElement | null>>>(
    {},
  );

  const sharedListId = tasks.every((task) => task.listId === tasks[0]?.listId)
    ? (tasks[0]?.listId ?? null)
    : null;
  const { groupedStatuses, labelFor, colorFor, groupKeyFor } =
    useTaskStatuses(sharedListId);
  const taskIdsKey = tasks.map((task) => task.id).join("\0");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMenu(null);
  }, [taskIdsKey]);

  const accessById = useMemo(() => {
    const next: Record<string, { canEdit: boolean; canChangeStatus: boolean }> =
      {};
    for (const task of tasks) {
      const list = lists.find((item) => item.id === task.listId) ?? null;
      const access = resolveEffectiveListAccess(list, currentUser, roles, isAdmin, {
        isAssignee: userIsAssignee(task.assigneeIds, currentUser),
      });
      next[task.id] = {
        canEdit: access.canEditTasks && !isTaskDeleted(task),
        canChangeStatus: access.canChangeStatus && !isTaskDeleted(task),
      };
    }
    return next;
  }, [currentUser, isAdmin, lists, roles, tasks]);

  const editable = tasks.filter((task) => accessById[task.id]?.canEdit);
  const statusEditable = tasks.filter(
    (task) => accessById[task.id]?.canChangeStatus,
  );
  const canMove = Boolean(sharedListId) && editable.length > 0;
  const destinations = sharedListId
    ? getTaskTree(allTasks, sharedListId).filter(
        (item) =>
          item.kind === "task" &&
          !isTaskDeleted(item) &&
          !tasks.some((task) => task.id === item.id),
      )
    : [];

  const groupLabel = {
    not_started: t("status.group.not_started", "Nav sākts"),
    active: t("status.group.active", "Aktīvs"),
    closed: t("status.group.closed", "Slēgts"),
  };

  function closeMenu() {
    setMenu(null);
  }

  function applyStatus(statusId: string) {
    let changed = 0;
    for (const task of statusEditable) {
      if (task.status === statusId) continue;
      if (
        groupKeyFor(statusId) === "closed" &&
        taskHasIncompleteChecklists(task.checklists)
      ) {
        continue;
      }
      updateTask(task.id, { status: statusId as WorkTaskStatus });
      changed += 1;
    }
    closeMenu();
    if (changed > 0) {
      showFeedback({
        type: "success",
        text: t("subtasks.bulk.updated", "Iezīmētie apakšuzdevumi atjaunināti."),
      });
    }
  }

  function toggleAssignee(assigneeId: string) {
    const allHave = editable.every((task) =>
      task.assigneeIds.includes(assigneeId),
    );
    for (const task of editable) {
      const next = allHave
        ? task.assigneeIds.filter((id) => id !== assigneeId)
        : task.assigneeIds.includes(assigneeId)
          ? task.assigneeIds
          : [...task.assigneeIds, assigneeId];
      if (next.join("\0") !== task.assigneeIds.join("\0")) {
        updateTask(task.id, { assigneeIds: next });
      }
    }
  }

  function applyDate(field: "startDate" | "dueDate", value: string | null) {
    for (const task of editable) {
      if (task[field] === value) continue;
      updateTask(task.id, { [field]: value });
    }
  }

  function applyMove(parentId: string) {
    for (const task of editable) {
      if (task.parentId === parentId) continue;
      moveSubtask(task.id, parentId);
    }
    closeMenu();
    onClear();
    showFeedback({
      type: "success",
      text: t("subtasks.bulk.moved", "Iezīmētie apakšuzdevumi pārvietoti."),
    });
  }

  function confirmDelete() {
    for (const task of editable) {
      hideTask(task.id);
    }
    setDeleteOpen(false);
    onClear();
    showFeedback({
      type: "success",
      text: t("subtasks.bulk.deleted", "Iezīmētie apakšuzdevumi dzēsti."),
    });
  }

  const count = tasks.length;
  const selectedLabel =
    count === 1
      ? t("subtasks.bulk.selected_one", "1 iezīmēts")
      : t("subtasks.bulk.selected", "{count} iezīmēti", { count });
  const sharedDate = editable.every(
    (task) => task[dateField] === editable[0]?.[dateField],
  )
    ? (editable[0]?.[dateField] ?? "")
    : "";

  if (!mounted || tasks.length === 0) return null;

  return (
    <>
      {createPortal(
        <div
          className="pointer-events-none fixed bottom-6 z-50 flex justify-center"
          style={{
            left: "var(--app-sidebar-width-expanded)",
            right: 0,
          }}
        >
          <div
            role="toolbar"
            aria-label={selectedLabel}
            className="pointer-events-auto flex max-w-[calc(100%-2rem)] items-center gap-1 rounded-2xl bg-zinc-900 px-2 py-1.5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.35)]"
          >
            <span className="mr-1 inline-flex items-center gap-2 rounded-xl bg-white/10 px-2.5 py-1.5 text-[13px] font-medium">
              {selectedLabel}
              <button
                type="button"
                aria-label={t("subtasks.bulk.clear", "Noņemt iezīmi")}
                onClick={onClear}
                className="inline-flex size-5 items-center justify-center rounded-full text-zinc-300 transition hover:bg-white/15 hover:text-white"
              >
                <i className="fas fa-xmark text-[11px]" aria-hidden="true" />
              </button>
            </span>
            <BulkBarButton
              icon="fas fa-circle-dot"
              label={t("subtasks.table.status", "Statuss")}
              pressed={menu === "status"}
              disabled={statusEditable.length === 0}
              buttonRef={(node) => {
                triggers.current.status = node;
              }}
              onClick={() =>
                setMenu((current) => (current === "status" ? null : "status"))
              }
            />
            <BulkBarButton
              icon="far fa-user"
              label={t("todo.fields.assignee", "Atbildīgais")}
              pressed={menu === "assignees"}
              disabled={editable.length === 0}
              buttonRef={(node) => {
                triggers.current.assignees = node;
              }}
              onClick={() =>
                setMenu((current) =>
                  current === "assignees" ? null : "assignees",
                )
              }
            />
            <BulkBarButton
              icon="far fa-calendar"
              label={t("subtasks.bulk.dates", "Datumi")}
              pressed={menu === "dates"}
              disabled={editable.length === 0}
              buttonRef={(node) => {
                triggers.current.dates = node;
              }}
              onClick={() =>
                setMenu((current) => (current === "dates" ? null : "dates"))
              }
            />
            <BulkBarButton
              icon="fas fa-exchange-alt"
              label={t("actions.move", "Pārvietot")}
              pressed={menu === "move"}
              disabled={!canMove}
              buttonRef={(node) => {
                triggers.current.move = node;
              }}
              onClick={() =>
                setMenu((current) => (current === "move" ? null : "move"))
              }
            />
            <BulkBarButton
              icon="fas fa-trash"
              label={t("actions.delete", "Dzēst")}
              disabled={editable.length === 0}
              danger
              onClick={() => {
                closeMenu();
                setDeleteOpen(true);
              }}
            />
          </div>
        </div>,
        document.body,
      )}

      <BulkDropup
        open={menu === "status"}
        trigger={triggers.current.status ?? null}
        onClose={closeMenu}
        labelledBy="subtask-bulk-status"
        className="w-[17.5rem]"
      >
        <p
          id="subtask-bulk-status"
          className="px-3 pt-2.5 pb-1 text-[11px] font-medium text-zinc-400"
        >
          {t("subtasks.table.status", "Statuss")}
        </p>
        <div className="max-h-[min(22rem,calc(100vh-6rem))] overflow-y-auto pb-1.5">
          {groupedStatuses.map((group, index) => (
            <div
              key={group.id}
              className={index > 0 ? "mt-1 border-t border-zinc-100 pt-1" : ""}
            >
              <p className="px-3 py-1.5 text-[11px] font-medium text-zinc-400">
                {groupLabel[group.id]}
              </p>
              {group.statuses.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => applyStatus(row.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] font-medium tracking-wide uppercase text-zinc-700 transition hover:bg-zinc-50"
                >
                  <StatusGlyph
                    color={colorFor(row.id) ?? "#a1a1aa"}
                    groupKey={groupKeyFor(row.id)}
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {labelFor(row.id)}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </BulkDropup>

      <BulkDropup
        open={menu === "assignees"}
        trigger={triggers.current.assignees ?? null}
        onClose={closeMenu}
        labelledBy="subtask-bulk-assignees"
        className="w-56 p-1"
      >
        <p
          id="subtask-bulk-assignees"
          className="px-2 py-1 text-[11px] font-medium text-zinc-400"
        >
          {t("todo.fields.assignee", "Atbildīgais")}
        </p>
        <div className="max-h-64 overflow-y-auto">
          {members.map((member) => {
            const selected =
              editable.length > 0 &&
              editable.every((task) => task.assigneeIds.includes(member.id));
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleAssignee(member.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${
                  selected
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <UserAvatar member={member} size="xs" />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
                {selected ? (
                  <i
                    className="fas fa-check text-[10px] text-emerald-600"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
          {roles.length > 0 ? (
            <>
              <p className="px-2 pt-1.5 pb-0.5 text-[11px] font-medium text-zinc-400">
                {t("team.roles.list", "Lomas")}
              </p>
              {roles.map((role) => {
                const selected =
                  editable.length > 0 &&
                  editable.every((task) => task.assigneeIds.includes(role.id));
                const label = teamRankLabel(role.slug, t, roles) ?? role.name;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleAssignee(role.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${
                      selected
                        ? "bg-zinc-100 text-zinc-900"
                        : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                      <i className="fas fa-user-group text-[9px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {selected ? (
                      <i
                        className="fas fa-check text-[10px] text-emerald-600"
                        aria-hidden="true"
                      />
                    ) : null}
                  </button>
                );
              })}
            </>
          ) : null}
        </div>
      </BulkDropup>

      <BulkDropup
        open={menu === "dates"}
        trigger={triggers.current.dates ?? null}
        onClose={closeMenu}
        labelledBy="subtask-bulk-dates"
        className="w-[18rem]"
      >
        <div className="flex border-b border-zinc-100">
          <button
            type="button"
            onClick={() => setDateField("startDate")}
            className={`min-h-10 flex-1 px-3 text-[13px] font-medium ${
              dateField === "startDate"
                ? "border-b-2 border-emerald-500 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {t("tasks.fields.start_date", "Sākums")}
          </button>
          <button
            type="button"
            onClick={() => setDateField("dueDate")}
            className={`min-h-10 flex-1 px-3 text-[13px] font-medium ${
              dateField === "dueDate"
                ? "border-b-2 border-emerald-500 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-700"
            }`}
          >
            {t("todo.fields.due_date", "Termiņš")}
          </button>
        </div>
        <div className="space-y-1 p-2">
          <p id="subtask-bulk-dates" className="sr-only">
            {t("subtasks.bulk.dates", "Datumi")}
          </p>
          {(
            [
              { label: t("dates.today", "Šodien"), value: isoDateOffset(0) },
              { label: t("dates.tomorrow", "Rīt"), value: isoDateOffset(1) },
              {
                label: t("dates.next_week", "Nākamā nedēļa"),
                value: isoDateOffset(7),
              },
            ] as const
          ).map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => applyDate(dateField, item.value)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
            >
              {item.label}
              <span className="text-[12px] text-zinc-400">
                {item.value.slice(8)}.{item.value.slice(5, 7)}
              </span>
            </button>
          ))}
          <input
            type="date"
            value={sharedDate}
            aria-label={
              dateField === "startDate"
                ? t("tasks.fields.start_date", "Sākums")
                : t("todo.fields.due_date", "Termiņš")
            }
            onChange={(event) =>
              applyDate(dateField, event.target.value || null)
            }
            className="min-h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
          />
          <button
            type="button"
            onClick={() => applyDate(dateField, null)}
            className="flex w-full items-center rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-500 hover:bg-zinc-50"
          >
            {t("dates.clear", "Noņemt datumu")}
          </button>
        </div>
      </BulkDropup>

      <BulkDropup
        open={menu === "move"}
        trigger={triggers.current.move ?? null}
        onClose={closeMenu}
        labelledBy="subtask-bulk-move"
        className="w-56 p-1.5"
      >
        <p
          id="subtask-bulk-move"
          className="px-2 py-1 text-[10px] font-medium text-zinc-400"
        >
          {t("actions.move", "Pārvietot")}
        </p>
        {destinations.length === 0 ? (
          <p className="px-2 py-2 text-[13px] text-zinc-500">
            {t("subtasks.move.empty", "Sarakstā nav citu uzdevumu.")}
          </p>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {destinations.map((item) => {
              const depth = getTaskAncestors(allTasks, item).length;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => applyMove(item.id)}
                  style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-700 transition hover:bg-zinc-100"
                >
                  <i
                    className={`${workItemIcon(item)} w-4 text-center text-[12px] text-zinc-400`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{item.title}</span>
                </button>
              );
            })}
          </div>
        )}
      </BulkDropup>

      <ConfirmModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t(
          "subtasks.bulk.delete.title",
          "Dzēst iezīmētos apakšuzdevumus?",
        )}
        description={t(
          "subtasks.bulk.delete.description",
          "{count} apakšuzdevumi tiks dzēsti.",
          { count: editable.length },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={confirmDelete}
      />
    </>
  );
}

export function SubtaskSelectCheckbox({
  checked,
  mixed = false,
  label,
  visible,
  className = "",
  onToggle,
}: {
  checked: boolean;
  mixed?: boolean;
  label: string;
  visible: boolean;
  className?: string;
  onToggle: (shiftKey: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(event.shiftKey);
      }}
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition ${
        checked || mixed
          ? "border-emerald-500 bg-emerald-500 text-white"
          : "border-zinc-300 bg-white text-transparent hover:border-emerald-400"
      } ${
        visible
          ? "opacity-100"
          : "opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100"
      } ${className}`.trim()}
    >
      <i
        className={`text-[8px] ${mixed ? "fas fa-minus" : "fas fa-check"}`}
        aria-hidden="true"
      />
    </button>
  );
}
