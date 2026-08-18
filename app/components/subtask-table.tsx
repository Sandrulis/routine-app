"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AssigneeFaces } from "@/app/components/assignee-faces";
import { DragHandle } from "@/app/components/drag-handle";
import { createMenuAnchorFromEvent, type CreateMenuAnchor } from "@/app/components/create-item-menu";
import { IconActionButton } from "@/app/components/icon-action-button";
import { MoveSubtaskModal } from "@/app/components/move-subtask-modal";
import { StatusControl, statusClassName } from "@/app/components/status-control";
import {
  dropHintFromEvent,
  frozenSortingStrategy,
  groupedStatusCollisionDetection,
  insertAtEdge,
  parseStatusGroupDropId,
  statusGroupDropId,
  TaskDropLine,
  type DropHint,
} from "@/app/components/task-drop-line";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import { assignedMembersOf, assignedRolesOf } from "@/app/lib/assignees";
import {
  calendarDaysFromToday,
  formatDisplayDateDdMmYy,
} from "@/app/lib/format-display-date";
import { useLists } from "@/app/lib/lists-store";
import { teamRankLabel } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  listAccessCapabilities,
  resolveListAccessLevel,
  userIsAssignee,
} from "@/app/lib/list-access";
import {
  mergeStatusCatalog,
  resolveStatusIdForTask,
  statusesByPriorityDesc,
} from "@/app/lib/list-statuses";
import {
  fadeHexColor,
  isClosedTaskStatus,
  isTaskActiveInLists,
  isTaskDeleted,
  type WorkTask,
} from "@/app/lib/lists";
import {
  useSystemTaskStatuses,
  useTaskStatuses,
} from "@/app/lib/task-statuses";
import { checklistProgress, taskHasIncompleteChecklists } from "@/app/lib/task-checklists";

export { statusClassName };

const EXIT_MS = 280;

const TASK_TABLE_COLS = {
  handle: "2rem",
  title: "16rem",
  assignee: "7rem",
  date: "9.5rem",
  status: "18rem",
} as const;

const TASK_TABLE_MIN_WIDTH = `calc(${TASK_TABLE_COLS.handle} + ${TASK_TABLE_COLS.title} + ${TASK_TABLE_COLS.assignee} + ${TASK_TABLE_COLS.date} + ${TASK_TABLE_COLS.date} + ${TASK_TABLE_COLS.status})`;
const TASK_TABLE_COL_COUNT = 6;

