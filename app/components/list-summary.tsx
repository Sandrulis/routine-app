"use client";

import { useState } from "react";
import { GroupedSubtaskTables } from "@/app/components/grouped-subtask-tables";
import { UserAvatar } from "@/app/components/user-avatar";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { compareTasksByStatusPriority } from "@/app/lib/list-statuses";
import { getTaskAncestors, isTaskActiveInLists, isTaskDeleted, isWorkFolder, workItemIcon, type WorkTask } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { useTeam } from "@/app/lib/team-store";

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

function TaskSummarySection({
  listId,
  listName,
  task,
  defaultExpanded,
  nested = false,
  onOpenTask,
}: {
  listId: string;
  listName: string;
  task: WorkTask;
  defaultExpanded: boolean;
  nested?: boolean;
  onOpenTask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { members } = useTeam();
  const { tasks, childTasks, subtasks } = useLists();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { statuses } = useTaskStatuses(listId);
  const folder = isWorkFolder(task);
  const children = subtasks(task.id);
  const nestedItems = childTasks(task.id)
    .filter((item) =>
      isWorkFolder(item)
        ? !isTaskDeleted(item)
        : isTaskActiveInLists(item, statuses),
    )
    .slice()
    .sort((left, right) =>
      compareTasksByStatusPriority(left, right, statuses),
    );
  const visibleChildren = children
    .filter((item) => isTaskActiveInLists(item, statuses))
    .slice()
    .sort((left, right) =>
      compareTasksByStatusPriority(left, right, statuses),
    );
  const range = dateRange(task, [...nestedItems, ...children], formatDate);
  const assignees = members.filter((member) =>
    [task, ...nestedItems, ...children].some((item) =>
      item.assigneeIds.includes(member.id),
    ),
  );
  const ancestors = getTaskAncestors(tasks, task);

  const crumb = [t("nav.lists", "Saraksts"), listName, ...ancestors.map((item) => item.title)]
    .filter(Boolean)
    .join(" / ");

  return (
    <section
      className={
        nested
          ? "overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50"
          : "overflow-hidden rounded-xl border border-zinc-200 bg-white"
      }
    >
      {nested ? null : (
        <p className="px-3 pt-2 text-[11px] text-zinc-400">{crumb}</p>
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
        <OptionalTooltip label={task.description} className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onOpenTask(task)}
            className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-zinc-900 hover:text-blue-700"
          >
            {task.title}
          </button>
        </OptionalTooltip>
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
      </header>

      {expanded ? (
        <div className="space-y-4 border-t border-zinc-100 px-3 py-3">
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
                  onOpenTask={onOpenTask}
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
              tasks={visibleChildren}
              onOpenTask={onOpenTask}
            />
          )}
        </div>
      ) : null}
    </section>
  );
}

export function ListSummary({
  listId,
  listName,
  tasks,
  onOpenTask,
}: {
  listId: string;
  listName: string;
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
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
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
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
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  );
}
