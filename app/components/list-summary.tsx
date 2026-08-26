"use client";

import { memo, useMemo, useState } from "react";
import { GroupedSubtaskTables } from "@/app/components/grouped-subtask-tables";
import { IconActionButton } from "@/app/components/icon-action-button";
import { UserAvatar } from "@/app/components/user-avatar";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { SubtaskDetailModal } from "@/app/components/subtask-detail-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { sortTasksLikeNavTree } from "@/app/lib/list-statuses";
import {
  formatTaskLocationPath,
  getTaskAncestors,
  isTaskActiveInLists,
  isTaskDeleted,
  isWorkFolder,
  isWorkItemArchived,
  workItemIcon,
  workProgressById,
  type WorkProgress,
  type WorkTask,
} from "@/app/lib/lists";
import { resolveEffectiveListAccess } from "@/app/lib/list-access";
import { useLists } from "@/app/lib/lists-store";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import { WorkItemArchiveButton } from "@/app/components/work-item-archive-button";
import { WorkProgressBar, WorkProgressLabel } from "@/app/components/work-progress";

function dateRange(
  task: WorkTask,
  children: WorkTask[],
  formatDate: (value: string) => string,
) {
  const dates = [
    task.startDate,
    task.dueDate,
    ...children.flatMap((item) => [item.startDate, item.dueDate]),
  ]
    .filter((value): value is string => Boolean(value))
    .sort();

  if (dates.length === 0) return null;
  const start = formatDate(dates[0]);
  const end = formatDate(dates[dates.length - 1]);
  return start === end ? start : `${start} - ${end}`;
}

