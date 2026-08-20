"use client";

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
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useId, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { AssigneeFaces } from "@/app/components/assignee-faces";
import { DragHandle, StatusReorderHandle } from "@/app/components/drag-handle";
import {
  SortableTaskGroup,
  SortableTaskItem,
} from "@/app/components/sortable-task-group";
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
import { statusClassName, statusTextClassName } from "@/app/components/status-control";
import {
  useSystemTaskStatuses,
  useTaskStatuses,
} from "@/app/lib/task-statuses";
import { OptionalTooltip, Tooltip } from "@/app/components/tooltip";
import { LoadingState } from "@/app/components/loading-state";
import { FileIcon } from "@/app/components/file-icon";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  addStoredListFile,
  childListFiles,
  filePageHref,
  nextItemSortOrder,
  type ListFile,
} from "@/app/lib/list-files";
import { useFileTypes } from "@/app/lib/file-types-context";
import {
  DEFAULT_LIST_WINDOW_ORDER,
  readListWindowOrder,
  writeListWindowOrder,
  type ListWindowId,
} from "@/app/lib/list-windows";
import {
  compareTasksByStatusPriority,
  mergeStatusCatalog,
  resolveStatusIdForTask,
  statusesByPriorityDesc,
} from "@/app/lib/list-statuses";
import {
  getDescendantSubtasks,
  getDescendantWorkItems,
  isClosedTaskStatus,
  isTaskDeleted,
  isWorkFolder,
  taskProgress,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { googleDrivePathForListFile } from "@/app/lib/google-drive/path";
import { queueGoogleDriveUpload } from "@/app/lib/google-drive/queue-upload";
import { queueOneDriveUpload } from "@/app/lib/onedrive/queue-upload";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";
import { hasTeamActionPermission } from "@/app/lib/team";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  resolveEffectiveListAccess,
  userIsAssignee,
} from "@/app/lib/list-access";
import { taskHasIncompleteChecklists } from "@/app/lib/task-checklists";

function isListedInWindow(
  item: WorkTask,
  statuses: { id: string; groupKey: string }[] | undefined,
  archiveOpen: boolean,
): boolean {
  if (isTaskDeleted(item)) return false;
  if (isWorkFolder(item)) return true;
  if (archiveOpen) return true;
  return !isClosedTaskStatus(item.status, statuses);
}

