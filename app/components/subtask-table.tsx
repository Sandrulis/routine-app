"use client";

import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
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
import { StatusReorderHandle } from "@/app/components/drag-handle";
import { createMenuAnchorFromEvent, type CreateMenuAnchor } from "@/app/components/create-item-menu";
import { IconActionButton } from "@/app/components/icon-action-button";
import { MoveSubtaskModal } from "@/app/components/move-subtask-modal";
import { SubtaskBulkBar, SubtaskSelectCheckbox } from "@/app/components/subtask-bulk-bar";
import { TaskLocationPath } from "@/app/components/task-location-path";
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
import { DatePickerPopover } from "@/app/components/date-picker-popover";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { assignedMembersOf, assignedRolesOf } from "@/app/lib/assignees";
import {
  taskDateRelativeHint,
  type TaskDateFieldKind,
} from "@/app/lib/task-date-display";
import { isListStatusGroup, type ListStatusGroup } from "@/app/lib/list-statuses";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { useLists } from "@/app/lib/lists-store";
import { teamRankLabel } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  resolveEffectiveListAccess,
  userIsAssignee,
} from "@/app/lib/list-access";
import {
  mergeStatusCatalog,
  resolveStatusIdForTask,
  sortTasksLikeNavTree,
  statusesByPriorityDesc,
} from "@/app/lib/list-statuses";
import {
  emptyWorkProgress,
  fadeHexColor,
  getSubtaskLocationSegments,
  isClosedTaskStatus,
  isTaskActiveInLists,
  isTaskDeleted,
  workProgressById,
  workProgressFromItems,
  type TaskLocationSegment,
  type WorkTask,
} from "@/app/lib/lists";
import {
  useSystemTaskStatuses,
  useTaskStatuses,
} from "@/app/lib/task-statuses";
import { checklistProgress, taskHasIncompleteChecklists } from "@/app/lib/task-checklists";
import { WorkProgressLabel } from "@/app/components/work-progress";

export { statusClassName };

const EXIT_MS = 280;

