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
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type ReactNode,
} from "react";
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
import { statusClassName, statusTextClassName, useStatusLabels } from "@/app/components/status-control";
import {
  useSystemTaskStatuses,
  useTaskStatuses,
} from "@/app/lib/task-statuses";
import { WorkProgressBar, WorkProgressLabel } from "@/app/components/work-progress";
import { OptionalTooltip, Tooltip } from "@/app/components/tooltip";
import { LoadingState } from "@/app/components/loading-state";
import { RelativeTime } from "@/app/components/relative-time";
import { UserAvatar } from "@/app/components/user-avatar";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import {
  FileUploadOverlay,
  type FileUploadProgressState,
} from "@/app/components/file-upload-overlay";
import { FileIcon } from "@/app/components/file-icon";
import { VirtualWindow } from "@/app/components/virtual-window";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { assigneeDisplayNames } from "@/app/lib/assignees";
import { fetchTaskActivitiesForTaskIds } from "@/app/lib/db/work-data";
import { formatTaskActivityText } from "@/app/lib/format-task-activity-text";
import {
  addStoredListFile,
  childListFiles,
  formatFileSize,
  nextItemSortOrder,
  type ListFile,
} from "@/app/lib/list-files";
import { useFileViewer } from "@/app/components/file-viewer-provider";
import { useFileTypes } from "@/app/lib/file-types-context";
import {
  DEFAULT_LIST_WINDOW_ORDER,
  readListWindowOrder,
  writeListWindowOrder,
  type ListWindowId,
} from "@/app/lib/list-windows";
import {
  groupTasksByStatus,
  mergeKnownStatusCatalogs,
  mergeStatusCatalog,
  resolveStatusIdForTask,
  sortTasksLikeNavTree,
} from "@/app/lib/list-statuses";
import {
  collectTaskSubtreeIds,
  getDescendantSubtasks,
  getDescendantWorkItems,
  isClosedTaskStatus,
  isTaskDeleted,
  isWorkFolder,
  isWorkSubtask,
  taskProgress,
  workProgressById,
  type WorkProgress,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { googleDrivePathForListFile } from "@/app/lib/google-drive/path";
import { useTeamCloudStorage } from "@/app/lib/cloud-storage/context";
import { uploadFileToTeamCloud } from "@/app/lib/cloud-storage/queue-upload";
import { filesRequireCloudFallback } from "@/app/lib/cloud-storage/message-key";
import { batchUploadPercent } from "@/app/lib/google-drive/queue-upload";
import type { TaskActivity, TaskFile } from "@/app/lib/task-activity";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";
import {
  canViewAttachments,
  canViewSubtaskArchive,
  hasTeamActionPermission,
} from "@/app/lib/team";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  resolveEffectiveListAccess,
  userIsAssignee,
} from "@/app/lib/list-access";
import { taskHasIncompleteChecklists } from "@/app/lib/task-checklists";

const FOLDER_HISTORY_PAGE_SIZE = 80;

function isListedInWindow(
  item: WorkTask,
  statuses: { id: string; groupKey: string }[] | undefined,
  archiveOpen = false,
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
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onPressedChange(!pressed);
        }}
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