function ArchiveToggle({
  pressed,
  onPressedChange,
}: {
  pressed: boolean;
  onPressedChange: (next: boolean) => void;
}) {
  const { t } = useTranslations();
  const label = t("subtasks.archive", "Arhīvs");
  return (
    <Tooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={() => onPressedChange(!pressed)}
        className={`inline-flex size-7 shrink-0 items-center justify-center rounded-lg transition ${
          pressed
            ? "bg-zinc-200 text-zinc-800"
            : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
      >
        <i className="fas fa-archive text-[11px]" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}

function WindowCard({
  id,
  title,
  icon,
  action,
  className = "",
  children,
}: {
  id: ListWindowId;
  title: string;
  icon: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const { t } = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <section
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`flex min-h-[16rem] flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm ${
        isDragging ? "z-10 shadow-lg ring-2 ring-blue-200" : ""
      } ${className}`.trim()}
    >
      <header className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
        <DragHandle
          label={t("lists.windows.drag", "Pārvietot logu")}
          attributes={attributes}
          listeners={listeners}
        />
        <i className={`${icon} text-[12px] text-zinc-400`} aria-hidden="true" />
        <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
          {title}
        </h2>
        {action}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  );
}

function TasksWindowItem({
  listId,
  task,
  nested = false,
  archiveOpen,
}: {
  listId: string;
  task: WorkTask;
  nested?: boolean;
  archiveOpen: boolean;
}) {
  const { t } = useTranslations();
  const { tasks: allTasks, childTasks, subtasks } = useLists();
  const { statuses } = useTaskStatuses(listId);
  const folder = isWorkFolder(task);
  const nestedItems = folder
    ? childTasks(task.id).filter((item) =>
        isListedInWindow(item, statuses, archiveOpen),
      )
    : [];
  const childCount = folder
    ? getDescendantWorkItems(allTasks, task.id).filter(
        (item) =>
          item.kind === "task" && isListedInWindow(item, statuses, archiveOpen),
      ).length
    : subtasks(task.id).filter((item) =>
        isListedInWindow(item, statuses, archiveOpen),
      ).length;
  const closed = isClosedTaskStatus(task.status, statuses);

  return (
    <div>
      <Link
        href={`/lists/${listId}/tasks/${task.id}`}
        className="flex min-w-0 flex-1 items-start gap-2 rounded-lg px-1 py-1"
      >
        <i
          className={`${folder ? "far fa-folder" : "fas fa-list-check"} mt-0.5 text-[12px] text-zinc-400`}
          aria-hidden="true"
        />
        <span className="min-w-0">
          <OptionalTooltip label={task.description} className="max-w-full">
            <span
              className={`block truncate text-sm font-medium ${
                closed ? "text-zinc-400 line-through" : "text-zinc-900"
              }`}
            >
              {task.title}
            </span>
          </OptionalTooltip>
          <span className="mt-0.5 block text-[12px] text-zinc-400">
            {folder
              ? t("lists.task_count", "{count} uzdevumi", { count: childCount })
              : t("tasks.subtask_count", "{count} apakšuzdevumi", {
                  count: childCount,
                })}
          </span>
        </span>
      </Link>
      {nestedItems.length > 0 ? (
        <ul className={nested ? "mt-0.5 space-y-0.5 pl-4" : "mt-1 space-y-0.5 pl-5"}>
          {nestedItems.map((child) => (
            <li key={child.id}>
              <TasksWindowItem
                listId={listId}
                task={child}
                nested
                archiveOpen={archiveOpen}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function TasksWindow({
  listId,
  tasks,
  archiveOpen,
  contextId,
}: {
  listId: string;
  tasks: WorkTask[];
  archiveOpen: boolean;
  contextId: string;
}) {
  const { t } = useTranslations();

  if (tasks.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </p>
    );
  }

  const canReorder = tasks.length > 1;

  return (
    <SortableTaskGroup
      itemIds={tasks.map((task) => task.id)}
      contextId={contextId}
    >
      <ul className="space-y-1.5">
        {tasks.map((task) => (
          <SortableTaskItem key={task.id} id={task.id} as="li" disabled={!canReorder}>
            {({ attributes, listeners, isDragging }) => (
              <div
                className={`flex items-start gap-1 rounded-xl px-1 py-1 transition ${
                  isDragging ? "bg-zinc-50 shadow-sm ring-1 ring-blue-200" : "hover:bg-zinc-50"
                }`}
              >
                {canReorder ? (
                  <span
                    className="mt-0.5"
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <DragHandle
                      label={t("subtasks.drag", "Mainīt secību")}
                      attributes={attributes}
                      listeners={listeners}
                    />
                  </span>
                ) : null}
                <div className="min-w-0 flex-1">
                  <TasksWindowItem
                    listId={listId}
                    task={task}
                    archiveOpen={archiveOpen}
                  />
                </div>
              </div>
            )}
          </SortableTaskItem>
        ))}
      </ul>
    </SortableTaskGroup>
  );
}

function FilesWindow({
  listId,
  files,
  loading,
}: {
  listId: string;
  files: ListFile[];
  loading?: boolean;
}) {
  const { t } = useTranslations();

  if (loading) {
    return <LoadingState compact className="justify-center py-8" />;
  }

  if (files.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {t("lists.windows.files_empty", "Šajā sarakstā vēl nav failu.")}
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {files.map((file) => (
        <li key={file.id}>
          <Link
            href={filePageHref(listId, file.id)}
            className="flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-zinc-50"
          >
            <FileIcon name={file.name} className="w-4 text-center text-[13px]" />
            <span className="truncate text-sm font-medium text-zinc-900">
              {file.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OverviewStatusHeader({
  statusId,
  label,
  count,
  color,
}: {
  statusId: string;
  label: string;
  count: number;
  color: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: statusGroupDropId(statusId),
  });
  return (
    <div
      ref={setNodeRef}
      className={`mb-1 flex items-center gap-2 px-1 ${isOver ? "rounded-md bg-emerald-50" : ""}`}
    >
      <span
        className={`inline-flex min-h-5 items-center rounded-md px-1.5 text-[10px] font-semibold tracking-wide uppercase ${
          color ? "text-white" : statusClassName("todo")
        }`}
        style={color ? { backgroundColor: color } : undefined}
      >
        {label}
      </span>
      <span className="text-[11px] text-zinc-400">{count}</span>
    </div>
  );
}

function OverviewSubtaskRow({
  listId,
  task,
  canDrag,
  canToggle,
  checklistBlocked,
  onOpen,
  onComplete,
}: {
  listId: string;
  task: WorkTask;
  canDrag: boolean;
  canToggle: boolean;
  checklistBlocked: boolean;
  onOpen: () => void;
  onComplete: () => void;
}) {
  const { t } = useTranslations();
  const { colorFor, statuses } = useTaskStatuses(listId);
  const done = isClosedTaskStatus(task.status, statuses);
  const statusColor = colorFor(task.status);
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

  const handleLabel = checklistBlocked
    ? t(
        "subtasks.checklist.incomplete",
        "Vispirms izpildi visus kontrolsaraksta punktus.",
      )
    : canDrag
      ? t("subtasks.drag", "Mainīt secību")
      : done
        ? task.title
        : t("status.complete_ask", "Pabeidzi?");

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group/row flex min-w-0 items-center gap-2 ${
        isDragging ? "relative z-10 opacity-40" : ""
      }`}
    >
      <StatusReorderHandle
        status={task.status}
        listId={listId}
        label={handleLabel}
        attributes={attributes}
        listeners={listeners}
        canDrag={canDrag}
        isDragging={isDragging}
        pressed={done}
        disabled={checklistBlocked && !canDrag}
        onClick={
          canToggle
            ? (event) => {
                event.stopPropagation();
                if (checklistBlocked) return;
                onComplete();
              }
            : undefined
        }
      />
      <button
        type="button"
        onClick={onOpen}
        className={`min-w-0 flex-1 truncate text-left text-[13px] ${
          statusColor ? "" : statusTextClassName(task.status)
        } ${done ? "line-through" : "hover:opacity-80"}`}
        style={statusColor ? { color: statusColor } : undefined}
      >
        {task.title}
      </button>
      <AssigneeFaces assigneeIds={task.assigneeIds} />
    </li>
  );
}

