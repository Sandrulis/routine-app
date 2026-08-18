"use client";

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
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { DragHandle } from "@/app/components/drag-handle";
import {
  SortableTaskGroup,
  SortableTaskItem,
} from "@/app/components/sortable-task-group";
import { statusDotClassName, statusTextClassName } from "@/app/components/status-control";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  addStoredListFile,
  childListFiles,
  fileIconClassName,
  filePageHref,
  nextItemSortOrder,
  type ListFile,
} from "@/app/lib/list-files";
import {
  DEFAULT_LIST_WINDOW_ORDER,
  readListWindowOrder,
  writeListWindowOrder,
  type ListWindowId,
} from "@/app/lib/list-windows";
import { isTaskActiveInLists, taskProgress, type WorkTask } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  listAccessCapabilities,
  resolveListAccessLevel,
  userIsAssignee,
} from "@/app/lib/list-access";

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

function TasksWindow({
  listId,
  tasks,
}: {
  listId: string;
  tasks: WorkTask[];
}) {
  const { t } = useTranslations();
  const { subtasks } = useLists();
  const { statuses } = useTaskStatuses();

  if (tasks.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </p>
    );
  }

  return (
    <SortableTaskGroup
      itemIds={tasks.map((task) => task.id)}
      contextId={`list-tasks-${listId}`}
    >
      <ul className="space-y-1.5">
        {tasks.map((task) => {
          const childCount = subtasks(task.id).filter((item) =>
            isTaskActiveInLists(item, statuses),
          ).length;
          const canReorder = tasks.length > 1;
          return (
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
                  <Link
                    href={`/lists/${listId}/tasks/${task.id}`}
                    className="flex min-w-0 flex-1 items-start gap-2 rounded-lg px-1 py-1"
                  >
                    <i
                      className={`${task.kind === "folder" ? "far fa-folder" : "fas fa-list-check"} mt-0.5 text-[12px] text-zinc-400`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <OptionalTooltip label={task.description} className="max-w-full">
                        <span className="block truncate text-sm font-medium text-zinc-900">
                          {task.title}
                        </span>
                      </OptionalTooltip>
                      <span className="mt-0.5 block text-[12px] text-zinc-400">
                        {t("tasks.subtask_count", "{count} apakšuzdevumi", {
                          count: childCount,
                        })}
                      </span>
                    </span>
                  </Link>
                </div>
              )}
            </SortableTaskItem>
          );
        })}
      </ul>
    </SortableTaskGroup>
  );
}

function FilesWindow({
  listId,
  files,
}: {
  listId: string;
  files: ListFile[];
}) {
  const { t } = useTranslations();

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
            <i
              className={`${fileIconClassName(file.name)} w-4 text-center text-[13px]`}
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium text-zinc-900">
              {file.name}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function OverviewWindow({
  listId,
  tasks,
}: {
  listId: string;
  tasks: WorkTask[];
}) {
  const { t } = useTranslations();
  const { lists, subtasks, updateTaskStatus } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const list = lists.find((item) => item.id === listId) ?? null;
  const access = listAccessCapabilities(
    list ? resolveListAccessLevel(list, currentUser, roles, isAdmin) : null,
  );
  const { colorFor, statuses } = useTaskStatuses();

  if (tasks.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </p>
    );
  }

  return (
    <ul className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,16rem),1fr))]">
      {tasks.map((task) => {
        const children = subtasks(task.id);
        const visibleChildren = children.filter((item) =>
          isTaskActiveInLists(item, statuses),
        );
        const progress = taskProgress(task, children);
        return (
          <li key={task.id} className="min-w-0 rounded-xl bg-zinc-50 px-3 py-2.5">
            <Link
              href={`/lists/${listId}/tasks/${task.id}`}
              className="block"
            >
              <div className="flex items-center justify-between gap-3">
                <OptionalTooltip label={task.description} className="min-w-0 flex-1">
                  <span className="truncate text-sm font-medium text-zinc-900">
                    {task.title}
                  </span>
                </OptionalTooltip>
                <span className="shrink-0 text-[11px] tabular-nums text-zinc-400">
                  {t("lists.windows.progress", "{done}/{total}", {
                    done: progress.done,
                    total: progress.total,
                  })}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </Link>
            {visibleChildren.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {visibleChildren.map((child) => {
                  const done = child.status === "done";
                  const statusColor = colorFor(child.status);
                  return (
                    <li key={child.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-pressed={done}
                        aria-label={child.title}
                        disabled={
                          !(
                            access.canEditTasks ||
                            (access.canComment &&
                              userIsAssignee(child.assigneeIds, currentUser))
                          )
                        }
                        onClick={() =>
                          updateTaskStatus(child.id, done ? "todo" : "done")
                        }
                        className={`inline-flex size-4 shrink-0 items-center justify-center rounded-full border ${
                          statusColor ? "" : statusDotClassName(child.status)
                        } ${done ? "text-white" : "text-transparent"} disabled:cursor-not-allowed disabled:opacity-60`}
                        style={
                          statusColor
                            ? { backgroundColor: statusColor, borderColor: statusColor }
                            : undefined
                        }
                      >
                        <i className="fas fa-check text-[8px]" aria-hidden="true" />
                      </button>
                      <Link
                        href={`/lists/${listId}/tasks/${child.id}`}
                        className={`truncate text-[13px] ${
                          statusColor ? "" : statusTextClassName(child.status)
                        } ${done ? "line-through" : "hover:opacity-80"}`}
                        style={statusColor ? { color: statusColor } : undefined}
                      >
                        {child.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

export function ListWindowsBoard({
  listId,
  tasks,
}: {
  listId: string;
  tasks: WorkTask[];
}) {
  const { t } = useTranslations();
  const { lists } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const list = lists.find((item) => item.id === listId) ?? null;
  const canUploadFiles = list
    ? listAccessCapabilities(
        resolveListAccessLevel(list, currentUser, roles, isAdmin),
      ).canCreateTasks
    : false;
  const [order, setOrder] = useState<ListWindowId[]>(DEFAULT_LIST_WINDOW_ORDER);
  const allFiles = useListFiles();
  const files = allFiles.filter((file) => file.listId === listId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setOrder(readListWindowOrder(listId));
  }, [listId]);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    if (!canUploadFiles) return;
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    let nextOrder = nextItemSortOrder([
      ...tasks,
      ...childListFiles(allFiles, listId, null),
    ]);
    for (const file of selected) {
      await addStoredListFile(listId, file, null, nextOrder);
      nextOrder += 1;
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
      writeListWindowOrder(listId, next);
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
      >
        <TasksWindow listId={listId} tasks={tasks} />
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
        <FilesWindow listId={listId} files={files} />
      </WindowCard>
    ),
    overview: (
      <WindowCard
        key="overview"
        id="overview"
        title={t("lists.windows.overview", "Saraksts")}
        icon="fas fa-layer-group"
      >
        <OverviewWindow listId={listId} tasks={tasks} />
      </WindowCard>
    ),
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={order} strategy={rectSortingStrategy}>
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            {order
              .filter((id) => id !== "overview")
              .map((id) => windows[id])}
          </div>
          {windows.overview}
        </div>
      </SortableContext>
    </DndContext>
  );
}