function tasksShareSiblingGroup(tasks: WorkTask[]) {
  const first = tasks[0];
  if (!first) return false;
  const key = `${first.listId}:${first.parentId ?? ""}`;
  return tasks.every((task) => `${task.listId}:${task.parentId ?? ""}` === key);
}

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
  const { t } = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const days = value ? calendarDaysFromToday(value) : null;
  const overdue = days != null && days < 0;
  const relative =
    days == null
      ? null
      : days === 0
        ? t("dates.today", "Šodien")
        : overdue
          ? t("dates.days_overdue", "{count} d kavē", { count: Math.abs(days) })
          : t("dates.days_left", "{count} d atlikušas", { count: days });

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
    <div className="relative inline-flex min-h-8 min-w-[7.5rem] flex-col items-start justify-center">
      <span className="pointer-events-none">
        {value ? (
          <>
            <span
              className={`block text-[13px] leading-none ${
                overdue ? "text-red-600" : "text-zinc-700"
              }`}
            >
              {formatDisplayDateDdMmYy(value)}
            </span>
            {relative ? (
              <span
                className={`mt-0.5 block text-[11px] leading-none tabular-nums ${
                  overdue ? "text-red-500" : "text-zinc-400"
                }`}
              >
                {relative}
              </span>
            ) : null}
          </>
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
  const { members, roles } = useTeam();
  const { updateTask } = useLists();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const ids = assigneeIds ?? task?.assigneeIds ?? [];
  const assignedMembers = assignedMembersOf(ids, members);
  const assignedRoles = assignedRolesOf(ids, roles);
  const hasAssignees = assignedMembers.length > 0 || assignedRoles.length > 0;

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: globalThis.MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  function toggleAssignee(assigneeId: string) {
    const next = ids.includes(assigneeId)
      ? ids.filter((id) => id !== assigneeId)
      : [...ids, assigneeId];
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
        {hasAssignees ? (
          <AssigneeFaces assigneeIds={ids} />
        ) : (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <i className="fas fa-user-plus text-[10px]" aria-hidden="true" />
          </span>
        )}
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {members.map((member) => {
            const selected = ids.includes(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleAssignee(member.id)}
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
          {roles.length > 0 ? (
            <>
              <p className="px-2 pt-1.5 pb-0.5 text-[11px] font-medium text-zinc-400">
                {t("team.roles.list", "Lomas")}
              </p>
              {roles.map((role) => {
                const selected = ids.includes(role.id);
                const label = teamRankLabel(role.slug, t, roles) ?? role.name;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleAssignee(role.id)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${
                      selected ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                      <i className="fas fa-user-group text-[9px]" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {selected ? (
                      <i className="fas fa-check text-[10px] text-emerald-600" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </>
          ) : null}
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
  reorderable = true,
  groupByStatus = false,
}: {
  listId?: string;
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
  embedded?: boolean;
  view?: "active" | "with-archive";
  reorderable?: boolean;
  groupByStatus?: boolean;
}) {
  const { t } = useTranslations();
  const dndContextId = useId();
  const { lists, listStatuses, updateTask, hideTask, restoreTask, reorderTasks } =
    useLists();
  const [movingTask, setMovingTask] = useState<WorkTask | null>(null);
  const [moveAnchor, setMoveAnchor] = useState<CreateMenuAnchor | null>(null);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { statuses, colorFor, labelFor } = useTaskStatuses(listId);
  const { statuses: systemStatuses } = useSystemTaskStatuses();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const matching = useMemo(() => {
    const visible =
      view === "with-archive"
        ? tasks
        : tasks.filter((task) => isTaskActiveInLists(task, statuses));
    if (!groupByStatus) return visible;
    return statusesByPriorityDesc(statuses).flatMap((status) =>
      visible.filter((task) => task.status === status.id),
    );
  }, [groupByStatus, statuses, tasks, view]);
  const displayedRows = useDisplayedTasks(matching, view);
  const displayed = displayedRows.map((row) => row.task);
  const exitingIds = new Set(
    displayedRows.filter((row) => row.exiting).map((row) => row.task.id),
  );
  const showListName = new Set(tasks.map((task) => task.listId)).size > 1;
  const sameSiblings = tasksShareSiblingGroup(
    matching.filter((task) => !exitingIds.has(task.id)),
  );
  const groups = useMemo(() => {
    if (!groupByStatus) return [];
    return statusesByPriorityDesc(statuses)
      .filter((status) => view === "with-archive" || status.groupKey !== "closed")
      .map((status) => ({
        status,
        items: displayed.filter((task) => task.status === status.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [displayed, groupByStatus, statuses, view]);

  function accessFor(task: WorkTask) {
    const list = lists.find((item) => item.id === task.listId) ?? null;
    return listAccessCapabilities(
      list ? resolveListAccessLevel(list, currentUser, roles, isAdmin) : null,
      { isAssignee: userIsAssignee(task.assigneeIds, currentUser) },
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const hint = dropHintFromEvent(event);
    setDropHint(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ordered = displayed.filter((task) => !exitingIds.has(task.id));
    const activeTask = ordered.find((task) => task.id === active.id);
    if (!activeTask) return;
    const access = accessFor(activeTask);
    const canDragStatus = access.canChangeStatus && !isTaskDeleted(activeTask);
    const canDragOrder = reorderable && access.canEditTasks && !isTaskDeleted(activeTask);
    if (!canDragStatus && !canDragOrder) return;

    const headerStatusId = parseStatusGroupDropId(over.id);
    const overTask = headerStatusId
      ? null
      : ordered.find((task) => task.id === over.id);
    if (!headerStatusId && !overTask) return;

    const targetStatusId = headerStatusId ?? overTask?.status;
    if (!targetStatusId) return;

    const taskCatalog = mergeStatusCatalog(
      systemStatuses,
      listStatuses,
      activeTask.listId,
    );
    const resolvedStatus = resolveStatusIdForTask(
      targetStatusId,
      taskCatalog,
      statuses,
    );
    if (!resolvedStatus) return;

    const edge = hint?.edge ?? "before";
    if (resolvedStatus !== activeTask.status) {
      if (!canDragStatus) return;
      updateTask(activeTask.id, {
        status: resolvedStatus as WorkTask["status"],
      });
      if (canDragOrder && sameSiblings) {
        const targetIds = ordered
          .filter(
            (task) =>
              task.status === resolvedStatus && task.id !== activeTask.id,
          )
          .map((task) => task.id);
        reorderTasks(
          insertAtEdge(
            targetIds,
            activeTask.id,
            overTask?.id ?? null,
            edge,
            Boolean(headerStatusId),
          ),
        );
      }
      return;
    }

    if (!canDragOrder || !sameSiblings) return;
    const groupIds = ordered
      .filter((task) => task.status === activeTask.status)
      .map((task) => task.id);
    const nextIds = insertAtEdge(
      groupIds,
      activeTask.id,
      overTask?.id ?? null,
      edge,
      Boolean(headerStatusId),
    );
    if (nextIds.some((id, index) => id !== groupIds[index])) {
      reorderTasks(nextIds);
    }
  }

  if (displayed.length === 0) {
    return (
      <div className={embedded ? "px-1 py-2" : undefined}>
        <p
          className={
            embedded
              ? "text-sm text-zinc-400"
              : "rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500"
          }
        >
          {view === "with-archive" && tasks.length > 0
            ? t("subtasks.archive.empty", "Arhīvā nav pabeigtu uzdevumu.")
            : t("subtasks.empty", "Šim uzdevumam vēl nav apakšuzdevumu.")}
        </p>
      </div>
    );
  }

  function renderRow(task: WorkTask) {
    const access = accessFor(task);
    const deleted = isTaskDeleted(task);
    return (
      <SortableSubtaskRow
        key={task.id}
        listId={task.listId}
        task={task}
        exiting={exitingIds.has(task.id)}
        reorderable={reorderable}
        listName={
          showListName
            ? (lists.find((item) => item.id === task.listId)?.name ?? null)
            : null
        }
        onOpenTask={onOpenTask}
        onUpdate={updateTask}
        onHide={
          access.canEditTasks && !deleted ? () => hideTask(task.id) : undefined
        }
        onMove={
          access.canEditTasks && !deleted
            ? (event) => {
                if (movingTask?.id === task.id) {
                  setMovingTask(null);
                  setMoveAnchor(null);
                  return;
                }
                setMovingTask(task);
                setMoveAnchor(createMenuAnchorFromEvent(event));
              }
            : undefined
        }
        moveOpen={movingTask?.id === task.id}
        onRestore={
          access.canEditTasks && deleted ? () => restoreTask(task.id) : undefined
        }
        hideLabel={t("subtasks.hide", "Tikai pazūd")}
        moveLabel={t("actions.move", "Pārvietot")}
        restoreLabel={t("subtasks.restore", "Atjaunot")}
        dragLabel={t("subtasks.drag", "Mainīt secību")}
        canEdit={access.canEditTasks && !deleted}
        canChangeStatus={access.canChangeStatus && !deleted}
      />
    );
  }

  return (
    <>
    <div
      className={
        embedded
          ? "w-full overflow-x-auto"
          : "w-full overflow-x-auto rounded-2xl border border-zinc-200 bg-white"
      }
    >
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={
          groupByStatus ? groupedStatusCollisionDetection : closestCenter
        }
        onDragStart={() => setDropHint(null)}
        onDragMove={(event) => setDropHint(dropHintFromEvent(event))}
        onDragOver={(event) => setDropHint(dropHintFromEvent(event))}
        onDragCancel={() => setDropHint(null)}
        onDragEnd={handleDragEnd}
      >
        <table
          className="w-full table-fixed text-left text-sm"
          style={{ minWidth: TASK_TABLE_MIN_WIDTH }}
        >
          <colgroup>
            <col style={{ width: TASK_TABLE_COLS.handle }} />
            <col />
            <col style={{ width: TASK_TABLE_COLS.assignee }} />
            <col style={{ width: TASK_TABLE_COLS.date }} />
            <col style={{ width: TASK_TABLE_COLS.date }} />
            <col style={{ width: TASK_TABLE_COLS.status }} />
          </colgroup>
          <thead>
            <tr className="border-b border-zinc-100 text-[12px] font-medium whitespace-nowrap text-zinc-400">
              <th className="px-1 py-2.5" />
              <th className="px-2 py-2.5 font-medium">
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
            <tbody>
              {groupByStatus
                ? groups.map((group, groupIndex) => {
                    const groupColor = colorFor(group.status.id);
                    const groupIds = group.items.map((task) => task.id);
                    return (
                      <Fragment key={group.status.id}>
                        <StatusGroupHeaderRow
                          statusId={group.status.id}
                          label={
                            labelFor(group.status.id) || group.status.label
                          }
                          count={group.items.filter((task) => !exitingIds.has(task.id)).length}
                          color={groupColor}
                          first={groupIndex === 0}
                        />
                        <SortableContext
                          items={groupIds}
                          strategy={frozenSortingStrategy}
                        >
                          {group.items.map((task) => renderRow(task))}
                        </SortableContext>
                      </Fragment>
                    );
                  })
                : (
                    <SortableContext
                      items={displayed.map((task) => task.id)}
                      strategy={frozenSortingStrategy}
                    >
                      {displayed.map((task) => renderRow(task))}
                    </SortableContext>
                  )}
            </tbody>
        </table>
        {dropHint ? <TaskDropLine hint={dropHint} /> : null}
      </DndContext>
    </div>
    <MoveSubtaskModal
      open={Boolean(movingTask)}
      task={movingTask}
      anchor={moveAnchor}
      onOpenChange={(open) => {
        if (!open) {
          setMovingTask(null);
          setMoveAnchor(null);
        }
      }}
    />
    </>
  );
}

function StatusGroupHeaderRow({
  statusId,
  label,
  count,
  color,
  first,
}: {
  statusId: string;
  label: string;
  count: number;
  color: string | null;
  first: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusGroupDropId(statusId),
  });

  return (
    <tr
      ref={setNodeRef}
      className={isOver ? "bg-emerald-50" : undefined}
    >
      <td
        colSpan={TASK_TABLE_COL_COUNT}
        className={`px-1 ${first ? "pt-1 pb-2" : "pt-4 pb-2"}`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex min-h-6 items-center rounded-md px-2 text-[11px] font-semibold tracking-wide uppercase ${
              color ? "text-white" : statusClassName("todo")
            }`}
            style={color ? { backgroundColor: color } : undefined}
          >
            {label}
          </span>
          <span className="text-[12px] text-zinc-400">{count}</span>
        </div>
      </td>
    </tr>
  );
}

function SortableSubtaskRow({
  listId,
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
  moveOpen = false,
  reorderable = true,
  listName = null,
}: {
  listId: string;
  task: WorkTask;
  onOpenTask: (task: WorkTask) => void;
  onUpdate: (
    taskId: string,
    patch: Partial<Pick<WorkTask, "status" | "startDate" | "dueDate">>,
  ) => void;
  onHide?: () => void;
  onMove?: (event: MouseEvent<HTMLButtonElement>) => void;
  onRestore?: () => void;
  hideLabel: string;
  moveLabel: string;
  restoreLabel: string;
  dragLabel: string;
  canEdit: boolean;
  canChangeStatus: boolean;
  exiting: boolean;
  moveOpen?: boolean;
  reorderable?: boolean;
  listName?: string | null;
}) {
  const { t } = useTranslations();
  const { taskActivities } = useLists();
  const { colorFor, statuses } = useTaskStatuses(listId);
  const deleted = isTaskDeleted(task);
  const closed = isClosedTaskStatus(task.status, statuses);
  const rowTint = deleted
    ? fadeHexColor("#ef4444", 0.88)
    : closed
      ? fadeHexColor(colorFor(task.status) ?? "#10b981", 0.88)
      : null;
  const canDrag =
    !exiting && ((reorderable && canEdit) || canChangeStatus);
  const checklistsProgress = checklistProgress(task.checklists ?? []);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: !canDrag,
    animateLayoutChanges: () => false,
  });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        backgroundColor: isDragging ? undefined : rowTint ?? undefined,
      }}
      className={`group/row border-b border-zinc-100 last:border-b-0 ${
        rowTint && !isDragging ? "hover:brightness-[0.97]" : "hover:bg-zinc-50/80"
      } ${
        isDragging ? "relative z-10 bg-white opacity-40 shadow-sm" : ""
      } ${exiting ? "subtask-row-exit" : ""}`}
    >
      <td className="px-1 py-2.5">
        {canDrag ? (
          <DragHandle
            label={dragLabel}
            attributes={attributes}
            listeners={listeners}
          />
        ) : null}
      </td>
      <td className="min-w-0 px-2 py-2.5">
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
          className={`block w-full truncate text-left font-medium hover:text-blue-700 ${
            deleted ? "text-zinc-400 line-through" : "text-zinc-900"
          }`}
        >
          {task.title}
        </button>
        {listName ? (
          <p className="mt-0.5 truncate text-[11px] text-zinc-400">{listName}</p>
        ) : null}
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
      <td className="whitespace-nowrap px-3 py-2.5">
        <StatusControl
          listId={listId}
          status={task.status}
          statusChangedAt={
            deleted
              ? task.deletedAt
              : task.statusChangedAt ??
                taskActivities(task.id).find((item) => item.kind === "created")?.at ??
                null
          }
          deleted={deleted}
          disabled={!canChangeStatus}
          completeBlocked={taskHasIncompleteChecklists(task.checklists)}
          completeBlockedLabel={t(
            "subtasks.checklist.incomplete",
            "Vispirms izpildi visus kontrolsaraksta punktus.",
          )}
          checklistProgress={
            checklistsProgress.total > 0 ? checklistsProgress : null
          }
          onRestore={onRestore}
          onChange={(status) => onUpdate(task.id, { status })}
          revealActionsOnHover
          actionsForced={moveOpen}
          trailing={
            onMove || onHide ? (
              <>
                {onMove ? (
                  <IconActionButton
                    label={moveLabel}
                    icon="fas fa-exchange-alt"
                    variant="muted"
                    pressed={moveOpen}
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
