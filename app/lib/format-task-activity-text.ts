import type { ChecklistActivityMetadata } from "@/app/lib/build-task-activity-events";
import type { TaskActivity } from "@/app/lib/task-activity";

type TranslateFn = (
  key: string,
  fallback: string,
  params?: Record<string, string | number>,
) => string;

type FormatTaskActivityTextInput = {
  item: TaskActivity;
  t: TranslateFn;
  assigneeName: (assigneeIds: string[] | undefined) => string;
  formatDate: (iso: string) => string;
  parentTaskTitle: (parentId: string | null | undefined) => string;
  historyStatusName: (statusId: string | undefined) => string;
};

function formatOptionalDate(
  formatDate: (iso: string) => string,
  value: string | null | undefined,
  emptyLabel: string,
) {
  return value ? formatDate(value) : emptyLabel;
}

function formatDateChange(
  t: TranslateFn,
  formatDate: (iso: string) => string,
  prefix: "start_date" | "due_date",
  from: string | null | undefined,
  to: string | null | undefined,
  emptyLabel: string,
  hasPrevious: boolean,
) {
  const fromLabel = formatOptionalDate(formatDate, from, emptyLabel);
  const toLabel = formatOptionalDate(formatDate, to, emptyLabel);
  if (hasPrevious) {
    return t(`subtasks.history.${prefix}_changed`, "Sākums: {from} → {to}", {
      from: fromLabel,
      to: toLabel,
    });
  }
  return t(`subtasks.history.${prefix}`, "{date}", {
    date: toLabel,
  });
}

function parseChecklistMetadata(
  item: TaskActivity,
): ChecklistActivityMetadata | null {
  const meta = item.metadata;
  if (!meta || typeof meta !== "object" || !("action" in meta)) return null;
  return meta as ChecklistActivityMetadata;
}

export function formatTaskActivityText({
  item,
  t,
  assigneeName,
  formatDate,
  parentTaskTitle,
  historyStatusName,
}: FormatTaskActivityTextInput): string {
  const emptyDate = "—";

  if (item.kind === "created") {
    return t("subtasks.history.created", "Apakšuzdevums izveidots.");
  }
  if (item.kind === "status") {
    return t("subtasks.history.status", "Statuss: {from} → {to}", {
      from: historyStatusName(item.fromStatus),
      to: historyStatusName(item.toStatus),
    });
  }
  if (item.kind === "assignees") {
    const names = assigneeName(item.assigneeIds);
    return t("subtasks.history.assignees", "Piesaistītie: {names}", {
      names: names || t("todo.fields.unassigned", "Nepiešķirts"),
    });
  }
  if (item.kind === "assignee_added") {
    return t("subtasks.history.assignee_added", "Pievienots: {name}", {
      name: assigneeName(item.assigneeIds),
    });
  }
  if (item.kind === "assignee_removed") {
    return t("subtasks.history.assignee_removed", "Noņemts: {name}", {
      name: assigneeName(item.assigneeIds),
    });
  }
  if (item.kind === "start_date") {
    return formatDateChange(
      t,
      formatDate,
      "start_date",
      item.fromDateValue,
      item.dateValue,
      emptyDate,
      item.fromDateValue !== undefined,
    );
  }
  if (item.kind === "due_date") {
    return formatDateChange(
      t,
      formatDate,
      "due_date",
      item.fromDateValue,
      item.dateValue,
      emptyDate,
      item.fromDateValue !== undefined,
    );
  }
  if (item.kind === "title") {
    return t("subtasks.history.title", "Nosaukums: {from} → {to}", {
      from: item.previousText?.trim() || "—",
      to: item.text?.trim() || "—",
    });
  }
  if (item.kind === "description") {
    return t("subtasks.history.description", "Apraksts atjaunināts.");
  }
  if (item.kind === "moved") {
    return t("subtasks.history.moved", "Pārvietots: {from} → {to}", {
      from: parentTaskTitle(item.fromParentId),
      to: parentTaskTitle(item.toParentId),
    });
  }
  if (item.kind === "hidden") {
    return t("subtasks.history.hidden", "Apakšuzdevums paslēpts.");
  }
  if (item.kind === "restored") {
    return t("subtasks.history.restored", "Apakšuzdevums atjaunots.");
  }
  if (item.kind === "comment") {
    return item.text ?? "";
  }
  if (item.kind === "file") {
    return t("subtasks.history.file", "Pievienots fails: {name}", {
      name: item.fileName ?? "",
    });
  }
  if (item.kind === "file_removed") {
    return t("subtasks.history.file_removed", "Noņemts fails: {name}", {
      name: item.fileName ?? "",
    });
  }
  if (item.kind === "file_renamed") {
    return t("subtasks.history.file_renamed", "Fails pārsaukts: {from} → {to}", {
      from: item.previousText ?? "",
      to: item.fileName ?? "",
    });
  }
  if (item.kind === "reordered") {
    return t("subtasks.history.reordered", "Mainīta kārtība.");
  }
  if (item.kind === "checklist") {
    const meta = parseChecklistMetadata(item);
    if (!meta) {
      return t("subtasks.history.checklist", "Kontrolsaraksts mainīts.");
    }
    const checklist = meta.checklistTitle || "—";
    const itemTitle = meta.itemTitle || "—";
    switch (meta.action) {
      case "checklist_added":
        return t(
          "subtasks.history.checklist_added",
          "Pievienots kontrolsaraksts: {title}",
          { title: checklist },
        );
      case "checklist_removed":
        return t(
          "subtasks.history.checklist_removed",
          "Noņemts kontrolsaraksts: {title}",
          { title: checklist },
        );
      case "checklist_renamed":
        return t(
          "subtasks.history.checklist_renamed",
          "Kontrolsaraksts pārsaukts: {from} → {to}",
          {
            from: meta.previousTitle ?? "—",
            to: checklist,
          },
        );
      case "item_added":
        return t(
          "subtasks.history.checklist_item_added",
          "Pievienots punkts „{item}” ({checklist})",
          { item: itemTitle, checklist },
        );
      case "item_removed":
        return t(
          "subtasks.history.checklist_item_removed",
          "Noņemts punkts „{item}” ({checklist})",
          { item: itemTitle, checklist },
        );
      case "item_renamed":
        return t(
          "subtasks.history.checklist_item_renamed",
          "Punkts pārsaukts: {from} → {to} ({checklist})",
          {
            from: meta.previousTitle ?? "—",
            to: itemTitle,
            checklist,
          },
        );
      case "item_checked":
        return t(
          "subtasks.history.checklist_item_checked",
          "Atzīmēts: „{item}” ({checklist})",
          { item: itemTitle, checklist },
        );
      case "item_unchecked":
        return t(
          "subtasks.history.checklist_item_unchecked",
          "Noņemta atzīme: „{item}” ({checklist})",
          { item: itemTitle, checklist },
        );
      default:
        return t("subtasks.history.checklist", "Kontrolsaraksts mainīts.");
    }
  }
  return "";
}