const TaskSummarySection = memo(function TaskSummarySection({
  listId,
  listName,
  task,
  defaultExpanded,
  nested = false,
  archivedView = false,
  progress,
  canCreateSubtasks,
  onOpenTask,
  onAddSubtask,
}: {
  listId: string;
  listName: string;
  task: WorkTask;
  defaultExpanded: boolean;
  nested?: boolean;
  archivedView?: boolean;
  progress: Map<string, WorkProgress>;
  canCreateSubtasks: boolean;
  onOpenTask: (task: WorkTask) => void;
  onAddSubtask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { members } = useTeam();
  const { tasks, childTasks, subtasks } = useLists();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const folder = isWorkFolder(task);
  const showAddSubtask =
    canCreateSubtasks &&
    !folder &&
    !archivedView &&
    !isWorkItemArchived(task);
  const { statuses } = useTaskStatuses(listId, folder ? null : task.id);
  const children = sortTasksLikeNavTree(subtasks(task.id), statuses);
  const nestedItems = sortTasksLikeNavTree(
    childTasks(task.id).filter((item) => {
      if (isTaskDeleted(item)) return false;
      if (archivedView || isWorkFolder(item)) return true;
      return isTaskActiveInLists(item, statuses);
    }),
    statuses,
  );
  const visibleChildren = children.filter((item) =>
    archivedView ? !isTaskDeleted(item) : isTaskActiveInLists(item, statuses),
  );
  const itemProgress = progress.get(task.id);
  const range = dateRange(task, [...nestedItems, ...children], formatDate);
  const assignees = members.filter((member) =>
    [task, ...nestedItems, ...children].some((item) =>
      item.assigneeIds.includes(member.id),
    ),
  );
  const ancestors = getTaskAncestors(tasks, task);

  const crumb = formatTaskLocationPath(listName, ancestors, {
    includeListName: true,
  });
  // Keep breadcrumb prefix consistent with page navigation.
  const pathWithNavPrefix = [t("nav.lists", "Saraksts"), crumb]
    .filter(Boolean)
    .join(" / ");

  return (
    <section
      className={
        nested
          ? "rounded-lg border border-zinc-100 bg-zinc-50"
          : "rounded-xl border border-zinc-200 bg-white"
      }
    >
      {nested ? null : (
        <p className="px-3 pt-2 text-[11px] text-zinc-400">{pathWithNavPrefix}</p>
      )}
      <header className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          aria-expanded={expanded}
          aria-label={
            expanded
              ? t("nav.collapse", "Sakļaut")
              : t("nav.expand", "Izvērst")
          }
          onClick={() => setExpanded((current) => !current)}
          className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          <i
            className={`fas fa-chevron-down text-[10px] transition-transform ${
              expanded ? "" : "-rotate-90"
            }`}
            aria-hidden="true"
          />
        </button>
        <i
          className={`${workItemIcon(task)} shrink-0 text-[12px] text-zinc-400`}
          aria-hidden="true"
        />
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <OptionalTooltip label={task.description} className="min-w-0">
            <button
              type="button"
              onClick={() => onOpenTask(task)}
              className="block min-w-0 truncate text-left text-sm font-semibold text-zinc-900 hover:text-blue-700"
            >
              {task.title}
            </button>
          </OptionalTooltip>
          <WorkItemArchiveButton task={task} />
          {showAddSubtask ? (
            <IconActionButton
              label={t("subtasks.add.title", "Jauns apakšuzdevums")}
              icon="fas fa-plus"
              variant="muted"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onAddSubtask(task);
              }}
            />
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {itemProgress ? <WorkProgressLabel progress={itemProgress} /> : null}
          {assignees.length > 0 ? (
            <span className="flex items-center -space-x-1.5">
              {assignees.map((member) => (
                <UserAvatar key={member.id} member={member} size="xs" />
              ))}
            </span>
          ) : (
            <span className="inline-flex size-6 items-center justify-center text-zinc-300">
              <i className="far fa-user text-[12px]" aria-hidden="true" />
            </span>
          )}
          {range ? (
            <span className="hidden items-center gap-1.5 text-[12px] text-zinc-400 sm:inline-flex">
              <i className="far fa-calendar text-[11px]" aria-hidden="true" />
              {range}
            </span>
          ) : null}
        </div>
      </header>
      {itemProgress ? (
        <div className={expanded ? "px-3" : "px-3 pb-2"}>
          <WorkProgressBar progress={itemProgress} />
        </div>
      ) : null}

      {expanded ? (
        <div
          className={`space-y-4 px-3 py-3 ${
            itemProgress ? "" : "border-t border-zinc-100"
          }`}
        >
          {nestedItems.length > 0 ? (
            <div className="space-y-3">
              {nestedItems.map((child) => (
                <TaskSummarySection
                  key={child.id}
                  listId={listId}
                  listName={listName}
                  task={child}
                  defaultExpanded
                  nested
                  archivedView={archivedView}
                  progress={progress}
                  canCreateSubtasks={canCreateSubtasks}
                  onOpenTask={onOpenTask}
                  onAddSubtask={onAddSubtask}
                />
              ))}
            </div>
          ) : null}

          {folder ? (
            nestedItems.length === 0 ? (
              <p className="px-1 py-2 text-sm text-zinc-400">
                {t("folders.empty", "Šajā mapē vēl nav uzdevumu.")}
              </p>
            ) : null
          ) : visibleChildren.length === 0 ? (
            nestedItems.length === 0 ? (
              <p className="px-1 py-2 text-sm text-zinc-400">
                {t("subtasks.empty", "Šim uzdevumam vēl nav apakšuzdevumu.")}
              </p>
            ) : null
          ) : (
            <GroupedSubtaskTables
              listId={listId}
              tasks={children.filter((item) => !isTaskDeleted(item))}
              includeClosed={archivedView}
              onOpenTask={onOpenTask}
            />
          )}
        </div>
      ) : null}
    </section>
  );
});

export function ListSummary({
  listId,
  listName,
  tasks,
  archivedView = false,
  onOpenTask,
}: {
  listId: string;
  listName: string;
  tasks: WorkTask[];
  archivedView?: boolean;
  onOpenTask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { lists, tasks: allTasks } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { statuses } = useTaskStatuses(listId);
  const [createFor, setCreateFor] = useState<{
    listId: string;
    parentId: string;
  } | null>(null);
  const list = lists.find((item) => item.id === listId) ?? null;
  const canCreateSubtasks = list
    ? resolveEffectiveListAccess(list, currentUser, roles, isAdmin)
        .canCreateTasks
    : false;
  const progressById = useMemo(
    () => workProgressById(allTasks, statuses),
    [allTasks, statuses],
  );
  const orderedTasks = sortTasksLikeNavTree(tasks, statuses);

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {archivedView
          ? t("lists.archive.empty", "Arhīvā nav uzdevumu.")
          : t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orderedTasks.map((task, index) => (
        <TaskSummarySection
          key={task.id}
          listId={listId}
          listName={listName}
          task={task}
          defaultExpanded={index === 0}
          archivedView={archivedView}
          progress={progressById}
          canCreateSubtasks={canCreateSubtasks}
          onOpenTask={onOpenTask}
          onAddSubtask={(parent) =>
            setCreateFor({ listId: parent.listId, parentId: parent.id })
          }
        />
      ))}

      <SubtaskDetailModal
        taskId={null}
        createFor={createFor}
        open={createFor !== null}
        onOpenChange={(open) => {
          if (!open) setCreateFor(null);
        }}
      />
    </div>
  );
}
