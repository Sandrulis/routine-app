"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AppModal,
  appModalSplitPanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import {
  FileUploadOverlay,
  type FileUploadProgressState,
} from "@/app/components/file-upload-overlay";
import { ListBadge } from "@/app/components/list-badge";
import { NameFormModal } from "@/app/components/name-form-modal";
import { StatusControl, useStatusLabels } from "@/app/components/status-control";
import { AssigneeCell, DateCell } from "@/app/components/subtask-table";
import { TaskAttachments } from "@/app/components/task-attachments";
import { TaskChecklists } from "@/app/components/task-checklists";
import { RelativeTime } from "@/app/components/relative-time";
import { Tooltip } from "@/app/components/tooltip";
import { UserAvatar } from "@/app/components/user-avatar";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { mimeFromName } from "@/app/lib/list-files";
import {
  fileBaseName,
  fileExtensionFromName,
  renameKeepingExtension,
} from "@/app/lib/file-types";
import { useFileViewer } from "@/app/components/file-viewer-provider";
import { batchUploadPercent } from "@/app/lib/google-drive/queue-upload";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { useLists } from "@/app/lib/lists-store";
import { ensureTaskFileContent } from "@/app/lib/file-content";
import { useTaskActivities } from "@/app/lib/task-activities-cache";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import {
  resolveEffectiveListAccess,
  userIsAssignee,
} from "@/app/lib/list-access";
import {
  createTaskFileId,
  sameIds,
  taskFilePreviewUrl,
  type TaskActivity,
} from "@/app/lib/task-activity";
import { assigneeDisplayNames } from "@/app/lib/assignees";
import { formatTaskActivityText } from "@/app/lib/format-task-activity-text";
import { TaskLocationPath } from "@/app/components/task-location-path";
import { isTaskDeleted, getParentTaskLocationSegments, getSubtaskLocationSegments, type WorkTask, type WorkTaskStatus } from "@/app/lib/lists";
import {
  checklistsEqual,
  checklistProgress,
  normalizeTaskChecklists,
  taskHasIncompleteChecklists,
  type TaskChecklist,
} from "@/app/lib/task-checklists";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import { isListStatusGroup } from "@/app/lib/list-statuses";

type SubtaskDraft = {
  title: string;
  description: string;
  status: WorkTaskStatus;
  startDate: string | null;
  dueDate: string | null;
  assigneeIds: string[];
  checklists: TaskChecklist[];
};

const emptyDraft: SubtaskDraft = {
  title: "",
  description: "",
  status: "todo",
  startDate: null,
  dueDate: null,
  assigneeIds: [],
  checklists: [],
};

function ScrollableHistoryList({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLOListElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const syncOverflow = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollHeight - el.clientHeight;
    setCanScrollUp(el.scrollTop > 2);
    setCanScrollDown(max > 2 && el.scrollTop < max - 2);
  }, []);

  useLayoutEffect(() => {
    syncOverflow();
    const el = ref.current;
    if (!el) return;
    const resize = new ResizeObserver(syncOverflow);
    resize.observe(el);
    const mutation = new MutationObserver(syncOverflow);
    mutation.observe(el, { childList: true, subtree: true });
    return () => {
      resize.disconnect();
      mutation.disconnect();
    };
  }, [syncOverflow, children]);

  return (
    <div className="relative mt-3 min-h-0 flex-1">
      <ol
        ref={ref}
        onScroll={syncOverflow}
        className="absolute inset-0 space-y-3 overflow-y-scroll overscroll-contain pr-0.5 [scrollbar-color:rgb(161_161_170)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-400"
      >
        {children}
      </ol>
      {canScrollUp ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 flex h-[42px] items-start justify-center bg-gradient-to-b from-zinc-50 via-zinc-50/90 to-transparent pt-0.5"
          aria-hidden="true"
        >
          <i className="fas fa-chevron-up text-[10px] text-zinc-400" />
        </div>
      ) : null}
      {canScrollDown ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[42px] items-end justify-center bg-gradient-to-t from-zinc-50 via-zinc-50/90 to-transparent pb-0.5"
          aria-hidden="true"
        >
          <i className="fas fa-chevron-down text-[10px] text-zinc-400" />
        </div>
      ) : null}
    </div>
  );
}

