"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createMenuAnchorFromEvent } from "@/app/components/create-item-menu";
import { DragHandle } from "@/app/components/drag-handle";
import { ParentCreateFlow, type ParentCreateContext } from "@/app/components/parent-create-flow";
import { SectionPage } from "@/app/components/section-page";
import {
  SortableTaskGroup,
  SortableTaskItem,
} from "@/app/components/sortable-task-group";
import { SubtaskDetailModal } from "@/app/components/subtask-detail-modal";
import { SubtaskTable } from "@/app/components/subtask-table";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { isWorkFolder, isWorkSubtask, workItemIcon } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import {
  childListFiles,
  fileIconClassName,
  filePageHref,
  reorderStoredListFiles,
} from "@/app/lib/list-files";
import { useListFiles } from "@/app/lib/use-list-files";

export function TaskDetailPage({
  listId,
  taskId,
}: {
  listId: string;
  taskId: string;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { lists, tasks, childTasks, subtasks, isReady, reorderTasks } = useLists();
  const files = useListFiles();
  const [parentCreate, setParentCreate] = useState<ParentCreateContext | null>(
    null,
  );
  const [createSubtaskOpen, setCreateSubtaskOpen] = useState(false);
  const list = lists.find((item) => item.id === listId) ?? null;
  const opened = tasks.find((item) => item.id === taskId) ?? null;
  const isSubtask = opened ? isWorkSubtask(opened) : false;
  const isFolder = opened ? isWorkFolder(opened) : false;
  const parent = isSubtask && opened?.parentId
    ? (tasks.find((item) => item.id === opened.parentId) ?? null)
    : opened;
  const children = parent ? subtasks(parent.id) : [];
  const nested = parent ? childTasks(parent.id) : [];
  const folderFiles =
    isFolder && parent && list
      ? childListFiles(files, list.id, parent.id)
      : [];
  const folderEntries = [
    ...nested.map((item) => ({
      kind: "task" as const,
      id: item.id,
      sortOrder: item.sortOrder,
      task: item,
    })),
    ...folderFiles.map((file) => ({
      kind: "file" as const,
      id: file.id,
      sortOrder: file.sortOrder,
      file,
    })),
  ].sort((left, right) =>
    left.sortOrder !== right.sortOrder
      ? left.sortOrder - right.sortOrder
      : left.id.localeCompare(right.id),
  );

  if (!isReady) {
    return (
      <SectionPage
        title={t("tasks.detail.loading", "Ielādē uzdevumu")}
        subtitle={t("lists.page.subtitle", "Saraksti ar uzdevumiem.")}
      >
        <div className="h-32 rounded-3xl border border-zinc-200 bg-white" />
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
      title={parent.title}
      subtitle={
        parent.description ||
        t("tasks.detail.empty_description", "Šim uzdevumam vēl nav apraksta.")
      }
      actions={
        <button
          type="button"
          onClick={(event) => {
            if (isFolder) {
              setParentCreate({
                listId: list.id,
                parentId: parent.id,
                variant: "folder",
                anchor: createMenuAnchorFromEvent(event),
              });
              return;
            }
            setCreateSubtaskOpen(true);
          }}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {isFolder
            ? t("create.menu.title", "Izveidot")
            : t("subtasks.add.button", "Pievienot")}
        </button>
      }
    >
      {isFolder ? (
        folderEntries.length > 0 ? (
          <SortableTaskGroup
            itemIds={folderEntries.map((item) => item.id)}
            contextId={`folder-${parent.id}`}
            onReorder={(orderedIds) => {
              reorderTasks(orderedIds);
              reorderStoredListFiles(orderedIds);
            }}
          >
            <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {folderEntries.map((entry) => {
                const canReorder = folderEntries.length > 1;
                if (entry.kind === "file") {
                  return (
                    <SortableTaskItem
                      key={entry.file.id}
                      id={entry.file.id}
                      as="li"
                      disabled={!canReorder}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      {({ attributes, listeners, isDragging }) => (
                        <div
                          className={`flex items-center gap-1 px-2 py-1 ${
                            isDragging ? "bg-zinc-50 shadow-sm" : "hover:bg-zinc-50"
                          }`}
                        >
                          {canReorder ? (
                            <span onPointerDown={(event) => event.stopPropagation()}>
                              <DragHandle
                                label={t("subtasks.drag", "Mainīt secību")}
                                attributes={attributes}
                                listeners={listeners}
                              />
                            </span>
                          ) : null}
                          <Link
                            href={filePageHref(list.id, entry.file.id)}
                            className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm font-medium text-zinc-900"
                          >
                            <i
                              className={`${fileIconClassName(entry.file.name)} w-4 text-center text-[13px]`}
                              aria-hidden="true"
                            />
                            <span className="truncate">{entry.file.name}</span>
                          </Link>
                        </div>
                      )}
                    </SortableTaskItem>
                  );
                }

                const item = entry.task;
                return (
                  <SortableTaskItem
                    key={item.id}
                    id={item.id}
                    as="li"
                    disabled={!canReorder}
                    className="border-b border-zinc-100 last:border-b-0"
                  >
                    {({ attributes, listeners, isDragging }) => (
                      <div
                        className={`flex items-center gap-1 px-2 py-1 ${
                          isDragging ? "bg-zinc-50 shadow-sm" : "hover:bg-zinc-50"
                        }`}
                      >
                        {canReorder ? (
                          <span onPointerDown={(event) => event.stopPropagation()}>
                            <DragHandle
                              label={t("subtasks.drag", "Mainīt secību")}
                              attributes={attributes}
                              listeners={listeners}
                            />
                          </span>
                        ) : null}
                        <Link
                          href={`/lists/${list.id}/tasks/${item.id}`}
                          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm font-medium text-zinc-900"
                        >
                          <i
                            className={`${workItemIcon(item)} w-4 text-center text-[12px] text-zinc-400`}
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            <OptionalTooltip label={item.description}>
                              <span className="block truncate">{item.title}</span>
                            </OptionalTooltip>
                          </span>
                        </Link>
                      </div>
                    )}
                  </SortableTaskItem>
                );
              })}
            </ul>
          </SortableTaskGroup>
        ) : (
          <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
            {t("folders.empty", "Šajā mapē vēl nav uzdevumu.")}
          </div>
        )
      ) : (
        <SubtaskTable
          listId={list.id}
          tasks={children}
          onOpenTask={(task) => {
            router.push(`/lists/${list.id}/tasks/${task.id}`);
          }}
        />
      )}

      <SubtaskDetailModal
        taskId={isSubtask ? opened.id : null}
        createFor={
          createSubtaskOpen
            ? { listId: list.id, parentId: parent.id }
            : null
        }
        open={isSubtask || createSubtaskOpen}
        onOpenChange={(open) => {
          if (!open) {
            setCreateSubtaskOpen(false);
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