const TASK_TABLE_COLS = {
  handle: "3.5rem",
  title: "16rem",
  assignee: "7rem",
  date: "9.5rem",
  status: "16rem",
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
  fieldKind,
  statusGroup = "active",
}: {
  value: string | null;
  emptyLabel: string;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  fieldKind: TaskDateFieldKind;
  statusGroup?: ListStatusGroup;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const hint = taskDateRelativeHint(value, fieldKind, statusGroup);
  const relative =
    hint == null
      ? null
      : hint.days === 0
        ? t("dates.today", "Šodien")
        : hint.overdue
          ? t("dates.days_overdue", "{count} d kavē", { count: Math.abs(hint.days) })
          : t("dates.days_left", "{count} d atlikušas", { count: hint.days });
  const emphasizeOverdue = hint?.overdue === true;

  return (
    <div className="relative inline-flex min-h-8 min-w-[7.5rem] flex-col items-start justify-center">
      <div
        ref={triggerRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={emptyLabel}
        className={`w-full ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setPickerOpen(true);
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setPickerOpen(true);
          }
        }}
      >
        {value ? (
          <>
            <span
              className={`block text-[13px] leading-none ${
                emphasizeOverdue ? "text-red-600" : "text-zinc-700"
              }`}
            >
              {formatDate(value)}
            </span>
            {relative ? (
              <span
                className={`mt-0.5 block text-[11px] leading-none tabular-nums ${
                  emphasizeOverdue ? "text-red-500" : "text-zinc-400"
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
      </div>
      <DatePickerPopover
        value={value}
        onChange={onChange}
        disabled={disabled}
        triggerRef={triggerRef}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />
    </div>
  );
}

function assigneePanelPosition(
  trigger: HTMLElement,
  panel: HTMLElement,
): { top: number; left: number } | null {
  const triggerRect = trigger.getBoundingClientRect();
  if (triggerRect.width === 0 && triggerRect.height === 0) {
    return null;
  }
  const panelRect = panel.getBoundingClientRect();
  const left = Math.min(
    Math.max(12, triggerRect.left),
    window.innerWidth - 12 - panelRect.width,
  );
  const below = triggerRect.bottom + 6;
  const top =
    below + panelRect.height > window.innerHeight - 12
      ? Math.max(12, triggerRect.top - 6 - panelRect.height)
      : below;
  return { top, left };
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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const ids = assigneeIds ?? task?.assigneeIds ?? [];
  const assignedMembers = assignedMembersOf(ids, members);
  const assignedRoles = assignedRolesOf(ids, roles);
  const hasAssignees = assignedMembers.length > 0 || assignedRoles.length > 0;
  const assigneeKey = ids.join("\0");

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) {
      setPosition(null);
      return;
    }

    function reposition() {
      if (!open || !triggerRef.current || !panelRef.current) return;
      const next = assigneePanelPosition(triggerRef.current, panelRef.current);
      if (!next) {
        setOpen(false);
        setPosition(null);
        return;
      }
      setPosition(next);
    }

    reposition();

    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(reposition)
        : null;
    resizeObserver?.observe(document.documentElement);
    resizeObserver?.observe(triggerRef.current);

    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      resizeObserver?.disconnect();
    };
  }, [open, assigneeKey, members.length, roles.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: globalThis.MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey, true);
    };
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
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
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
      {open
        ? createPortal(
            <div
              ref={panelRef}
              data-app-modal-ignore-backdrop=""
              role="listbox"
              aria-label={t("todo.fields.assignee", "Atbildīgais")}
              onMouseDown={(event) => event.stopPropagation()}
              style={{
                position: "fixed",
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                zIndex: 80,
                opacity: position ? 1 : 0,
              }}
              className="max-h-[min(22rem,calc(100vh-1.5rem))] w-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-[0_12px_40px_rgba(15,23,42,0.16)] [scrollbar-width:thin]"
            >
              {members.map((member) => {
                const selected = ids.includes(member.id);
                return (
                  <button
                    key={member.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
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
                        role="option"
                        aria-selected={selected}
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
            </div>,
            document.body,
          )
        : null}
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
  const { lists, listStatuses, workTaskStatuses, tasks: allTasks, updateTask, hideTask, restoreTask, reorderTasks } =
    useLists();
  const [movingTask, setMovingTask] = useState<WorkTask | null>(null);
  const [moveAnchor, setMoveAnchor] = useState<CreateMenuAnchor | null>(null);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const lastSelectedIdRef = useRef<string | null>(null);
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const parentTaskId = useMemo(() => {
    const first = tasks[0];
    if (!first?.parentId) return null;
    return tasks.every((task) => task.parentId === first.parentId)
      ? first.parentId
      : null;
  }, [tasks]);
  const { statuses, colorFor, labelFor } = useTaskStatuses(listId, parentTaskId);
  const { statuses: systemStatuses } = useSystemTaskStatuses();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const matching = useMemo(() => {
    const visible =
      view === "with-archive"
        ? tasks
        : tasks.filter((task) => isTaskActiveInLists(task, statuses));
    const ordered = sortTasksLikeNavTree(visible, statuses);
    if (!groupByStatus) return ordered;
    const known = new Set(statuses.map((status) => status.id));
    const grouped = statusesByPriorityDesc(statuses).flatMap((status) =>
      ordered.filter((task) => task.status === status.id),
    );
    const unmatched = ordered.filter((task) => !known.has(task.status));
    return [...grouped, ...unmatched];
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
  const selectableTasks = displayed.filter(
    (task) => !exitingIds.has(task.id) && !isTaskDeleted(task),
  );
  const selectableIds = useMemo(
    () => selectableTasks.map((task) => task.id),
    [selectableTasks],
  );
  const selectedIdSet = new Set(selectedIds);
  const selectedTasks = selectableTasks.filter((task) =>
    selectedIdSet.has(task.id),
  );
  const allSelectableSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id) => selectedIdSet.has(id));
  const someSelectableSelected = selectedTasks.length > 0;
  const progress = useMemo(() => {
    if (parentTaskId) {
      return (
        workProgressById(allTasks, statuses).get(parentTaskId) ??
        emptyWorkProgress()
      );
    }
    return workProgressFromItems(tasks, statuses);
  }, [allTasks, parentTaskId, statuses, tasks]);

  useEffect(() => {
    const visible = new Set(selectableIds);
    setSelectedIds((current) => {
      const next = current.filter((id) => visible.has(id));
      return next.length === current.length ? current : next;
    });
  }, [selectableIds]);

  useEffect(() => {
    if (selectedIds.length === 0) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setSelectedIds([]);
      lastSelectedIdRef.current = null;
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedIds.length]);

  function toggleSelected(taskId: string, shiftKey = false) {
    const orderedIds = selectableIds;
    if (shiftKey && lastSelectedIdRef.current) {
      const from = orderedIds.indexOf(lastSelectedIdRef.current);
      const to = orderedIds.indexOf(taskId);
      if (from >= 0 && to >= 0) {
        const start = Math.min(from, to);
        const end = Math.max(from, to);
        const range = orderedIds.slice(start, end + 1);
        setSelectedIds((current) => [...new Set([...current, ...range])]);
        lastSelectedIdRef.current = taskId;
        return;
      }
    }
    setSelectedIds((current) =>
      current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId],
    );
    lastSelectedIdRef.current = taskId;
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelectedIds([]);
      lastSelectedIdRef.current = null;
      return;
    }
    setSelectedIds(selectableIds);
    lastSelectedIdRef.current = selectableIds[selectableIds.length - 1] ?? null;
  }

  function accessFor(task: WorkTask) {
    const list = lists.find((item) => item.id === task.listId) ?? null;
    return resolveEffectiveListAccess(list, currentUser, roles, isAdmin, {
      isAssignee: userIsAssignee(task.assigneeIds, currentUser),
    });
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
      workTaskStatuses,
      activeTask.parentId,
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
    const listName = lists.find((item) => item.id === task.listId)?.name ?? null;
    const locationSegments = getSubtaskLocationSegments(allTasks, task, listName, {
      includeListName: showListName,
    });
    return (
      <SortableSubtaskRow
        key={task.id}
        listId={task.listId}
        parentTaskId={parentTaskId}
        task={task}
        exiting={exitingIds.has(task.id)}
        reorderable={reorderable}
        locationSegments={locationSegments}
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
        selectLabel={t("subtasks.select", "Iezīmēt")}
        selected={selectedIdSet.has(task.id)}
        selectionActive={someSelectableSelected}
        onToggleSelect={(shiftKey) => toggleSelected(task.id, shiftKey)}
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
          ? `w-full overflow-x-auto overflow-y-clip ${someSelectableSelected ? "pb-16" : ""}`
          : `w-full overflow-x-auto overflow-y-clip rounded-2xl border border-zinc-200 bg-white ${
              someSelectableSelected ? "pb-16" : ""
            }`
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
          className="group/table w-full table-fixed text-left text-sm"
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
            <tr className="group/row border-b border-zinc-100 text-[12px] font-medium whitespace-nowrap text-zinc-400">
              <th className="py-1.5 pr-1 pl-3">
                {selectableIds.length > 0 ? (
                  <SubtaskSelectCheckbox
                    checked={allSelectableSelected}
                    mixed={someSelectableSelected && !allSelectableSelected}
                    visible={someSelectableSelected}
                    className="group-hover/table:opacity-100"
                    label={t("subtasks.bulk.select_all", "Iezīmēt visus")}
                    onToggle={() => toggleSelectAll()}
                  />
                ) : null}
              </th>
              <th className="px-2 py-1.5 font-medium">
                <span className="inline-flex items-center gap-2">
                  {t("tasks.fields.title", "Nosaukums")}
                  <WorkProgressLabel progress={progress} />
                </span>
              </th>
              <th className="px-3 py-1.5 font-medium">
                {t("todo.fields.assignee", "Atbildīgais")}
              </th>
              <th className="px-3 py-1.5 font-medium">
                {t("tasks.fields.start_date", "Sākums")}
              </th>
              <th className="px-3 py-1.5 font-medium">
                {t("todo.fields.due_date", "Termiņš")}
              </th>
              <th className="px-3 py-1.5 font-medium">
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
    <SubtaskBulkBar
      tasks={selectedTasks}
      onClear={() => {
        setSelectedIds([]);
        lastSelectedIdRef.current = null;
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
  parentTaskId = null,
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
  selectLabel,
  selected,
  selectionActive,
  onToggleSelect,
  canEdit,
  canChangeStatus,
  exiting,
  moveOpen = false,
  reorderable = true,
  locationSegments = [],
}: {
  listId: string;
  parentTaskId?: string | null;
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
  selectLabel: string;
  selected: boolean;
  selectionActive: boolean;
  onToggleSelect: (shiftKey: boolean) => void;
  canEdit: boolean;
  canChangeStatus: boolean;
  exiting: boolean;
  moveOpen?: boolean;
  reorderable?: boolean;
  locationSegments?: TaskLocationSegment[];
}) {
  const { t } = useTranslations();
  const { taskFiles } = useLists();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const checklistsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.checklist);
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const hasAttachments =
    fileUploadsEnabled && taskFiles(task.id).length > 0;
  const { colorFor, statuses, groupKeyFor } = useTaskStatuses(listId, parentTaskId);
  const deleted = isTaskDeleted(task);
  const closed = isClosedTaskStatus(task.status, statuses);
  const statusGroupRaw = groupKeyFor(task.status);
  const statusGroup: ListStatusGroup = isListStatusGroup(statusGroupRaw)
    ? statusGroupRaw
    : "active";
  const rowTint = deleted
    ? fadeHexColor("#ef4444", 0.88)
    : closed
      ? fadeHexColor(colorFor(task.status) ?? "#10b981", 0.88)
      : null;
  const canDrag =
    !exiting && ((reorderable && canEdit) || canChangeStatus);
  const checklistsProgress = checklistsEnabled
    ? checklistProgress(task.checklists ?? [])
    : { done: 0, total: 0, percent: 0 };
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
        backgroundColor:
          isDragging || selected ? undefined : rowTint ?? undefined,
      }}
      className={`group/row border-b border-zinc-100 last:border-b-0 ${
        selected
          ? "bg-emerald-50 hover:bg-emerald-50/90"
          : rowTint && !isDragging
            ? "hover:brightness-[0.97]"
            : "hover:bg-zinc-50/80"
      } ${
        isDragging ? "relative z-10 bg-white opacity-40 shadow-sm" : ""
      } ${exiting ? "subtask-row-exit" : ""}`}
    >
      <td className="py-1.5 pr-1 pl-3">
        <div className="flex items-center gap-1">
          {deleted ? (
            <span className="size-4 shrink-0" />
          ) : (
            <SubtaskSelectCheckbox
              checked={selected}
              visible={selected || selectionActive}
              label={selectLabel}
              onToggle={onToggleSelect}
            />
          )}
          <StatusReorderHandle
            status={task.status}
            listId={listId}
            parentTaskId={parentTaskId}
            label={dragLabel}
            attributes={attributes}
            listeners={listeners}
            canDrag={canDrag}
            isDragging={isDragging}
          />
        </div>
      </td>
      <td className="min-w-0 px-2 py-1.5">
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
          className={`flex w-full min-w-0 items-center gap-1.5 text-left font-medium hover:text-blue-700 ${
            deleted ? "text-zinc-400 line-through" : "text-zinc-900"
          }`}
        >
          <span className="truncate">{task.title}</span>
          {hasAttachments ? (
            <i
              className="fas fa-paperclip shrink-0 text-[11px] text-zinc-400"
              aria-hidden="true"
              title={t("subtasks.attachments.title", "Pielikumi")}
            />
          ) : null}
        </button>
        {locationSegments.length > 0 ? (
          <TaskLocationPath
            segments={locationSegments}
            align="left"
            className="mt-0.5"
          />
        ) : null}
      </td>
      <td className="px-3 py-1.5">
        <AssigneeCell task={task} disabled={!canEdit || deleted} />
      </td>
      <td className="px-3 py-1.5">
        <DateCell
          value={task.startDate}
          emptyLabel={t("tasks.fields.start_date", "Sākums")}
          disabled={!canEdit || deleted}
          fieldKind="start"
          statusGroup={statusGroup}
          onChange={(startDate) => onUpdate(task.id, { startDate })}
        />
      </td>
      <td className="px-3 py-1.5">
        <DateCell
          value={task.dueDate}
          emptyLabel={t("todo.fields.due_date", "Termiņš")}
          disabled={!canEdit || deleted}
          fieldKind="due"
          statusGroup={statusGroup}
          onChange={(dueDate) => onUpdate(task.id, { dueDate })}
        />
      </td>
      <td className="whitespace-nowrap px-3 py-1.5">
        <StatusControl
          listId={listId}
          parentTaskId={parentTaskId}
          status={task.status}
          statusChangedAt={
            deleted
              ? task.deletedAt
              : task.statusChangedAt ?? task.createdAt ??
                null
          }
          deleted={deleted}
          disabled={!canChangeStatus}
          completeBlocked={
            checklistsEnabled && taskHasIncompleteChecklists(task.checklists)
          }
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
