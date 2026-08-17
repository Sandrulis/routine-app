"use client";

import { useState } from "react";
import { statusClassName, useStatusLabels, WORK_TASK_STATUSES } from "@/app/components/status-control";
import { SubtaskTable } from "@/app/components/subtask-table";
import { UserAvatar } from "@/app/components/user-avatar";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { getTaskAncestors, workItemIcon, type WorkTask } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";

const STATUS_ORDER = WORK_TASK_STATUSES;

function dateRange(task: WorkTask, children: WorkTask[]) {
  const dates = [
    task.startDate,
    task.dueDate,
    ...children.flatMap((item) => [item.startDate, item.dueDate]),
  ]
    .filter((value): value is string => Boolean(value))
    .sort();

  if (dates.length === 0) return null;
  const start = formatDisplayDateDdMmYy(dates[0]);
  const end = formatDisplayDateDdMmYy(dates[dates.length - 1]);
  return start === end ? start : `${start} - ${end}`;
}

function TaskSummarySection({
  listId,
  listName,
  task,
  defaultExpanded,
  onOpenTask,
  onAddSubtask,
}: {
  listId: string;
  listName: string;
  task: WorkTask;
  defaultExpanded: boolean;
  onOpenTask: (task: WorkTask) => void;
  onAddSubtask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { members } = useTeam();
  const { tasks, childTasks, subtasks } = useLists();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const children = subtasks(task.id);
  const nested = childTasks(task.id);
  const range = dateRange(task, [...nested, ...children]);
  const assignees = members.filter((member) =>
    [task, ...nested, ...children].some((item) =>
      item.assigneeIds.includes(member.id),
    ),
  );
  const ancestors = getTaskAncestors(tasks, task);
  const grouped = STATUS_ORDER.map((status) => ({
    status,
    items: children.filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);

  const statusLabel = useStatusLabels();

  const crumb = [t("nav.lists", "Saraksts"), listName, ...ancestors.map((item) => item.title)]
    .filter(Boolean)
    .join(" / ");

  return (
    <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <p className="px-3 pt-2 text-[11px] text-zinc-400">{crumb}</p>
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
          {nested.length > 0 ? (
            <ul className="space-y-1">
              {nested.map((child) => (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => onOpenTask(child)}
                    className="flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    <i
                      className={`${workItemIcon(child)} w-4 text-center text-[12px] text-zinc-400`}
                      aria-hidden="true"
                    />
                    <OptionalTooltip label={child.description} className="min-w-0 flex-1">
                      <span className="truncate font-medium">{child.title}</span>
                    </OptionalTooltip>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {children.length === 0 ? (
            <div className="px-1 py-2">
              <p className="text-sm text-zinc-400">
                {t("subtasks.empty", "Šim uzdevumam vēl nav apakšuzdevumu.")}
              </p>
              <button
                type="button"
                onClick={() => onAddSubtask(task)}
                className="mt-2 text-[13px] font-medium text-zinc-400 hover:text-zinc-700"
              >
                + {t("lists.overview.add_task", "Pievienot uzdevumu")}
              </button>
            </div>
          ) : (
            grouped.map((group) => (
              <div key={group.status}>
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`inline-flex min-h-6 items-center rounded-md px-2 text-[11px] font-semibold tracking-wide uppercase ${statusClassName(group.status)}`}
                  >
                    {statusLabel[group.status]}
                  </span>
                  <span className="text-[12px] text-zinc-400">
                    {group.items.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAddSubtask(task)}
                    className="ml-auto text-[12px] font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    + {t("tasks.add.button", "Pievienot")}
                  </button>
                </div>
                <SubtaskTable
                  embedded
                  listId={listId}
                  tasks={group.items}
                  onOpenTask={onOpenTask}
                />
                <button
                  type="button"
                  onClick={() => onAddSubtask(task)}
                  className="mt-1 px-1 text-[13px] text-zinc-400 hover:text-zinc-700"
                >
                  + {t("lists.overview.add_task", "Pievienot uzdevumu")}
                </button>
              </div>
            ))
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
  onAddSubtask,
}: {
  listId: string;
  listName: string;
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
  onAddSubtask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
        {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task, index) => (
        <TaskSummarySection
          key={task.id}
          listId={listId}
          listName={listName}
          task={task}
          defaultExpanded={index === 0}
          onOpenTask={onOpenTask}
          onAddSubtask={onAddSubtask}
        />
      ))}
    </div>
  );
}
