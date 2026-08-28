"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  searchDashboardTasks,
  type DashboardTaskSearchHit,
} from "@/app/lib/dashboard/search-tasks";
import {
  isWorkSubtask,
  workItemIcon,
  type WorkList,
  type WorkTask,
} from "@/app/lib/lists";

type DashboardTaskSearchProps = {
  tasks: WorkTask[];
  lists: WorkList[];
  taskFiles: Array<{ taskId: string; name: string }>;
  onOpenTask: (task: WorkTask) => void;
};

function SearchResultRow({
  hit,
  onOpen,
}: {
  hit: DashboardTaskSearchHit;
  onOpen: () => void;
}) {
  const { t } = useTranslations();
  const { task, listName, parentTitle, archived, matchedFileName } = hit;
  const kindLabel = isWorkSubtask(task)
    ? t("dashboard.search.kind_subtask", "Apakšuzdevums")
    : t("dashboard.search.kind_task", "Uzdevums");

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-zinc-50 ${
        archived ? "opacity-55" : ""
      }`}
    >
      <span className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
        <i className={`fas ${workItemIcon(task)} text-xs`} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-900">
          {task.title.trim() || t("dashboard.search.untitled", "Bez nosaukuma")}
        </span>
        <span className="mt-0.5 block truncate text-xs text-zinc-500">
          {[
            listName,
            parentTitle,
            kindLabel,
            matchedFileName,
            archived ? t("dashboard.search.archived", "Arhīvā") : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
    </button>
  );
}

export function DashboardTaskSearch({
  tasks,
  lists,
  taskFiles,
  onOpenTask,
}: DashboardTaskSearchProps) {
  const { t } = useTranslations();
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => searchDashboardTasks(query, tasks, lists, taskFiles),
    [lists, query, taskFiles, tasks],
  );

  const showResults = query.trim().length > 0;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white px-3 py-3">
      <label className="relative block">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
          <i className="fas fa-search text-sm" aria-hidden="true" />
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t(
            "dashboard.search.placeholder",
            "Meklēt uzdevumus un apakšuzdevumus…",
          )}
          className="min-h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
      </label>

      {showResults ? (
        <div className="mt-2 max-h-80 overflow-y-auto rounded-xl border border-zinc-100 [scrollbar-width:thin]">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-400">
              {t("dashboard.search.empty", "Nav rezultātu.")}
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 p-1">
              {results.map((hit) => (
                <SearchResultRow
                  key={hit.task.id}
                  hit={hit}
                  onOpen={() => {
                    onOpenTask(hit.task);
                    setQuery("");
                  }}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