function draftFromTask(task: WorkTask): SubtaskDraft {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assigneeIds: [...task.assigneeIds],
    checklists: (task.checklists ?? []).map((list) => ({
      ...list,
      items: list.items.map((item) => ({ ...item })),
    })),
  };
}

function normalizeDraft(draft: SubtaskDraft): SubtaskDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
    checklists: normalizeTaskChecklists(draft.checklists),
  };
}

function draftsEqual(left: SubtaskDraft, right: SubtaskDraft) {
  const a = normalizeDraft(left);
  const b = normalizeDraft(right);
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.startDate === b.startDate &&
    a.dueDate === b.dueDate &&
    sameIds(a.assigneeIds, b.assigneeIds) &&
    checklistsEqual(a.checklists, b.checklists)
  );
}

export function SubtaskDetailModal({
  taskId,
  createFor,
  open,
  onOpenChange,
  onCreated,
}: {
  taskId: string | null;
  createFor?: { listId: string; parentId: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (task: WorkTask) => void;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { showFeedback } = useFeedbackToast();
  const { openFile, openTaskFile } = useFileViewer();
  const {
    lists,
    tasks,
    addTask,
    updateTask,
    addTaskFile,
    renameTaskFile,
    removeTaskFile,
    taskFiles,
  } = useLists();
  const { members, currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const checklistsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.checklist);
  const [draft, setDraft] = useState<SubtaskDraft>(emptyDraft);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [forceCreate, setForceCreate] = useState(false);
  const createParentRef = useRef<{ listId: string; parentId: string } | null>(
    null,
  );
  const titleInputRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef<SubtaskDraft>(emptyDraft);
  const persistChecklistsTimerRef = useRef<number | null>(null);
  const persistChecklistsTargetRef = useRef<{
    taskId: string;
    checklists: TaskChecklist[];
  } | null>(null);
  const [pendingFiles, setPendingFiles] = useState<
    Array<{ id: string; file: File; name: string; previewUrl: string | null }>
  >([]);
  const [fileToDelete, setFileToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [fileToRename, setFileToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [uploadProgress, setUploadProgress] =
    useState<FileUploadProgressState | null>(null);

  const isCreate = forceCreate || (Boolean(createFor) && !taskId && !createdTaskId);
  const activeTaskId = forceCreate ? null : (taskId ?? createdTaskId);
  const task = activeTaskId
    ? (tasks.find((item) => item.id === activeTaskId) ?? null)
    : null;
  const parentListId = task?.listId ?? createFor?.listId;
  const list = parentListId
    ? (lists.find((item) => item.id === parentListId) ?? null)
    : null;
  const access = resolveEffectiveListAccess(list, currentUser, roles, isAdmin, {
    isAssignee: userIsAssignee(draft.assigneeIds, currentUser),
  });
  // Sync assigneeIds from store when automation adds a person
  useEffect(() => {
    if (!task) return;
    setDraft((current) => {
      if (sameIds(current.assigneeIds, task.assigneeIds)) return current;
      return { ...current, assigneeIds: [...task.assigneeIds] };
    });
  }, [task]);

  const deleted = Boolean(task && isTaskDeleted(task));
  const activities = useTaskActivities(task?.id);
  const files = task ? taskFiles(task.id) : [];
  const createdAt =
    task?.createdAt ??
    activities.find((item) => item.kind === "created")?.at ??
    activities.reduce<string | null>(
      (oldest, item) =>
        !oldest || item.at < oldest ? item.at : oldest,
      null,
    );
  const createdOn = createdAt ? formatDate(createdAt) : "";
  const checklistBlocked =
    checklistsEnabled && taskHasIncompleteChecklists(draft.checklists);
  const checklistsProgress = checklistsEnabled
    ? checklistProgress(draft.checklists)
    : { done: 0, total: 0, percent: 0 };
  const checklistBlockedLabel = t(
    "subtasks.checklist.incomplete",
    "Vispirms izpildi visus kontrolsaraksta punktus.",
  );
  const listName = list?.name ?? null;
  const locationSegments = task
    ? getSubtaskLocationSegments(tasks, task, listName)
    : createFor?.parentId && parentListId
      ? getParentTaskLocationSegments(
          tasks,
          createFor.parentId,
          parentListId,
          listName,
        )
      : listName && parentListId
        ? [{ type: "list" as const, listId: parentListId, label: listName }]
        : [];

  const flushChecklistPersist = useCallback(() => {
    if (persistChecklistsTimerRef.current) {
      window.clearTimeout(persistChecklistsTimerRef.current);
      persistChecklistsTimerRef.current = null;
    }
    const pending = persistChecklistsTargetRef.current;
    if (!pending) return;
    persistChecklistsTargetRef.current = null;
    updateTask(pending.taskId, {
      checklists: normalizeTaskChecklists(pending.checklists),
    });
  }, [updateTask]);

  function commitChecklists(next: TaskChecklist[]) {
    setDraft((current) => ({ ...current, checklists: next }));
    if (!task || isCreate || deleted || (!access.canEditTasks && !access.canChangeStatus)) {
      return;
    }
    snapshotRef.current = {
      ...snapshotRef.current,
      checklists: normalizeTaskChecklists(next),
    };
    persistChecklistsTargetRef.current = { taskId: task.id, checklists: next };
    if (persistChecklistsTimerRef.current) {
      window.clearTimeout(persistChecklistsTimerRef.current);
    }
    persistChecklistsTimerRef.current = window.setTimeout(() => {
      flushChecklistPersist();
    }, 300);
  }

  useEffect(() => {
    if (createFor) {
      createParentRef.current = createFor;
      return;
    }
    if (task?.listId && task.parentId) {
      createParentRef.current = {
        listId: task.listId,
        parentId: task.parentId,
      };
    }
  }, [createFor, task]);

  useEffect(() => {
    if (!open) return;
    const next = task ? draftFromTask(task) : emptyDraft;
    snapshotRef.current = next;
    setDraft(next);
  }, [open, task]);

  useEffect(() => {
    if (open) return;
    flushChecklistPersist();
    setCreatedTaskId(null);
    setForceCreate(false);
    setFileToDelete(null);
    setFileToRename(null);
    setPendingFiles((current) => {
      for (const item of current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
  }, [flushChecklistPersist, open]);

  const statusLabel = useStatusLabels();
  const { labelFor, groupKeyFor } = useTaskStatuses(parentListId, task?.parentId ?? createFor?.parentId ?? null);

  function historyStatusName(statusId: string | undefined) {
    if (!statusId) return "—";
    const catalogLabel = labelFor(statusId);
    if (catalogLabel && catalogLabel !== statusId) return catalogLabel;
    return statusLabel[statusId as WorkTaskStatus] || catalogLabel || "—";
  }

  function activityText(item: TaskActivity) {
    return formatTaskActivityText({
      item,
      t,
      assigneeName: (assigneeIds) =>
        assigneeDisplayNames(assigneeIds ?? [], members, roles, t),
      formatDate,
      parentTaskTitle: (parentId) => {
        if (!parentId) return "—";
        return tasks.find((entry) => entry.id === parentId)?.title ?? "—";
      },
      historyStatusName,
    });
  }

  async function handleAddAttachments(selected: File[]) {
    if (!fileUploadsEnabled) return;
    if (isCreate ? !access.canCreateTasks : !access.canEditTasks) return;
    if (uploadProgress) return;
    if (task) {
      let storedWithoutPreview = false;
      const total = selected.length;
      try {
        for (let index = 0; index < selected.length; index += 1) {
          const file = selected[index];
          const updateProgress = (filePercent: number) => {
            setUploadProgress({
              fileName: file.name.trim() || "file",
              current: index + 1,
              total,
              percent: batchUploadPercent(index, total, filePercent),
            });
          };
          updateProgress(0);
          const record = await addTaskFile(task.id, file, {
            onProgress: updateProgress,
          });
          if (!record) {
            showFeedback({
              type: "error",
              text: t(
                "files.save.failed",
                "Neizdevās saglabāt failu. Mēģini vēlreiz.",
              ),
            });
            break;
          }
          if (
            file.size > 0 &&
            !record.hasContent &&
            !record.googleDriveFileId
          ) {
            storedWithoutPreview = true;
          }
          updateProgress(100);
        }
      } finally {
        setUploadProgress(null);
      }
      if (storedWithoutPreview) {
        showFeedback({
          type: "info",
          text: t(
            "files.created_without_preview",
            "Fails pievienots, bet saturu nevarēja saglabāt priekšskatījumam.",
          ),
        });
      }
      return;
    }

    setPendingFiles((current) => [
      ...current,
      ...selected.map((file) => ({
        id: createTaskFileId(),
        file,
        name: file.name.trim() || "file",
        previewUrl: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
      })),
    ]);
  }

  function requestRemoveAttachment(fileId: string) {
    const pending = pendingFiles.find((item) => item.id === fileId);
    const stored = files.find((file) => file.id === fileId);
    const name = pending?.name ?? stored?.name;
    if (!name) return;
    setFileToDelete({ id: fileId, name });
  }

  function requestRenameAttachment(fileId: string) {
    const pending = pendingFiles.find((item) => item.id === fileId);
    const stored = files.find((file) => file.id === fileId);
    const name = pending?.name ?? stored?.name;
    if (!name) return;
    setFileToRename({ id: fileId, name });
  }

  async function requestDownloadAttachment(fileId: string) {
    const {
      downloadUrlAsFile,
      fetchGoogleDriveContentBlob,
      triggerBrowserDownload,
    } = await import("@/app/lib/google-drive/content-url");

    const pending = pendingFiles.find((item) => item.id === fileId);
    if (pending) {
      const url = URL.createObjectURL(pending.file);
      triggerBrowserDownload(url, pending.name, true);
      return;
    }

    const stored = files.find((file) => file.id === fileId);
    if (!stored) return;

    async function downloadFromDrive() {
      const blob = await fetchGoogleDriveContentBlob("task", stored!.id);
      if (!blob) return false;
      const url = URL.createObjectURL(blob);
      triggerBrowserDownload(url, stored!.name, true);
      return true;
    }

    // Drive-primary: prefer Drive when ID is known, then fall back to DB content.
    if (stored.googleDriveFileId) {
      if (await downloadFromDrive()) return;
    }

    const local = await ensureTaskFileContent(stored.id);
    if (local) {
      try {
        await downloadUrlAsFile(local, stored.name);
        return;
      } catch (error) {
        console.error("Local file download failed", error);
      }
    }

    // Client may lack googleDriveFileId while DB still has it.
    if (!stored.googleDriveFileId && (await downloadFromDrive())) return;

    showFeedback({
      type: "error",
      text: t("files.download.failed", "Neizdevās lejupielādēt failu."),
    });
  }

  function requestViewAttachment(fileId: string) {
    const pending = pendingFiles.find((item) => item.id === fileId);
    if (pending) {
      openFile({
        kind: "local",
        id: pending.id,
        name: pending.name,
        mimeType: pending.file.type || mimeFromName(pending.name),
        size: pending.file.size,
        contentUrl: pending.previewUrl ?? URL.createObjectURL(pending.file),
        revokeContentOnClose: !pending.previewUrl,
      });
      return;
    }

    const stored = files.find((file) => file.id === fileId);
    if (!stored) return;
    openTaskFile(stored);
  }

  function confirmRenameAttachment(name: string) {
    if (!fileToRename) return;
    const nextName = renameKeepingExtension(fileToRename.name, name);
    if (!nextName) return;
    const pending = pendingFiles.find((item) => item.id === fileToRename.id);
    if (pending) {
      setPendingFiles((current) =>
        current.map((item) =>
          item.id === fileToRename.id ? { ...item, name: nextName } : item,
        ),
      );
    } else {
      renameTaskFile(fileToRename.id, nextName);
    }
    showFeedback({
      type: "success",
      text: t("files.updated", "Fails pārsaukts."),
    });
    setFileToRename(null);
  }

  function confirmRemoveAttachment() {
    if (!fileToDelete) return;
    const pending = pendingFiles.find((item) => item.id === fileToDelete.id);
    if (pending) {
      if (pending.previewUrl) URL.revokeObjectURL(pending.previewUrl);
      setPendingFiles((current) =>
        current.filter((item) => item.id !== fileToDelete.id),
      );
    } else {
      removeTaskFile(fileToDelete.id);
    }
    showFeedback({
      type: "success",
      text: t("files.deleted", "Fails dzēsts."),
    });
    setFileToDelete(null);
  }

  const trimmedTitle = draft.title.trim();
  const statusGroupRaw = groupKeyFor(draft.status);
  const statusGroup = isListStatusGroup(statusGroupRaw) ? statusGroupRaw : "active";
  const dirty = !draftsEqual(draft, snapshotRef.current);
  const canSave =
    Boolean(trimmedTitle) &&
    dirty &&
    !deleted &&
    (isCreate ? access.canCreateTasks : access.canEditTasks || access.canChangeStatus);
  const showAddNew =
    Boolean(trimmedTitle) &&
    !canSave &&
    access.canCreateTasks &&
    Boolean(
      createFor || (task?.listId && task.parentId) || createParentRef.current,
    );

  function startNewSubtask() {
    flushChecklistPersist();
    setForceCreate(true);
    setCreatedTaskId(null);
    snapshotRef.current = emptyDraft;
    setDraft(emptyDraft);
    setPendingFiles((current) => {
      for (const item of current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
  }

  useLayoutEffect(() => {
    if (!open || !forceCreate || draft.title.trim()) return;
    titleInputRef.current?.focus();
  }, [draft.title, forceCreate, open]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSave) return;

    const next = normalizeDraft(draft);

    if (isCreate) {
      const parent = createFor ?? createParentRef.current;
      if (!parent) return;
      const created = addTask({
        listId: parent.listId,
        parentId: parent.parentId,
        kind: "subtask",
        title: next.title,
        description: next.description,
      });
      updateTask(created.id, {
        status: next.status,
        startDate: next.startDate,
        dueDate: next.dueDate,
        assigneeIds: next.assigneeIds,
        checklists: next.checklists,
      });
      for (const item of fileUploadsEnabled ? pendingFiles : []) {
        const upload =
          item.name === item.file.name
            ? item.file
            : new File([item.file], item.name, { type: item.file.type });
        await addTaskFile(created.id, upload);
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      setPendingFiles([]);
      snapshotRef.current = next;
      setDraft(next);
      setForceCreate(false);
      setCreatedTaskId(created.id);
      onCreated?.(created);
      showFeedback({
        type: "success",
        text: t("subtasks.created", "Apakšuzdevums pievienots."),
      });
      return;
    }

    if (!task) return;
    flushChecklistPersist();
    updateTask(task.id, {
      title: next.title,
      description: next.description,
      status: next.status,
      startDate: next.startDate,
      dueDate: next.dueDate,
      assigneeIds: next.assigneeIds,
      checklists: next.checklists,
    });
    snapshotRef.current = next;
    setDraft(next);
    showFeedback({
      type: "success",
      text: t("subtasks.updated", "Apakšuzdevums saglabāts."),
    });
  }

  if (!open) return null;
  if (!isCreate && !task) return null;

  return (
    <>
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={
        isCreate
          ? t("subtasks.add.title", "Jauns apakšuzdevums")
          : (task?.title ?? t("subtasks.edit.title", "Labot apakšuzdevumu"))
      }
      description={
        isCreate
          ? t(
              "subtasks.add.description",
              "Pievieno apakšuzdevumu šim uzdevumam.",
            )
          : t(
              "subtasks.edit.description",
              "Maini apakšuzdevuma nosaukumu vai aprakstu.",
            )
      }
      dirty={dirty}
      blocking={
        fileToDelete !== null ||
        fileToRename !== null
      }
      panelMaxWidthClassName={appModalSplitPanelMaxWidthClassName}
      headerMeta={
        createdOn ? (
          <time
            dateTime={createdAt ?? undefined}
            className="whitespace-nowrap px-1 text-[13px] text-zinc-400"
          >
            {t("subtasks.created_on", "izveidots {date}", {
              date: createdOn,
            })}
          </time>
        ) : null
      }
      headerSubtitle={
        locationSegments.length > 0 ? (
          <TaskLocationPath
            segments={locationSegments}
            align="left"
            onNavigate={() => onOpenChange(false)}
          />
        ) : null
      }
    >
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        className="space-y-4"
      >
        <div className="relative grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <div>
              <label htmlFor="subtask-title" className="sr-only">
                {t("tasks.fields.title", "Nosaukums")}
              </label>
              <input
                ref={titleInputRef}
                id="subtask-title"
                value={draft.title}
                readOnly={!access.canEditTasks && !isCreate}
                onChange={(event) => {
                  const title = event.target.value;
                  setDraft((current) => ({ ...current, title }));
                }}
                className="w-full bg-transparent text-xl font-bold text-zinc-900 outline-none placeholder:font-semibold placeholder:text-zinc-400"
                placeholder={t(
                  "subtasks.fields.title_placeholder",
                  "Apakšuzdevuma nosaukums",
                )}
                autoFocus={isCreate}
              />
            </div>

            <div>
              <label
                htmlFor="subtask-description"
                className="text-[12px] font-medium text-zinc-400"
              >
                {t("common.description", "Apraksts")}
              </label>
              <textarea
                id="subtask-description"
                value={draft.description}
                readOnly={!access.canEditTasks && !isCreate}
                onChange={(event) => {
                  const description = event.target.value;
                  setDraft((current) => ({ ...current, description }));
                }}
                rows={3}
                className="mt-1.5 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder={t(
                  "tasks.fields.description_placeholder",
                  "Īss uzdevuma apraksts",
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[12px] font-medium text-zinc-400">
                  {t("subtasks.modal.project", "Projekts")}
                </p>
                <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-zinc-900">
                  {list ? (
                    <ListBadge
                      name={list.name}
                      icon={list.icon}
                      color={list.color}
                      isPrivate={list.isPrivate}
                    />
                  ) : null}
                  <span className="truncate">
                    {list?.name ?? t("lists.detail.missing", "Saraksts nav atrasts")}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium text-zinc-400">
                  {t("subtasks.table.status", "Statuss")}
                </p>
                <div className="mt-1.5">
                  <StatusControl
                    listId={parentListId}
                    parentTaskId={task?.parentId ?? createFor?.parentId ?? null}
                    status={draft.status}
                    statusChangedAt={
                      deleted
                        ? task?.deletedAt
                        : task && draft.status === task.status
                          ? task.statusChangedAt ?? createdAt
                          : null
                    }
                    deleted={deleted}
                    disabled={!access.canChangeStatus || deleted}
                    completeBlocked={checklistBlocked}
                    completeBlockedLabel={checklistBlockedLabel}
                    checklistProgress={
                      checklistsProgress.total > 0 ? checklistsProgress : null
                    }
                    onChange={(status) => {
                      setDraft((current) => ({ ...current, status }));
                      if (!isCreate && task && !deleted && access.canChangeStatus) {
                        flushChecklistPersist();
                        updateTask(task.id, {
                          status,
                          checklists: normalizeTaskChecklists(draft.checklists),
                        });
                        snapshotRef.current = {
                          ...snapshotRef.current,
                          status,
                          checklists: normalizeTaskChecklists(draft.checklists),
                        };
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium text-zinc-400">
                  {t("tasks.fields.start_date", "Sākums")}
                </p>
                <div className="mt-1.5">
                  <DateCell
                    value={draft.startDate}
                    emptyLabel={t("tasks.fields.start_date", "Sākums")}
                    disabled={!access.canEditTasks}
                    fieldKind="start"
                    statusGroup={statusGroup}
                    onChange={(startDate) => {
                      setDraft((current) => ({ ...current, startDate }));
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-[12px] font-medium text-zinc-400">
                  {t("todo.fields.due_date", "Termiņš")}
                </p>
                <div className="mt-1.5">
                  <DateCell
                    value={draft.dueDate}
                    emptyLabel={t("todo.fields.due_date", "Termiņš")}
                    disabled={!access.canEditTasks}
                    fieldKind="due"
                    statusGroup={statusGroup}
                    onChange={(dueDate) => {
                      setDraft((current) => ({ ...current, dueDate }));
                    }}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <p className="text-[12px] font-medium text-zinc-400">
                  {t("todo.fields.assignee", "Atbildīgais")}
                </p>
                <div className="mt-1.5">
                  <AssigneeCell
                    assigneeIds={draft.assigneeIds}
                    disabled={!access.canEditTasks}
                    onChange={(assigneeIds) =>
                      setDraft((current) => ({ ...current, assigneeIds }))
                    }
                  />
                </div>
              </div>
            </div>

            {checklistsEnabled || draft.checklists.length > 0 ? (
              <TaskChecklists
                key={`checklists-${task?.id ?? "create"}`}
                checklists={draft.checklists}
                forceCollapsed={!checklistsEnabled}
                disabled={
                  deleted ||
                  (isCreate ? !access.canCreateTasks : !access.canEditTasks && !access.canChangeStatus)
                }
                structureLocked={
                  isCreate ? !access.canCreateTasks : !access.canEditTasks
                }
                onChange={commitChecklists}
              />
            ) : null}

            {fileUploadsEnabled ? (
            <TaskAttachments
              key={`attachments-${task?.id ?? "create"}`}
              files={[
                ...files.map((file) => ({
                  id: file.id,
                  name: file.name,
                  mimeType: file.mimeType,
                  size: file.size,
                  previewUrl: taskFilePreviewUrl(file),
                })),
                ...pendingFiles.map((item) => ({
                  id: item.id,
                  name: item.name,
                  mimeType: item.file.type || mimeFromName(item.name),
                  size: item.file.size,
                  previewUrl: item.previewUrl,
                })),
              ]}
              disabled={
                Boolean(uploadProgress) ||
                (isCreate ? !access.canCreateTasks : !access.canEditTasks)
              }
              onAdd={(selected) => {
                void handleAddAttachments(selected);
              }}
              onView={requestViewAttachment}
              onDownload={(fileId) => {
                void requestDownloadAttachment(fileId);
              }}
              onRename={requestRenameAttachment}
              onRemove={requestRemoveAttachment}
            />
            ) : null}
          </div>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-100 bg-zinc-50 p-3 md:absolute md:inset-y-0 md:right-0 md:w-[18rem]">
            <h3 className="shrink-0 px-1 text-[12px] font-semibold tracking-wide text-zinc-400 uppercase">
              {t("subtasks.modal.history", "Vēsture")}
            </h3>
            {activities.length === 0 ? (
              <p className="mt-3 min-h-0 flex-1 px-1 text-sm text-zinc-400">
                {t("subtasks.history.empty", "Vēl nav vēstures ierakstu.")}
              </p>
            ) : (
              <ScrollableHistoryList>
                {activities.map((item) => {
                  const actor = members.find((member) => member.id === item.actorId);
                  return (
                    <li key={item.id} className="flex gap-2">
                      {actor ? (
                        <UserAvatar member={actor} size="xs" />
                      ) : (
                        <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-[9px] text-zinc-500">
                          ?
                        </span>
                      )}
                      <div className="min-w-0">
                        <p className="text-[12px] font-medium text-zinc-700">
                          {actor?.name ?? t("todo.fields.unassigned", "Nepiešķirts")}
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap text-[13px] text-zinc-600">
                          {activityText(item)}
                        </p>
                        <p className="mt-0.5">
                          <RelativeTime at={item.at} />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ScrollableHistoryList>
            )}
          </aside>
        </div>

        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("actions.save", "Saglabāt")}
          </button>
          {showAddNew ? (
            <Tooltip label={t("actions.add_new", "Pievienot jaunu")} align="end">
              <button
                type="button"
                aria-label={t("actions.add_new", "Pievienot jaunu")}
                onClick={startNewSubtask}
                className="inline-flex size-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-700 transition hover:bg-zinc-200"
              >
                <i className="fas fa-plus text-sm" aria-hidden="true" />
              </button>
            </Tooltip>
          ) : null}
        </div>
      </form>
    </AppModal>
    <ConfirmModal
      open={fileToDelete !== null}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setFileToDelete(null);
      }}
      title={t("files.delete.title", "Dzēst failu?")}
      description={t("files.delete.description", "Fails “{name}” tiks dzēsts.", {
        name: fileToDelete?.name ?? "",
      })}
      confirmLabel={t("actions.delete", "Dzēst")}
      confirmVariant="danger"
      onConfirm={confirmRemoveAttachment}
    />
    <NameFormModal
      open={fileToRename !== null}
      onOpenChange={(open) => {
        if (!open) setFileToRename(null);
      }}
      title={t("files.edit.title", "Pārsaukt failu")}
      description={t("files.edit.description", "Maini faila nosaukumu.")}
      nameLabel={t("lists.fields.name", "Nosaukums")}
      namePlaceholder={t("files.fields.name_placeholder", "Faila nosaukums")}
      descriptionLabel={t("common.description", "Apraksts")}
      descriptionPlaceholder={t(
        "lists.fields.description_placeholder",
        "Īss apraksts",
      )}
      submitLabel={t("actions.save", "Saglabāt")}
      showDescription={false}
      nameSuffix={
        fileToRename
          ? (() => {
              const extension = fileExtensionFromName(fileToRename.name);
              return extension ? `.${extension}` : null;
            })()
          : null
      }
      initialValue={
        fileToRename
          ? { name: fileBaseName(fileToRename.name), description: "" }
          : null
      }
      onCreate={(input) => confirmRenameAttachment(input.name)}
    />
    <FileUploadOverlay progress={uploadProgress} />
    </>
  );
}
