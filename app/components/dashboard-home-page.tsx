"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DashboardTaskSearch } from "@/app/components/dashboard-task-search";
import { ListBadge } from "@/app/components/list-badge";
import { ListSummary } from "@/app/components/list-summary";
import { LoadingState } from "@/app/components/loading-state";
import { SectionPage } from "@/app/components/section-page";
import { SubtaskDetailModal } from "@/app/components/subtask-detail-modal";
import { SubtaskTable } from "@/app/components/subtask-table";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { userIsAssignee } from "@/app/lib/list-access";
import {
  getListTasks,
  isTaskActiveInLists,
  isWorkFolder,
  isWorkSubtask,
  type WorkTask,
} from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { REQUEST_CREATE_TEAM_EVENT } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useNotifications } from "@/app/lib/use-notifications";

function compareAssignedTasks(a: WorkTask, b: WorkTask) {
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate.localeCompare(b.dueDate);
  }
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
  return a.id.localeCompare(b.id);
}

function MyTasksSection({
  tasks,
  onOpenTask,
}: {
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { currentUser } = useTeam();
  const [expanded, setExpanded] = useState(true);
  const orderedTasks = useMemo(
    () => tasks.slice().sort(compareAssignedTasks),
    [tasks],
  );

  return (
    <section className="rounded-xl border border-zinc-200 bg-white">
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
        <UserAvatar member={currentUser} size="xs" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-900">
          {t("dashboard.my_tasks", "Mani uzdevumi")}
        </span>
        <span className="text-[12px] text-zinc-400">{tasks.length}</span>
      </header>

      {expanded ? (
        <div className="border-t border-zinc-100 px-3 py-3">
          {tasks.length === 0 ? (
            <p className="px-1 py-2 text-sm text-zinc-400">
              {t(
                "dashboard.my_tasks.empty",
                "Tev vēl nav piesaistītu uzdevumu.",
              )}
            </p>
          ) : (
            <SubtaskTable
              embedded
              groupByStatus
              tasks={orderedTasks}
              onOpenTask={onOpenTask}
            />
          )}
        </div>
      ) : null}
    </section>
  );
}

export function DashboardHomePage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { lists, tasks, allTaskFiles, isReady } = useLists();
  const { currentTeam, currentUser } = useTeam();
  const { unreadCount } = useNotifications();
  const { statuses } = useTaskStatuses();
  const [openedSubtaskId, setOpenedSubtaskId] = useState<string | null>(null);

  const myTasks = useMemo(
    () =>
      tasks
        .filter(
          (task) =>
            !isWorkFolder(task) &&
            isTaskActiveInLists(task, statuses) &&
            userIsAssignee(task.assigneeIds, currentUser),
        )
        .sort(compareAssignedTasks),
    [currentUser, statuses, tasks],
  );

  function openTask(task: WorkTask) {
    if (isWorkSubtask(task)) {
      setOpenedSubtaskId(task.id);
      return;
    }
    router.push(`/lists/${task.listId}/tasks/${task.id}`);
  }

  if (!isReady) {
    return (
      <SectionPage
        title={t("nav.home", "Sākums")}
        subtitle={t(
          "dashboard.subtitle",
          "Tavi uzdevumi un darbs pa sarakstiem.",
        )}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  const listsWithTasks = lists.filter(
    (list) => getListTasks(tasks, list.id).length > 0,
  );

  return (
    <SectionPage
      title={t("nav.home", "Sākums")}
      subtitle={t(
        "dashboard.subtitle",
        "Tavi uzdevumi un darbs pa sarakstiem.",
      )}
    >
      {!currentTeam ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-6 py-10 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
            <i className="fas fa-users text-lg" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-zinc-900">
            {t("dashboard.no_team.title", "Nav aktīvas komandas")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            {t(
              "dashboard.no_team.description",
              "Izveido jaunu komandu vai pievienojies uzaicinājumam. Paziņojumus skaties augšējā joslā — vari tur apstiprināt komandas uzaicinājumu.",
            )}
          </p>
          {unreadCount > 0 ? (
            <p className="mx-auto mt-3 max-w-md text-sm font-medium text-blue-700">
              {t(
                "dashboard.no_team.unread_notifications",
                "Tev ir {count} nelasīti paziņojumi.",
                { count: unreadCount },
              )}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event(REQUEST_CREATE_TEAM_EVENT));
            }}
            className="mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("teams.add.title", "Jauna komanda")}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardTaskSearch
            tasks={tasks}
            lists={lists}
            taskFiles={allTaskFiles}
            onOpenTask={openTask}
          />

          {myTasks.length > 0 ? (
            <MyTasksSection
              tasks={myTasks}
              onOpenTask={openTask}
            />
          ) : null}

          {myTasks.length > 0 && listsWithTasks.length > 0 ? (
            <div
              role="separator"
              aria-label={t("dashboard.other_tasks", "Pārējie uzdevumi")}
              className="flex items-center gap-3 pt-2"
            >
              <span className="h-px flex-1 bg-zinc-200" />
              <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {t("dashboard.other_tasks", "Pārējie uzdevumi")}
              </span>
              <span className="h-px flex-1 bg-zinc-200" />
            </div>
          ) : null}

          {listsWithTasks.map((list) => {
            const roots = getListTasks(tasks, list.id);
            return (
              <section key={list.id} className="space-y-3">
                <Link
                  href={`/lists/${list.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900 hover:text-blue-700"
                >
                  <ListBadge
                    name={list.name}
                    icon={list.icon}
                    color={list.color}
                    isPrivate={list.isPrivate}
                  />
                  {list.name}
                </Link>
                <ListSummary
                  listId={list.id}
                  listName={list.name}
                  tasks={roots}
                  onOpenTask={openTask}
                />
              </section>
            );
          })}
        </div>
      )}

      <SubtaskDetailModal
        taskId={openedSubtaskId}
        open={openedSubtaskId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setOpenedSubtaskId(null);
          }
        }}
      />
    </SectionPage>
  );
}
