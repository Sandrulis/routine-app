"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { MoveSubtaskModal } from "@/app/components/move-subtask-modal";
import { StatusControl } from "@/app/components/status-control";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatDisplayDateDdMmYy,
  todayIsoDate,
} from "@/app/lib/format-display-date";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  listAccessCapabilities,
  resolveListAccessLevel,
  userIsAssignee,
} from "@/app/lib/list-access";
import {
  isTaskActiveInLists,
  isTaskDeleted,
  type WorkTask,
} from "@/app/lib/lists";
import { useTaskStatuses } from "@/app/lib/task-statuses";

export { statusClassName } from "@/app/components/status-control";

const EXIT_MS = 280;

function useDisplayedTasks(
  visible: WorkTask[],
  view: "active" | "with-archive",
) {
  const visibleKey = visible.map((task) => task.id).join("\0");
  const [exiting, setExiting] = useState<{ task: WorkTask; index: number }[]>(
    [],
  );
  const prevVisibleRef = useRef(visible);
  const visibleRef = useRef(visible);
  const viewRef = useRef(view);
  visibleRef.current = visible;

  useLayoutEffect(() => {
    const currentVisible = visibleRef.current;
    const prevVisible = prevVisibleRef.current;
    prevVisibleRef.current = currentVisible;

    if (viewRef.current !== view) {
      viewRef.current = view;
      setExiting([]);
      return;
    }

    const nextIds = new Set(currentVisible.map((task) => task.id));
    const left = prevVisible
      .map((task, index) => ({ task, index }))
      .filter(({ task }) => !nextIds.has(task.id));
    if (left.length === 0) return;

    setExiting((current) => {
      const seen = new Set(current.map((row) => row.task.id));
      return [...current, ...left.filter((row) => !seen.has(row.task.id))];
    });

    const leftIds = left.map((row) => row.task.id);
    const timer = window.setTimeout(() => {
      setExiting((current) =>
        current.filter((row) => !leftIds.includes(row.task.id)),
      );
    }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [visibleKey, view]);

  const rows = visible.map((task) => ({ task, exiting: false }));
  for (const row of [...exiting].sort((left, right) => left.index - right.index)) {
    if (visible.some((task) => task.id === row.task.id)) continue;
    rows.splice(Math.min(row.index, rows.length), 0, {
      task: row.task,
      exiting: true,
    });
  }
  return rows;
}

export function DateCell({
  value,
  emptyLabel,
  onChange,
  disabled = false,
}: {
  value: string | null;
  emptyLabel: string;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    if (disabled) return;
    const input = inputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  }

  return (
    <div className="relative inline-flex min-h-8 min-w-[7.5rem] items-center">
      <span className="pointer-events-none">
        {value ? (
          <span
            className={`text-[13px] ${
              value < todayIsoDate() ? "text-red-600" : "text-zinc-700"
            }`}
          >
            {formatDisplayDateDdMmYy(value)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-zinc-300">
            <i className="far fa-calendar-plus text-[12px]" aria-hidden="true" />
            <span className="sr-only">{emptyLabel}</span>
          </span>
        )}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        aria-label={emptyLabel}
        data-app-modal-ignore-backdrop=""
        onMouseDown={(event) => event.stopPropagation()}
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation();
          if (disabled) return;
          openPicker();
        }}
        onChange={(event) => onChange(event.target.value || null)}
        className={`absolute inset-0 z-10 w-full min-w-[7.5rem] opacity-[0.01] ${
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        }`}
      />
    </div>
  );
}

export function AssigneeCell({
  task,
  assigneeIds,
  onChange,
  disabled = false,
}: {
  task?: WorkTask;
  assigneeIds?: string[];
  onChange?: (next: string[]) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslations();
  const { members } = useTeam();
  const { updateTask } = useLists();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const ids = assigneeIds ?? task?.assigneeIds ?? [];
  const assigned = members.filter((member) => ids.includes(member.id));

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  function toggleMember(memberId: string) {
    const next = ids.includes(memberId)
      ? ids.filter((id) => id !== memberId)
      : [...ids, memberId];
    if (onChange) {
      onChange(next);
      return;
    }
    if (task) updateTask(task.id, { assigneeIds: next });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("todo.fields.assignee", "Atbildīgais")}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={`inline-flex min-h-8 items-center ${disabled ? "cursor-not-allowed" : ""}`}
      >
        {assigned.length > 0 ? (
          <span className="flex items-center -space-x-1.5">
            {assigned.map((member) => (
              <UserAvatar key={member.id} member={member} size="xs" />
            ))}
          </span>
        ) : (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <i className="fas fa-user-plus text-[10px]" aria-hidden="true" />
          </span>
        )}
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {members.map((member) => {
            const selected = ids.includes(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleMember(member.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${
                  selected ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <UserAvatar member={member} size="xs" />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
                {selected ? (
                  <i className="fas fa-check text-[10px] text-emerald-600" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SubtaskTable({
  listId,
  tasks,
  onOpenTask,
  embedded = false,
  view = "active",
}: {
  listId: string;
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
  embedded?: boolean;
  view?: "active" | "with-archive";
}) {
  const { t } = useTranslations();
  const { lists, updateTask, hideTask, restoreTask, reorderTasks } = useLists();
  const [movingTask, setMovingTask] = useState<WorkTask | null>(null);
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { statuses } = useTaskStatuses();
  const list = lists.find((item) => item.id === listId) ?? null;
  const access = listAccessCapabilities(
    list ? resolveListAccessLevel(list, currentUser, roles, isAdmin) : null,
    { isAssignee: false },
  );
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const matching =
    view === "with-archive"
      ? tasks
      : tasks.filter((task) => isTaskActiveInLists(task, statuses));
  const displayedRows = useDisplayedTasks(matching, view);
  const displayed = displayedRows.map((row) => row.task);
  const exitingIds = new Set(
    displayedRows.filter((row) => row.exiting).map((row) => row.task.id),
  );

  function handleDragEnd(event: DragEndEvent) {
    if (!access.canEditTasks) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ordered = displayed.filter((task) => !exitingIds.has(task.id));
    const oldIndex = ordered.findIndex((task) => task.id === active.id);
    const newIndex = ordered.findIndex((task) => task.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderTasks(arrayMove(ordered.map((task) => task.id), oldIndex, newIndex));
  }

  if (displayed.length === 0) {
    return (
      <div
        className={
          embedded
            ? "px-1 py-3 text-sm text-zinc-400"
            : "rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500"
        }
      >
        {t("subtasks.empty", "Šim uzdevumam vēl nav apakšuzdevumu.")}
      </div>
    );
  }

  return (
    <>
    <div
      className={
        embedded
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-2xl border border-zinc-200 bg-white"
      }
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-[12px] font-medium text-zinc-400">
              <th className={`${embedded ? "w-8 px-1" : "w-10 px-2"} py-2.5`} />
              <th className={`${embedded ? "px-1" : "px-2"} py-2.5 font-medium`}>
                {t("tasks.fields.title", "Nosaukums")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("todo.fields.assignee", "Atbildīgais")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("tasks.fields.start_date", "Sākums")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("todo.fields.due_date", "Termiņš")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("subtasks.table.status", "Statuss")}
              </th>
            </tr>
          </thead>
          <SortableContext
            items={displayed.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {displayed.map((task) => (
                <SortableSubtaskRow
                  key={task.id}
                  task={task}
                  exiting={exitingIds.has(task.id)}
                  onOpenTask={onOpenTask}
                  onUpdate={updateTask}
                  onHide={
                    access.canEditTasks && !isTaskDeleted(task)
                      ? () => hideTask(task.id)
                      : undefined
                  }
                  onMove={
                    access.canEditTasks && !isTaskDeleted(task)
                      ? () => setMovingTask(task)
                      : undefined
                  }
                  onRestore={
                    access.canEditTasks && isTaskDeleted(task)
                      ? () => restoreTask(task.id)
                      : undefined
                  }
                  hideLabel={t("subtasks.hide", "Tikai pazūd")}
                  moveLabel={t("actions.move", "Pārvietot")}
                  restoreLabel={t("subtasks.restore", "Atjaunot")}
                  dragLabel={t("subtasks.drag", "Mainīt secību")}
                  canEdit={access.canEditTasks && !isTaskDeleted(task)}
                  canChangeStatus={
                    !isTaskDeleted(task) &&
                    (access.canEditTasks ||
                      (access.canComment &&
                        userIsAssignee(task.assigneeIds, currentUser)))
                  }
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
    <MoveSubtaskModal
      open={Boolean(movingTask)}
      task={movingTask}
      onOpenChange={(open) => {
        if (!open) setMovingTask(null);
      }}
    />
    </>
  );
}

function SortableSubtaskRow({
  task,
  onOpenTask,
  onUpdate,
  onHide,
  onMove,
  onRestore,
  hideLabel,
  moveLabel,
  restoreLabel,
  dragLabel,
  canEdit,
  canChangeStatus,
  exiting,
}: {
  task: WorkTask;
  onOpenTask: (task: WorkTask) => void;
  onUpdate: (
    taskId: string,
    patch: Partial<Pick<WorkTask, "status" | "startDate" | "dueDate">>,
  ) => void;
  onHide?: () => void;
  onMove?: () => void;
  onRestore?: () => void;
  hideLabel: string;
  moveLabel: string;
  restoreLabel: string;
  dragLabel: string;
  canEdit: boolean;
  canChangeStatus: boolean;
  exiting: boolean;
}) {
  const { t } = useTranslations();
  const deleted = isTaskDeleted(task);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: !canEdit || exiting });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80 ${
        isDragging ? "relative z-10 bg-white shadow-sm" : ""
      } ${exiting ? "subtask-row-exit" : ""}`}
    >
      <td className="px-2 py-2.5">
        {canEdit ? (
          <DragHandle
            label={dragLabel}
            attributes={attributes}
            listeners={listeners}
          />
        ) : null}
      </td>
      <td className="px-2 py-2.5">
        <button
          type="button"
          onClick={() => {
            if (deleted && onRestore) {
              onRestore();
              return;
            }
            onOpenTask(task);
          }}
          aria-label={deleted ? restoreLabel : undefined}
          className={`text-left font-medium hover:text-blue-700 ${
            deleted ? "text-zinc-400 line-through" : "text-zinc-900"
          }`}
        >
          {task.title}
        </button>
      </td>
      <td className="px-3 py-2.5">
        <AssigneeCell task={task} disabled={!canEdit || deleted} />
      </td>
      <td className="px-3 py-2.5">
        <DateCell
          value={task.startDate}
          emptyLabel={t("tasks.fields.start_date", "Sākums")}
          disabled={!canEdit || deleted}
          onChange={(startDate) => onUpdate(task.id, { startDate })}
        />
      </td>
      <td className="px-3 py-2.5">
        <DateCell
          value={task.dueDate}
          emptyLabel={t("todo.fields.due_date", "Termiņš")}
          disabled={!canEdit || deleted}
          onChange={(dueDate) => onUpdate(task.id, { dueDate })}
        />
      </td>
      <td className="px-3 py-2.5">
        <StatusControl
          status={task.status}
          statusChangedAt={deleted ? task.deletedAt : task.statusChangedAt}
          deleted={deleted}
          disabled={!canChangeStatus}
          onRestore={onRestore}
          onChange={(status) => onUpdate(task.id, { status })}
          trailing={
            onMove || onHide ? (
              <>
                {onMove ? (
                  <IconActionButton
                    label={moveLabel}
                    icon="fas fa-exchange-alt"
                    variant="muted"
                    onClick={onMove}
                  />
                ) : null}
                {onHide ? (
                  <IconActionButton
                    label={hideLabel}
                    icon="fas fa-trash"
                    variant="delete"
                    onClick={onHide}
                  />
                ) : null}
              </>
            ) : null
          }
        />
      </td>
    </tr>
  );
}
