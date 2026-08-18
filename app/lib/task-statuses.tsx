"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  applyListStatusLayout,
  applyStatusGroupOverrides,
  applyTeamStatusLabels,
  enforceSingletonGroups,
  mergeStatusCatalog,
} from "@/app/lib/list-statuses";
import { useListsOptional } from "@/app/lib/lists-store";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

const FALLBACK_STATUSES: TaskStatusSummary[] = [
  {
    id: "todo",
    labels: { lv: "Darāms", en: "To do", ru: "К выполнению" },
    label: "Darāms",
    color: "#a1a1aa",
    sortOrder: 0,
    groupKey: "not_started",
  },
  {
    id: "in_progress",
    labels: { lv: "Procesā", en: "In progress", ru: "В работе" },
    label: "Procesā",
    color: "#f97316",
    sortOrder: 1,
    groupKey: "active",
  },
  {
    id: "done",
    labels: { lv: "Gatavs", en: "Done", ru: "Готово" },
    label: "Gatavs",
    color: "#10b981",
    sortOrder: 2,
    groupKey: "closed",
  },
];

const GROUP_ORDER = ["not_started", "active", "closed"] as const;

type TaskStatusesContextValue = {
  statuses: TaskStatusSummary[];
  labelFor: (statusId: string) => string;
  colorFor: (statusId: string) => string | null;
  groupKeyFor: (statusId: string) => string;
  nextStatusId: (statusId: string) => string | null;
  groupedStatuses: {
    id: (typeof GROUP_ORDER)[number];
    statuses: TaskStatusSummary[];
  }[];
};

const TaskStatusesContext = createContext<TaskStatusesContextValue | null>(null);

function resolveStatusLabel(
  status: TaskStatusSummary,
  languageCode: string,
): string {
  if ("listId" in status) {
    return status.label.trim() || status.id;
  }
  return (
    status.labels[languageCode]?.trim() ||
    status.labels.lv?.trim() ||
    status.label.trim() ||
    status.id
  );
}

function catalogValue(
  catalog: TaskStatusSummary[],
  languageCode: string,
  visibleCatalog: TaskStatusSummary[] = catalog,
): TaskStatusesContextValue {
  const grouped = GROUP_ORDER.map((groupId) => ({
    id: groupId,
    statuses: visibleCatalog.filter((status) => status.groupKey === groupId),
  })).filter((group) => group.statuses.length > 0);

  return {
    statuses: visibleCatalog,
    labelFor(statusId: string) {
      const row = catalog.find((status) => status.id === statusId);
      if (!row) return statusId;
      return resolveStatusLabel(row, languageCode);
    },
    colorFor(statusId: string) {
      return catalog.find((status) => status.id === statusId)?.color ?? null;
    },
    groupKeyFor(statusId: string) {
      return catalog.find((status) => status.id === statusId)?.groupKey ?? "active";
    },
    nextStatusId(statusId: string) {
      const index = visibleCatalog.findIndex((status) => status.id === statusId);
      if (index < 0 || index >= visibleCatalog.length - 1) return null;
      return visibleCatalog[index + 1]?.id ?? null;
    },
    groupedStatuses: grouped,
  };
}

export function TaskStatusesProvider({
  statuses,
  children,
}: {
  statuses: TaskStatusSummary[];
  children: ReactNode;
}) {
  const { languageCode } = useTranslations();
  const catalog = statuses.length > 0 ? statuses : FALLBACK_STATUSES;

  const value = useMemo(
    () => catalogValue(catalog, languageCode),
    [catalog, languageCode],
  );

  return (
    <TaskStatusesContext.Provider value={value}>
      {children}
    </TaskStatusesContext.Provider>
  );
}

export function useSystemTaskStatuses() {
  const context = useContext(TaskStatusesContext);
  const { languageCode } = useTranslations();
  const lists = useListsOptional();
  const baseCatalog = context?.statuses ?? FALLBACK_STATUSES;
  const labeled = useMemo(
    () => applyTeamStatusLabels(baseCatalog, lists?.teamStatusLabels ?? {}),
    [baseCatalog, lists?.teamStatusLabels],
  );
  return useMemo(
    () => catalogValue(labeled, languageCode),
    [labeled, languageCode],
  );
}

export function useTaskStatuses(listId?: string | null) {
  const system = useSystemTaskStatuses();
  const lists = useListsOptional();
  const { languageCode } = useTranslations();
  const listStatuses = lists?.listStatuses ?? [];
  const list = listId
    ? lists?.lists.find((item) => item.id === listId)
    : undefined;

  return useMemo(() => {
    const merged = applyStatusGroupOverrides(
      mergeStatusCatalog(system.statuses, listStatuses, listId),
      list?.statusGroupOverrides ?? {},
    );
    const laidOut = applyListStatusLayout(merged, list?.statusOrder ?? []);
    const visible =
      listId && list ? enforceSingletonGroups(laidOut).catalog : laidOut;
    return catalogValue(visible, languageCode);
  }, [
    languageCode,
    list,
    list?.statusOrder,
    listId,
    listStatuses,
    system.statuses,
  ]);
}
