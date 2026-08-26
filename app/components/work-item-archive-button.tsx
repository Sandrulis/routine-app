"use client";

import { IconActionButton } from "@/app/components/icon-action-button";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  resolveEffectiveListAccess,
} from "@/app/lib/list-access";
import {
  isWorkFolder,
  isWorkItemArchived,
  isWorkSubtask,
  type WorkTask,
} from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { canArchiveWorkItem } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

export function workItemArchiveFeedback(
  t: (key: string, fallback: string) => string,
  task: WorkTask,
  archived: boolean,
): string {
  if (isWorkFolder(task)) {
    return archived
      ? t("folders.archived", "Mape arhivēta.")
      : t("folders.unarchived", "Mape izņemta no arhīva.");
  }
  return archived
    ? t("tasks.archived", "Uzdevums arhivēts.")
    : t("tasks.unarchived", "Uzdevums izņemts no arhīva.");
}

export function WorkItemArchiveButton({ task }: { task: WorkTask }) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { lists, setWorkItemArchived } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const list = lists.find((item) => item.id === task.listId) ?? null;
  const canEdit = list
    ? resolveEffectiveListAccess(list, currentUser, roles, isAdmin).canEditTasks
    : false;
  const canArchive = canArchiveWorkItem(task, currentUser, roles, isAdmin);

  if (!canEdit || !canArchive || isWorkSubtask(task)) return null;

  const archived = isWorkItemArchived(task);

  return (
    <IconActionButton
      label={
        archived
          ? t("actions.unarchive", "Noņemt no arhīva")
          : t("actions.archive", "Arhivēt")
      }
      icon={archived ? "fas fa-folder" : "fas fa-folder-open"}
      variant="muted"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setWorkItemArchived(task.id, !archived);
        showFeedback({
          type: "success",
          text: workItemArchiveFeedback(t, task, !archived),
        });
      }}
    />
  );
}