function WindowPanel({
  title,
  icon,
  action,
  className = "",
  dragHandle,
  sectionRef,
  style,
  isDragging = false,
  children,
}: {
  title: string;
  icon: string;
  action?: ReactNode;
  className?: string;
  dragHandle?: ReactNode;
  sectionRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  isDragging?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      ref={sectionRef}
      style={style}
      className={`flex min-h-[16rem] min-w-0 w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ${
        isDragging ? "z-10 shadow-lg ring-2 ring-blue-200" : ""
      } ${className}`.trim()}
    >
      <header className="flex items-center gap-2 border-b border-zinc-100 px-3 py-2.5">
        {dragHandle}
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
    <WindowPanel
      title={title}
      icon={icon}
      action={action}
      className={className}
      sectionRef={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      isDragging={isDragging}
      dragHandle={
        <DragHandle
          label={t("lists.windows.drag", "Pārvietot logu")}
          attributes={attributes}
          listeners={listeners}
        />
      }
    >
      {children}
    </WindowPanel>
  );
}

function TasksWindowItem({
  listId,
  task,
  nested = false,
  archiveOpen = false,
  progressById,
}: {
  listId: string;
  task: WorkTask;
  nested?: boolean;
  archiveOpen?: boolean;
  progressById: Map<string, WorkProgress>;
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
  const progress = progressById.get(task.id);

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
        <span className="min-w-0 flex-1">
          <OptionalTooltip label={task.description} className="max-w-full">
            <span
              className={`block truncate text-sm font-medium ${
                closed ? "text-zinc-400 line-through" : "text-zinc-900"
              }`}
            >
              {task.title}
            </span>
          </OptionalTooltip>
          <span className="mt-0.5 flex items-center gap-2 text-[12px] text-zinc-400">
            {folder
              ? t("lists.task_count", "{count} uzdevumi", { count: childCount })
              : t("tasks.subtask_count", "{count} apakšuzdevumi", {
                  count: childCount,
                })}
            {progress ? <WorkProgressLabel progress={progress} /> : null}
          </span>
          {progress ? <WorkProgressBar progress={progress} className="mt-1.5" /> : null}
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
                progressById={progressById}
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
  archiveOpen = false,
  contextId,
  emptyMessage,
}: {
  listId: string;
  tasks: WorkTask[];
  archiveOpen?: boolean;
  contextId: string;
  emptyMessage?: string;
}) {
  const { t } = useTranslations();
  const { tasks: allTasks } = useLists();
  const { statuses } = useTaskStatuses(listId);
  const progressById = useMemo(
    () => workProgressById(allTasks, statuses),
    [allTasks, statuses],
  );

  if (tasks.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {emptyMessage || t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
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
                    progressById={progressById}
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

type FilesWindowEntry =
  | { kind: "list"; file: ListFile }
  | { kind: "task"; file: TaskFile; task: WorkTask };

function FilesWindow({
  entries,
  loading,
  driveHint,
}: {
  entries: FilesWindowEntry[];
  loading?: boolean;
  driveHint?: string | null;
}) {
  const { t } = useTranslations();
  const { openListFile, openTaskFile } = useFileViewer();

  if (loading) {
    return <LoadingState compact className="justify-center py-8" />;
  }

  if (entries.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {driveHint ||
          t("lists.windows.files_empty", "Šajā sarakstā vēl nav failu.")}
      </p>
    );
  }

  return (
    <VirtualWindow
      count={entries.length}
      itemHeight={52}
      threshold={40}
      className="max-h-[28rem] overflow-y-auto"
    >
      {(index) => {
        const entry = entries[index];
        if (entry.kind === "list") {
          return (
            <div key={`list:${entry.file.id}`}>
              <button
                type="button"
                onClick={() => openListFile(entry.file)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-zinc-50"
              >
                <FileIcon
                  name={entry.file.name}
                  className="w-4 text-center text-[13px]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900">
                    {entry.file.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                    {formatFileSize(entry.file.size)}
                  </span>
                </span>
              </button>
            </div>
          );
        }

        const note = entry.file.note?.trim() ?? "";
        return (
          <div key={`task:${entry.file.id}`}>
            <OptionalTooltip label={note} className="w-full" align="start">
              <button
                type="button"
                onClick={() => openTaskFile(entry.file)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-zinc-50"
              >
                <FileIcon
                  name={entry.file.name}
                  className="w-4 text-center text-[13px]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900">
                    {entry.file.name}
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                    {formatFileSize(entry.file.size)}
                    {entry.task.title ? ` - ${entry.task.title}` : ""}
                  </span>
                </span>
                {note ? (
                  <i
                    className="fas fa-note-sticky shrink-0 text-[11px] text-zinc-400"
                    aria-hidden="true"
                  />
                ) : (
                  <i
                    className="fas fa-paperclip shrink-0 text-[11px] text-zinc-400"
                    aria-hidden="true"
                    title={t("subtasks.attachments.title", "Pielikumi")}
                  />
                )}
              </button>
            </OptionalTooltip>
          </div>
        );
      }}
    </VirtualWindow>
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
  statusColor,
  statusGroupKey,
  onOpen,
  onComplete,
}: {
  listId: string;
  task: WorkTask;
  canDrag: boolean;
  canToggle: boolean;
  checklistBlocked: boolean;
  statusColor: string | null;
  statusGroupKey: string;
  onOpen: () => void;
  onComplete: () => void;
}) {
  const { t } = useTranslations();
  const { statuses } = useTaskStatuses(listId, task.parentId);
  const { taskFiles } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const canViewFiles = canViewAttachments(currentUser, roles, isAdmin);
  const hasAttachments =
    fileUploadsEnabled &&
    canViewFiles &&
    taskFiles(task.id).length > 0;
  const done =
    statusGroupKey === "closed" || isClosedTaskStatus(task.status, statuses);
  const resolvedColor = statusColor;
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
        parentTaskId={task.parentId}
        color={resolvedColor}
        groupKey={statusGroupKey}
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
        className={`flex min-w-0 flex-1 items-center gap-1.5 text-left text-[13px] ${
          resolvedColor ? "" : statusTextClassName(task.status)
        } ${done ? "line-through" : "hover:opacity-80"}`}
        style={resolvedColor ? { color: resolvedColor } : undefined}
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
      <AssigneeFaces assigneeIds={task.assigneeIds} />
    </li>
  );
}

function OverviewSubtaskList({
  listId,
  parentTaskId = null,
  tasks,
  includeClosed = false,
  onOpenSubtask,
}: {
  listId: string;
  parentTaskId?: string | null;
  tasks: WorkTask[];
  includeClosed?: boolean;
  onOpenSubtask: (task: WorkTask) => void;
}) {
  const dndContextId = useId();
  const { lists, listStatuses, workTaskStatuses, updateTask, updateTaskStatus, reorderTasks } =
    useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { statuses, colorFor, labelFor } = useTaskStatuses(
    listId,
    parentTaskId,
  );
  const { statuses: systemStatuses } = useSystemTaskStatuses();
  const groupingCatalog = mergeKnownStatusCatalogs(
    statuses,
    systemStatuses,
    listStatuses,
    workTaskStatuses,
  );
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const checklistsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.checklist);
  const [dropHint, setDropHint] = useState<DropHint | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const list = lists.find((item) => item.id === listId) ?? null;
  const access = resolveEffectiveListAccess(list, currentUser, roles, isAdmin);
  const groups = groupTasksByStatus(
    sortTasksLikeNavTree(tasks, groupingCatalog),
    groupingCatalog,
    { includeClosed, mergeByLabel: true },
  );
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
                  label={group.status.label || labelFor(group.status.id)}
                  count={group.items.length}
                  color={group.status.color || groupColor}
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
                          statusColor={group.status.color || groupColor}
                          statusGroupKey={group.status.groupKey}
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
  canViewArchive = false,
  onOpenSubtask,
  progressById,
}: {
  listId: string;
  task: WorkTask;
  nested?: boolean;
  archiveOpen?: boolean;
  onArchiveOpenChange?: (next: boolean) => void;
  canViewArchive?: boolean;
  onOpenSubtask: (task: WorkTask) => void;
  progressById: Map<string, WorkProgress>;
}) {
  const { t } = useTranslations();
  const { tasks: allTasks, childTasks, subtasks } = useLists();
  const folder = isWorkFolder(task);
  const { statuses } = useTaskStatuses(listId, folder ? null : task.id);
  const nestedAll = folder
    ? childTasks(task.id).filter((item) => !isTaskDeleted(item))
    : [];
  const nestedItems = sortTasksLikeNavTree(
    nestedAll.filter((item) => isListedInWindow(item, statuses, archiveOpen)),
    statuses,
  );
  const children = folder
    ? getDescendantSubtasks(allTasks, task.id)
    : subtasks(task.id);
  const visibleChildren = sortTasksLikeNavTree(
    children.filter((item) => isListedInWindow(item, statuses, archiveOpen)),
    statuses,
  );
  const progress = progressById.get(task.id) ?? taskProgress(task, children, statuses);
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
        <WorkProgressLabel progress={progress} />
        {nested || !canViewArchive ? null : (
          <ArchiveToggle
            pressed={archiveOpen}
            onPressedChange={(next) => onArchiveOpenChange?.(next)}
          />
        )}
      </div>
      <Link href={`/lists/${listId}/tasks/${task.id}`} className="mt-2 block">
        <WorkProgressBar progress={progress} />
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
                  progressById={progressById}
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
          parentTaskId={folder ? null : task.id}
          tasks={visibleChildren}
          includeClosed={archiveOpen}
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
  canViewArchive,
  emptyMessage,
}: {
  listId: string;
  tasks: WorkTask[];
  onOpenSubtask: (task: WorkTask) => void;
  overviewArchiveById: Record<string, boolean>;
  onOverviewArchiveChange: (taskId: string, next: boolean) => void;
  canViewArchive: boolean;
  emptyMessage?: string;
}) {
  const { t } = useTranslations();
  const { tasks: allTasks } = useLists();
  const { statuses } = useTaskStatuses(listId);
  const progressById = useMemo(
    () => workProgressById(allTasks, statuses),
    [allTasks, statuses],
  );
  const visibleTasks = tasks.filter((task) =>
    isListedInWindow(
      task,
      statuses,
      canViewArchive && (overviewArchiveById[task.id] ?? false),
    ),
  );
  const orderedTasks = sortTasksLikeNavTree(visibleTasks, statuses);

  if (visibleTasks.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {emptyMessage || t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </p>
    );
  }

  return (
    <ul className="grid min-w-0 gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
      {orderedTasks.map((task) => (
        <li key={task.id} className="min-w-0 rounded-xl bg-zinc-50 px-3 py-2.5">
          <OverviewItem
            listId={listId}
            task={task}
            archiveOpen={canViewArchive && (overviewArchiveById[task.id] ?? false)}
            onArchiveOpenChange={(next) => onOverviewArchiveChange(task.id, next)}
            canViewArchive={canViewArchive}
            onOpenSubtask={onOpenSubtask}
            progressById={progressById}
          />
        </li>
      ))}
    </ul>
  );
}

function FolderHistoryWindow({
  listId,
  parentId,
  onOpenSubtask,
}: {
  listId: string;
  parentId: string | null;
  onOpenSubtask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { tasks: allTasks } = useLists();
  const { members, roles, duties } = useTeam();
  const statusLabel = useStatusLabels();
  const { labelFor } = useTaskStatuses(listId, parentId);
  const taskIds = useMemo(() => {
    if (!parentId) {
      return allTasks
        .filter((task) => task.listId === listId && !isTaskDeleted(task))
        .map((task) => task.id);
    }
    return collectTaskSubtreeIds(allTasks, parentId).filter(
      (id) => id !== parentId,
    );
  }, [allTasks, listId, parentId]);
  const tasksById = useMemo(() => {
    const map = new Map<string, WorkTask>();
    for (const task of allTasks) map.set(task.id, task);
    return map;
  }, [allTasks]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActivities([]);
    setHasMore(false);
    void fetchTaskActivitiesForTaskIds(taskIds, FOLDER_HISTORY_PAGE_SIZE)
      .then((items) => {
        if (cancelled) return;
        setActivities(items);
        setHasMore(items.length >= FOLDER_HISTORY_PAGE_SIZE);
      })
      .catch(() => {
        if (cancelled) return;
        setActivities([]);
        setHasMore(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskIds]);

  function historyStatusName(statusId: string | undefined) {
    if (!statusId) return "—";
    const catalogLabel = labelFor(statusId);
    if (catalogLabel && catalogLabel !== statusId) return catalogLabel;
    return statusLabel[statusId as WorkTaskStatus] || catalogLabel || "—";
  }

  function activityText(item: TaskActivity) {
    return formatTaskActivityText({
      item,
      t,
      assigneeName: (assigneeIds) =>
        assigneeDisplayNames(assigneeIds ?? [], members, roles, t, duties),
      formatDate,
      parentTaskTitle: (id) => {
        if (!id) return "—";
        return tasksById.get(id)?.title ?? "—";
      },
      historyStatusName,
    });
  }

  async function loadOlder() {
    if (loadingOlder || !hasMore || activities.length === 0) return;
    const oldest = activities[activities.length - 1]?.at;
    if (!oldest) return;
    setLoadingOlder(true);
    try {
      const older = await fetchTaskActivitiesForTaskIds(
        taskIds,
        FOLDER_HISTORY_PAGE_SIZE,
        oldest,
      );
      setActivities((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...older.filter((item) => !seen.has(item.id))];
      });
      setHasMore(older.length >= FOLDER_HISTORY_PAGE_SIZE);
    } finally {
      setLoadingOlder(false);
    }
  }

  if (loading) {
    return <LoadingState compact />;
  }

  if (activities.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {t("subtasks.history.empty", "Vēl nav vēstures ierakstu.")}
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {activities.map((item) => {
        const actor = members.find((member) => member.id === item.actorId);
        const task = tasksById.get(item.taskId);
        return (
          <li key={item.id} className="flex gap-2">
            {actor ? (
              <UserAvatar member={actor} size="xs" />
            ) : (
              <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] text-zinc-500">
                ?
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-zinc-700">
                {actor?.name ?? t("todo.fields.unassigned", "Nepiešķirts")}
              </p>
              {task ? (
                isWorkSubtask(task) ? (
                  <button
                    type="button"
                    onClick={() => onOpenSubtask(task)}
                    className="mt-0.5 block max-w-full truncate text-left text-[12px] font-medium text-zinc-500 transition hover:text-zinc-800"
                  >
                    {task.title}
                  </button>
                ) : (
                  <Link
                    href={`/lists/${listId}/tasks/${task.id}`}
                    className="mt-0.5 block max-w-full truncate text-[12px] font-medium text-zinc-500 transition hover:text-zinc-800"
                  >
                    {task.title}
                  </Link>
                )
              ) : null}
              <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-zinc-600">
                {activityText(item)}
              </p>
              <p className="mt-0.5">
                <RelativeTime at={item.at} />
              </p>
            </div>
          </li>
        );
      })}
      {hasMore ? (
        <li>
          <button
            type="button"
            disabled={loadingOlder}
            onClick={() => {
              void loadOlder();
            }}
            className="w-full rounded-xl px-2 py-2 text-left text-[12px] font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:opacity-60"
          >
            {t("subtasks.history.load_older", "Ielādēt vecākus")}
          </button>
        </li>
      ) : null}
    </ol>
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
  const { lists, tasks: allTasks, allTaskFiles } = useLists();
  const { currentTeam, currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { statuses } = useTaskStatuses(listId);
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const { ready: cloudReady, googleDriveReady, oneDriveReady, googleDriveModule, oneDriveModule, requireCloudErrorKey } = useTeamCloudStorage();
  const list = lists.find((item) => item.id === listId) ?? null;
  const windowOrderKey = parentId ?? listId;
  const canUploadIfCloudReady = Boolean(
    fileUploadsEnabled &&
      list &&
      resolveEffectiveListAccess(list, currentUser, roles, isAdmin)
        .canCreateTasks &&
      hasTeamActionPermission(currentUser, roles, isAdmin, "files.upload"),
  );
  const canUploadFiles = canUploadIfCloudReady && cloudReady;
  const canViewArchive = canViewSubtaskArchive(currentUser, roles, isAdmin);
  const [order, setOrder] = useState<ListWindowId[]>(DEFAULT_LIST_WINDOW_ORDER);
  const [tasksArchiveOpen, setTasksArchiveOpen] = useState(false);
  const [overviewArchiveById, setOverviewArchiveById] = useState<
    Record<string, boolean>
  >({});
  const allFilesHook = useListFiles();
  const allFiles = allFilesHook.files;
  const filesReady = allFilesHook.isReady;
  const listScopedFiles = childListFiles(allFiles, listId, parentId);
  const fileEntries = useMemo((): FilesWindowEntry[] => {
    const listEntries: FilesWindowEntry[] = listScopedFiles.map((file) => ({
      kind: "list",
      file,
    }));
    if (!parentId) return listEntries;

    const descendantSubtasks = getDescendantSubtasks(allTasks, parentId);
    const byId = new Map(descendantSubtasks.map((task) => [task.id, task]));
    const taskEntries: FilesWindowEntry[] = allTaskFiles
      .filter((file) => byId.has(file.taskId))
      .slice()
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((file) => ({
        kind: "task" as const,
        file,
        task: byId.get(file.taskId)!,
      }));

    return [...listEntries, ...taskEntries];
  }, [allTaskFiles, allTasks, listScopedFiles, parentId]);
  const showTasksArchive = tasksArchiveOpen && canViewArchive;
  const activeTasks = useMemo(
    () => tasks.filter((task) => isListedInWindow(task, statuses, showTasksArchive)),
    [showTasksArchive, statuses, tasks],
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] =
    useState<FileUploadProgressState | null>(null);
  const dndContextId = useId();
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
    if (!canUploadFiles || uploadProgress) return;
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
    const total = allowed.length;
    let uploadError: string | null = null;
    try {
      for (let index = 0; index < allowed.length; index += 1) {
        const file = allowed[index];
        const updateProgress = (filePercent: number) => {
          setUploadProgress({
            fileName: file.name.trim() || "file",
            current: index + 1,
            total,
            percent: batchUploadPercent(index, total, filePercent),
          });
        };
        updateProgress(0);
        const cloudResult = await uploadFileToTeamCloud({
          teamId: currentTeam?.id,
          listId,
          file,
          pathParts: googleDrivePathForListFile({
            lists,
            tasks,
            listId,
            parentId,
          }),
          googleDriveReady,
          oneDriveReady,
          googleDriveModule,
          oneDriveModule,
          onProgress: updateProgress,
        });
        if (!cloudResult.ok) {
          uploadError = cloudResult.error;
          updateProgress(100);
          break;
        }
        updateProgress(85);
        const stored = await addStoredListFile(listId, file, parentId, nextOrder, {
          storeContent: false,
          googleDriveFileId: cloudResult.googleDriveFileId,
          oneDriveFileId: cloudResult.oneDriveFileId,
        });
        if (!stored) {
          uploadError = "files.save.failed";
          updateProgress(100);
          break;
        }
        nextOrder += 1;
        updateProgress(100);
      }
    } finally {
      setUploadProgress(null);
    }
    if (uploadError) {
      showFeedback({
        type: "error",
        text:
          uploadError === "files.save.failed"
            ? t("files.save.failed", "Neizdevās saglabāt failu. Mēģini vēlreiz.")
            : translateActionError(t, uploadError),
      });
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
          canViewArchive ? (
            <ArchiveToggle
              pressed={tasksArchiveOpen}
              onPressedChange={handleTasksArchiveChange}
            />
          ) : undefined
        }
      >
        <TasksWindow
          listId={listId}
          tasks={activeTasks}
          archiveOpen={showTasksArchive}
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
              disabled={Boolean(uploadProgress)}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={t("create.file.upload_title", "Augšupielādēt failu")}
            >
              <i className="fas fa-plus text-[11px]" aria-hidden="true" />
            </button>
          </>
          ) : undefined
        }
      >
        <FilesWindow
          entries={fileEntries}
          loading={!filesReady}
          driveHint={
            canUploadIfCloudReady && !cloudReady
              ? t(requireCloudErrorKey, filesRequireCloudFallback(requireCloudErrorKey))
              : null
          }
        />
      </WindowCard>
    ),
    overview: (
      <WindowPanel
        key="overview"
        title={t("lists.windows.overview", "Saraksts")}
        icon="fas fa-layer-group"
      >
        <OverviewWindow
          listId={listId}
          tasks={tasks}
          onOpenSubtask={onOpenSubtask}
          overviewArchiveById={overviewArchiveById}
          onOverviewArchiveChange={handleOverviewArchiveChange}
          canViewArchive={canViewArchive}
        />
      </WindowPanel>
    ),
  };

  const historyWindow = (
    <WindowPanel
      key="history"
      className="h-full min-h-[16rem] max-h-[24rem] xl:max-h-none xl:min-h-0"
      title={t("lists.windows.history", "Vēsture")}
      icon="fas fa-clock-rotate-left"
    >
      <FolderHistoryWindow
        listId={listId}
        parentId={parentId}
        onOpenSubtask={onOpenSubtask}
      />
    </WindowPanel>
  );

  const visibleOrder = fileUploadsEnabled
    ? order
    : order.filter((id) => id !== "files");
  const swappableOrder = visibleOrder.filter(
    (id) => id === "tasks" || id === "files",
  );

  return (
    <>
    <DndContext
      id={dndContextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={swappableOrder} strategy={rectSortingStrategy}>
        <div
          className={
            fileUploadsEnabled
              ? "flex min-w-0 flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,28.33%)] xl:items-stretch"
              : "flex min-w-0 flex-col gap-4 md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,42.5%)] md:items-stretch"
          }
        >
          <div className="flex min-w-0 flex-col gap-4">
            <div
              className={
                fileUploadsEnabled ? "grid min-w-0 gap-4 md:grid-cols-2" : undefined
              }
            >
              {swappableOrder.map((id) => windows[id])}
            </div>
            {windows.overview}
          </div>
          <div className="relative min-h-[16rem] min-w-0 max-h-[24rem] xl:max-h-none xl:min-h-0 xl:self-stretch">
            <div className="h-full xl:absolute xl:inset-0">{historyWindow}</div>
          </div>
        </div>
      </SortableContext>
    </DndContext>
    <FileUploadOverlay progress={uploadProgress} />
    </>
  );
}
