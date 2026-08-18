"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslations } from "@/app/components/translations-provider";
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
  return (
    status.labels[languageCode]?.trim() ||
    status.labels.lv?.trim() ||
    status.label.trim() ||
    status.id
  );
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

  const value = useMemo<TaskStatusesContextValue>(() => {
    const grouped = GROUP_ORDER.map((groupId) => ({
      id: groupId,
      statuses: catalog.filter((status) => status.groupKey === groupId),
    })).filter((group) => group.statuses.length > 0);

    return {
      statuses: catalog,
      labelFor(statusId: string) {
        const row = catalog.find((status) => status.id === statusId);
        if (!row) return statusId;
        return resolveStatusLabel(row, languageCode);
      },
      colorFor(statusId: string) {
        return catalog.find((status) => status.id === statusId)?.color ?? null;
      },
      nextStatusId(statusId: string) {
        const index = catalog.findIndex((status) => status.id === statusId);
        if (index < 0 || index >= catalog.length - 1) return null;
        return catalog[index + 1]?.id ?? null;
      },
      groupedStatuses: grouped,
    };
  }, [catalog, languageCode]);

  return (
    <TaskStatusesContext.Provider value={value}>
      {children}
    </TaskStatusesContext.Provider>
  );
}

export function useTaskStatuses() {
  const context = useContext(TaskStatusesContext);
  if (!context) {
    const catalog = FALLBACK_STATUSES;
    return {
      statuses: catalog,
      labelFor(statusId: string) {
        const row = catalog.find((status) => status.id === statusId);
        return row?.label ?? statusId;
      },
      colorFor(statusId: string) {
        return catalog.find((status) => status.id === statusId)?.color ?? null;
      },
      nextStatusId(statusId: string) {
        const index = catalog.findIndex((status) => status.id === statusId);
        if (index < 0 || index >= catalog.length - 1) return null;
        return catalog[index + 1]?.id ?? null;
      },
      groupedStatuses: GROUP_ORDER.map((groupId) => ({
        id: groupId,
        statuses: catalog.filter((status) => status.groupKey === groupId),
      })),
    } satisfies TaskStatusesContextValue;
  }
  return context;
}
