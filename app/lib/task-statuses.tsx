"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useTranslations } from "@/app/components/translations-provider";
import {
  applyTeamStatusLabels,
  resolveStatusCatalogs,
} from "@/app/lib/list-statuses";
import { useListsOptional } from "@/app/lib/lists-store";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

const FALLBACK_STATUSES: TaskStatusSummary[] = [
  {
    id: "todo",
    labels: {
      lv: "Darāms",
      en: "To do",
      ru: "К выполнению",
      de: "Offen",
      fr: "À faire",
      es: "Por hacer",
      nl: "Te doen",
      da: "Opgave",
      no: "Gjøremål",
      fi: "Tekemättä",
      pl: "Do zrobienia",
      lt: "Atliktina",
      et: "Tegemata",
      it: "Da fare",
      sv: "Att göra",
    },
    label: "Darāms",
    color: "#a1a1aa",
    sortOrder: 0,
    groupKey: "not_started",
  },
  {
    id: "in_progress",
    labels: {
      lv: "Procesā",
      en: "In progress",
      ru: "В работе",
      de: "In Bearbeitung",
      fr: "En cours",
      es: "En curso",
      nl: "Bezig",
      da: "I gang",
      no: "Pågår",
      fi: "Käynnissä",
      pl: "W toku",
      lt: "Vykdoma",
      et: "Töös",
      it: "In corso",
      sv: "Pågår",
    },
    label: "Procesā",
    color: "#f97316",
    sortOrder: 1,
    groupKey: "active",
  },
  {
    id: "done",
    labels: {
      lv: "Gatavs",
      en: "Done",
      ru: "Готово",
      de: "Fertig",
      fr: "Terminé",
      es: "Hecho",
      nl: "Klaar",
      da: "Færdig",
      no: "Ferdig",
      fi: "Valmis",
      pl: "Gotowe",
      lt: "Atlikta",
      et: "Valmis",
      it: "Fatto",
      sv: "Klar",
    },
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
  if ("listId" in status && !("parentTaskId" in status)) {
    return status.label.trim() || status.id;
  }
  if ("parentTaskId" in status) {
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

export function useTaskStatuses(
  listId?: string | null,
  parentTaskId?: string | null,
) {
  const system = useSystemTaskStatuses();
  const lists = useListsOptional();
  const { languageCode } = useTranslations();
  const listStatuses = lists?.listStatuses;
  const workTaskStatuses = lists?.workTaskStatuses;
  const list = listId
    ? lists?.lists.find((item) => item.id === listId)
    : undefined;
  const parentTask = parentTaskId
    ? lists?.tasks.find((item) => item.id === parentTaskId)
    : undefined;

  return useMemo(() => {
    const { laidOut, visible } = resolveStatusCatalogs(
      system.statuses,
      listStatuses ?? [],
      {
        listId,
        parentTaskId,
        workTaskStatuses,
        list,
        parentTask,
      },
    );
    return catalogValue(laidOut, languageCode, visible);
  }, [
    languageCode,
    list,
    listId,
    listStatuses,
    parentTask,
    parentTaskId,
    system.statuses,
    workTaskStatuses,
  ]);
}
