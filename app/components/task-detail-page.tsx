"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMenuAnchorFromEvent } from "@/app/components/create-item-menu";
import { GroupedSubtaskTables } from "@/app/components/grouped-subtask-tables";
import { IconActionButton } from "@/app/components/icon-action-button";
import { LoadingState } from "@/app/components/loading-state";
import { ParentCreateFlow, type ParentCreateContext } from "@/app/components/parent-create-flow";
import { SectionPage } from "@/app/components/section-page";
import { SubtaskDetailModal } from "@/app/components/subtask-detail-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { isWorkFolder, isWorkItemArchived, isWorkSubtask, workProgressById } from "@/app/lib/lists";
import { sortTasksLikeNavTree } from "@/app/lib/list-statuses";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  resolveEffectiveListAccess,
} from "@/app/lib/list-access";
import { WorkItemArchiveButton } from "@/app/components/work-item-archive-button";
import { WorkProgressLabel } from "@/app/components/work-progress";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { canViewSubtaskArchive } from "@/app/lib/team";

const ListWindowsBoard = dynamic(
  () =>
    import("@/app/components/list-windows-board").then((mod) => ({
      default: mod.ListWindowsBoard,
    })),
  { ssr: false, loading: () => <LoadingState compact /> },
);

export function TaskDetailPage({
  listId,
  taskId,
}: {
  listId: string;
  taskId: string;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { lists, tasks, childTasks, subtasks, isReady } = useLists();
  const { currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const [parentCreate, setParentCreate] = useState<ParentCreateContext | null>(
    null,
  );
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const [boardSubtaskId, setBoardSubtaskId] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const canViewArchive = canViewSubtaskArchive(currentUser, roles, isAdmin);
  const list = lists.find((item) => item.id === listId) ?? null;
  const listAccess = list
    ? resolveEffectiveListAccess(list, currentUser, roles, isAdmin)
    : resolveEffectiveListAccess(null, currentUser, roles, isAdmin);
  const opened = tasks.find((item) => item.id === taskId) ?? null;
  const isSubtask = opened ? isWorkSubtask(opened) : false;
  const isFolder = opened ? isWorkFolder(opened) : false;
  const archived = opened ? isWorkItemArchived(opened) : false;
  const parent = isSubtask && opened?.parentId
    ? (tasks.find((item) => item.id === opened.parentId) ?? null)
    : opened;
  const { statuses } = useTaskStatuses(listId, parent?.id ?? null);
  const children = parent
    ? sortTasksLikeNavTree(subtasks(parent.id), statuses)
    : [];
  const nested = parent ? childTasks(parent.id) : [];
  const progress = parent
    ? workProgressById(tasks, statuses).get(parent.id)
    : undefined;

  if (!isReady) {
    return (
      <SectionPage
        title={t("tasks.detail.loading", "Ielādē uzdevumu")}
        subtitle={t("lists.page.subtitle", "Saraksti ar uzdevumiem.")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!list || !opened || !parent) {
    return (
      <SectionPage
        title={t("tasks.detail.missing", "Uzdevums nav atrasts")}
        subtitle={t(
          "tasks.detail.missing_description",
          "Šis uzdevums vairs nav pieejams.",
        )}
      >
        <Link
          href={list ? `/lists/${list.id}` : "/lists"}
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("lists.back", "Atpakaļ uz sarakstiem")}
        </Link>
      </SectionPage>
    );
  }

  return (
    <SectionPage
      title={
        <span className="inline-flex items-center gap-2">
          <span>{parent.title}</span>
          {progress ? (
            <WorkProgressLabel
              progress={progress}
              className="text-sm font-medium tabular-nums text-zinc-400"
            />
          ) : null}
          {!isSubtask ? <WorkItemArchiveButton task={parent} /> : null}
          {!isSubtask &&
          !isFolder &&
          listAccess.canCreateTasks &&
          !archived ? (
            <IconActionButton
              label={t("subtasks.add.title", "Jauns apakšuzdevums")}
              icon="fas fa-plus"
              variant="muted"
              onClick={() => setCreateSubtaskOpen(true)}
            />
          ) : null}
        </span>
      }
      subtitle={
        parent.description ||
        t("tasks.detail.empty_description", "Šim uzdevumam vēl nav apraksta.")
      }
      actions={
        isFolder ? (
          listAccess.canCreateTasks && !archived ? (
            <button
              type="button"
              onClick={(event) => {
                setParentCreate({
                  listId: list.id,
                  parentId: parent.id,
                  variant: "folder",
                  anchor: createMenuAnchorFromEvent(event),
                });
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <i className="fas fa-plus text-xs" aria-hidden="true" />
              {t("create.menu.title", "Izveidot")}
            </button>
          ) : undefined
        ) : canViewArchive ? (
          <IconActionButton
            label={t("subtasks.archive", "Arhīvs")}
            icon="fas fa-archive"
            variant="delete"
            pressed={archiveOpen}
            onClick={() => setArchiveOpen((current) => !current)}
          />
        ) : undefined
      }
    >
      {isFolder ? (
        <ListWindowsBoard
          listId={list.id}
          parentId={parent.id}
          tasks={nested}
          onOpenSubtask={(task) => setBoardSubtaskId(task.id)}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white px-3 py-3">
          <GroupedSubtaskTables
            listId={list.id}
            tasks={children}
            includeClosed={archiveOpen && canViewArchive}
            onOpenTask={(task) => {
              router.push(`/lists/${list.id}/tasks/${task.id}`);
            }}
          />
        </div>
      )}

      <SubtaskDetailModal
        taskId={
          isSubtask
            ? opened.id
            : createSubtaskOpen
              ? null
              : boardSubtaskId
        }
        createFor={
          createSubtaskOpen
            ? { listId: list.id, parentId: parent.id }
            : null
        }
        open={isSubtask || createSubtaskOpen || boardSubtaskId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSubtaskOpen(false);
            setBoardSubtaskId(null);
            if (isSubtask) {
              router.push(`/lists/${list.id}/tasks/${parent.id}`);
            }
          }
        }}
      />

      <ParentCreateFlow
        context={parentCreate}
        onClose={() => setParentCreate(null)}
      />
    </SectionPage>
  );
}