function OverviewSubtaskList({
  listId,
  tasks,
  onOpenSubtask,
}: {
  listId: string;
  tasks: WorkTask[];
  onOpenSubtask: (task: WorkTask) => void;
}) {
  const dndContextId = useId();
  const { lists, listStatuses, updateTask, updateTaskStatus, reorderTasks } =
    useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { statuses, colorFor, labelFor } = useTaskStatuses(listId);
  const { statuses: systemStatuses } = useSystemTaskStatuses();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const checklistsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.checklist);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const list = lists.find((item) => item.id === listId) ?? null;
  const access = resolveEffectiveListAccess(list, currentUser, roles, isAdmin);
  const groups = statusesByPriorityDesc(statuses)
    .map((status) => ({
      status,
      items: tasks.filter((task) => task.status === status.id),
    }))
    .filter((group) => group.items.length > 0);
  const closedStatusId =
    [...statuses].reverse().find((status) => status.groupKey === "closed")
      ?.id ?? "done";
  const openStatusId =
    statuses.find((status) => status.groupKey === "not_started")?.id ?? "todo";

  function handleDragEnd(event: DragEndEvent) {
    const hint = dropHintFromEvent(event);
    setDropHint(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeTask = tasks.find((task) => task.id === active.id);
    if (!activeTask) return;
    const canDragStatus =
      access.canEditTasks ||
      (access.canComment && userIsAssignee(activeTask.assigneeIds, currentUser));
    const canDragOrder = access.canEditTasks;
    if (!canDragStatus && !canDragOrder) return;

    const headerStatusId = parseStatusGroupDropId(over.id);
    const overTask = headerStatusId
      ? null
      : tasks.find((task) => task.id === over.id);
    if (!headerStatusId && !overTask) return;
    const targetStatusId = headerStatusId ?? overTask?.status;
    if (!targetStatusId) return;
    const resolvedStatus = resolveStatusIdForTask(
      targetStatusId,
      mergeStatusCatalog(systemStatuses, listStatuses, listId),
      statuses,
    );
    if (!resolvedStatus) return;
    const edge = hint?.edge ?? "before";

    if (resolvedStatus !== activeTask.status) {
      if (!canDragStatus) return;
      updateTask(activeTask.id, {
        status: resolvedStatus as WorkTaskStatus,
      });
      if (canDragOrder) {
        const targetIds = tasks
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

    if (!canDragOrder) return;
    const groupIds = tasks
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

  if (tasks.length === 0) return null;

  return (
    <div
      className="mt-2"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DndContext
        id={dndContextId}
        sensors={sensors}
        collisionDetection={groupedStatusCollisionDetection}
        onDragStart={() => setDropHint(null)}
        onDragMove={(event) => setDropHint(dropHintFromEvent(event))}
        onDragOver={(event) => setDropHint(dropHintFromEvent(event))}
        onDragCancel={() => setDropHint(null)}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-3">
          {groups.map((group) => {
            const groupColor = colorFor(group.status.id);
            const groupIds = group.items.map((task) => task.id);
            return (
              <div key={group.status.id}>
                <OverviewStatusHeader
                  statusId={group.status.id}
                  label={labelFor(group.status.id) || group.status.label}
                  count={group.items.length}
                  color={groupColor}
                />
                <SortableContext
                  items={groupIds}
                  strategy={frozenSortingStrategy}
                >
                  <ul className="space-y-1">
                    {group.items.map((task) => {
                      const done = isClosedTaskStatus(task.status, statuses);
                      const checklistBlocked =
                        checklistsEnabled &&
                        !done &&
                        taskHasIncompleteChecklists(task.checklists);
                      const canToggle =
                        access.canEditTasks ||
                        (access.canComment &&
                          userIsAssignee(task.assigneeIds, currentUser));
                      return (
                        <OverviewSubtaskRow
                          key={task.id}
                          listId={listId}
                          task={task}
                          canDrag={access.canEditTasks}
                          canToggle={canToggle}
                          checklistBlocked={checklistBlocked}
                          onOpen={() => onOpenSubtask(task)}
                          onComplete={() =>
                            updateTaskStatus(
                              task.id,
                              (done
                                ? openStatusId
                                : closedStatusId) as WorkTaskStatus,
                            )
                          }
                        />
                      );
                    })}
                  </ul>
                </SortableContext>
              </div>
            );
          })}
        </div>
        {dropHint ? <TaskDropLine hint={dropHint} /> : null}
      </DndContext>
    </div>
  );
}

function OverviewItem({
  listId,
  task,
  nested = false,
  archiveOpen = false,
  onArchiveOpenChange,
  onOpenSubtask,
}: {
  listId: string;
  task: WorkTask;
  nested?: boolean;
  archiveOpen?: boolean;
  onArchiveOpenChange?: (next: boolean) => void;
  onOpenSubtask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { tasks: allTasks, childTasks, subtasks } = useLists();
  const { statuses } = useTaskStatuses(listId);
  const folder = isWorkFolder(task);
  const nestedAll = folder
    ? childTasks(task.id).filter((item) => !isTaskDeleted(item))
    : [];
  const nestedItems = nestedAll
    .filter((item) => isListedInWindow(item, statuses, archiveOpen))
    .slice()
    .sort((left, right) =>
      compareTasksByStatusPriority(left, right, statuses),
    );
  const children = folder
    ? getDescendantSubtasks(allTasks, task.id)
    : subtasks(task.id);
  const visibleChildren = children
    .filter((item) => isListedInWindow(item, statuses, archiveOpen))
    .slice()
    .sort((left, right) =>
      compareTasksByStatusPriority(left, right, statuses),
    );
  const progress = taskProgress(task, children);
  const closed = isClosedTaskStatus(task.status, statuses);

  return (
    <div className={nested ? "min-w-0" : undefined}>
      <div className="flex items-center justify-between gap-2">
        <Link
          href={`/lists/${listId}/tasks/${task.id}`}
          className="min-w-0 flex-1"
        >
          <OptionalTooltip label={task.description} className="min-w-0">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              {folder ? (
                <i
                  className="far fa-folder shrink-0 text-[11px] text-zinc-400"
                  aria-hidden="true"
                />
              ) : nested ? (
                <i
                  className="fas fa-list-check shrink-0 text-[11px] text-zinc-400"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={`truncate text-sm font-medium ${
                  closed ? "text-zinc-400 line-through" : "text-zinc-900"
                }`}
              >
                {task.title}
              </span>
            </span>
          </OptionalTooltip>
        </Link>
        <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
          {t("lists.windows.progress", "{done}/{total}", {
            done: progress.done,
            total: progress.total,
          })}
        </span>
        {nested ? null : (
          <ArchiveToggle
            pressed={archiveOpen}
            onPressedChange={(next) => onArchiveOpenChange?.(next)}
          />
        )}
      </div>
      <Link href={`/lists/${listId}/tasks/${task.id}`} className="mt-2 block">
        <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </Link>
      {folder ? (
        nestedItems.length > 0 ? (
          <ul className="mt-2 space-y-3">
            {nestedItems.map((child) => (
              <li key={child.id}>
                <OverviewItem
                  listId={listId}
                  task={child}
                  nested
                  archiveOpen={archiveOpen}
                  onOpenSubtask={onOpenSubtask}
                />
              </li>
            ))}
          </ul>
        ) : nestedAll.length === 0 ? (
          <p className="mt-2 text-[13px] text-zinc-400">
            {t("folders.empty", "Šajā mapē vēl nav uzdevumu.")}
          </p>
        ) : null
      ) : visibleChildren.length > 0 ? (
        <OverviewSubtaskList
          listId={listId}
          tasks={visibleChildren}
          onOpenSubtask={onOpenSubtask}
        />
      ) : null}
    </div>
  );
}

function OverviewWindow({
  listId,
  tasks,
  onOpenSubtask,
  overviewArchiveById,
  onOverviewArchiveChange,
}: {
  listId: string;
  tasks: WorkTask[];
  onOpenSubtask: (task: WorkTask) => void;
  overviewArchiveById: Record<string, boolean>;
  onOverviewArchiveChange: (taskId: string, next: boolean) => void;
}) {
  const { t } = useTranslations();
  const { statuses } = useTaskStatuses(listId);
  const orderedTasks = tasks
    .slice()
    .sort((left, right) =>
      compareTasksByStatusPriority(left, right, statuses),
    );

  if (tasks.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
      {orderedTasks.map((task) => (
        <li key={task.id} className="min-w-0 rounded-xl bg-zinc-50 px-3 py-2.5">
          <OverviewItem
            listId={listId}
            task={task}
            archiveOpen={overviewArchiveById[task.id] ?? false}
            onArchiveOpenChange={(next) => onOverviewArchiveChange(task.id, next)}
            onOpenSubtask={onOpenSubtask}
          />
        </li>
      ))}
    </ul>
  );
}

export function ListWindowsBoard({
  listId,
  tasks,
  parentId = null,
  onOpenSubtask,
}: {
  listId: string;
  tasks: WorkTask[];
  parentId?: string | null;
  onOpenSubtask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { accept, filterAllowedFiles, extensionsLabel } = useFileTypes();
  const { lists } = useLists();
  const { currentTeam, currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const googleDriveEnabled =
    fileUploadsEnabled && isModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive);
  const onedriveEnabled =
    fileUploadsEnabled && isModuleEnabled(FRONTEND_MODULE_KEYS.onedrive);
  const list = lists.find((item) => item.id === listId) ?? null;
  const windowOrderKey = parentId ?? listId;
  const canUploadFiles = Boolean(
    fileUploadsEnabled &&
      list &&
      resolveEffectiveListAccess(list, currentUser, roles, isAdmin)
        .canCreateTasks &&
      hasTeamActionPermission(currentUser, roles, isAdmin, "files.upload"),
  );
  const [order, setOrder] = useState<ListWindowId[]>(DEFAULT_LIST_WINDOW_ORDER);
  const [tasksArchiveOpen, setTasksArchiveOpen] = useState(false);
  const [overviewArchiveById, setOverviewArchiveById] = useState<
    Record<string, boolean>
  >({});
  const allFilesHook = useListFiles();
  const allFiles = allFilesHook.files;
  const filesReady = allFilesHook.isReady;
  const files = childListFiles(allFiles, listId, parentId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setOrder(readListWindowOrder(windowOrderKey));
  }, [windowOrderKey]);

  function handleTasksArchiveChange(next: boolean) {
    setTasksArchiveOpen(next);
    setOverviewArchiveById((current) => {
      const updated = { ...current };
      for (const task of tasks) {
        updated[task.id] = next;
      }
      return updated;
    });
  }

  function handleOverviewArchiveChange(taskId: string, next: boolean) {
    setOverviewArchiveById((current) => ({ ...current, [taskId]: next }));
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!canUploadFiles) return;
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    const { allowed, rejected } = filterAllowedFiles(selected);
    if (rejected.length > 0) {
      showFeedback({
        type: "error",
        text: t(
          "files.upload.rejected",
          "Neatļauts faila tips. Atļautie: {types}",
          { types: extensionsLabel },
        ),
      });
    }
    if (allowed.length === 0) return;
    let nextOrder = nextItemSortOrder([
      ...tasks,
      ...childListFiles(allFiles, listId, parentId),
    ]);
    for (const file of allowed) {
      const stored = await addStoredListFile(listId, file, parentId, nextOrder);
      if (!stored) continue;
      nextOrder += 1;
      if (googleDriveEnabled) {
        queueGoogleDriveUpload({
          teamId: currentTeam?.id,
          file,
          pathParts: googleDrivePathForListFile({
            lists,
            tasks,
            listId,
            parentId,
          }),
        });
      }
      if (onedriveEnabled) {
        queueOneDriveUpload({
          teamId: currentTeam?.id,
          file,
          pathParts: googleDrivePathForListFile({
            lists,
            tasks,
            listId,
            parentId,
          }),
        });
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((current) => {
      const oldIndex = current.indexOf(active.id as ListWindowId);
      const newIndex = current.indexOf(over.id as ListWindowId);
      if (oldIndex < 0 || newIndex < 0) return current;
      const next = arrayMove(current, oldIndex, newIndex);
      writeListWindowOrder(windowOrderKey, next);
      return next;
    });
  }

  const windows: Record<ListWindowId, ReactNode> = {
    tasks: (
      <WindowCard
        key="tasks"
        id="tasks"
        title={t("lists.windows.tasks", "Uzdevumi")}
        icon="fas fa-list-check"
        action={
          <ArchiveToggle
            pressed={tasksArchiveOpen}
            onPressedChange={handleTasksArchiveChange}
          />
        }
      >
        <TasksWindow
          listId={listId}
          tasks={tasks}
          archiveOpen={tasksArchiveOpen}
          contextId={`list-tasks-${windowOrderKey}`}
        />
      </WindowCard>
    ),
    files: (
      <WindowCard
        key="files"
        id="files"
        title={t("lists.windows.files", "Faili")}
        icon="fas fa-paperclip"
        action={
          canUploadFiles ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={handleUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={t("create.file.upload_title", "Augšupielādēt failu")}
            >
              <i className="fas fa-plus text-[11px]" aria-hidden="true" />
            </button>
          </>
          ) : undefined
        }
      >
        <FilesWindow listId={listId} files={files} loading={!filesReady} />
      </WindowCard>
    ),
    overview: (
      <WindowCard
        key="overview"
        id="overview"
        title={t("lists.windows.overview", "Saraksts")}
        icon="fas fa-layer-group"
      >
        <OverviewWindow
          listId={listId}
          tasks={tasks}
          onOpenSubtask={onOpenSubtask}
          overviewArchiveById={overviewArchiveById}
          onOverviewArchiveChange={handleOverviewArchiveChange}
        />
      </WindowCard>
    ),
  };

  const visibleOrder = fileUploadsEnabled
    ? order
    : order.filter((id) => id !== "files");

  return (
    <>
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={visibleOrder} strategy={rectSortingStrategy}>
        <div className="flex flex-col gap-4">
          <div
            className={
              fileUploadsEnabled
                ? "grid gap-4 md:grid-cols-2"
                : "grid gap-4"
            }
          >
            {visibleOrder
              .filter((id) => id !== "overview")
              .map((id) => windows[id])}
          </div>
          {windows.overview}
        </div>
      </SortableContext>
    </DndContext>
    </>
  );
}
