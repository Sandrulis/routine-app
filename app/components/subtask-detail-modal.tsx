"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalSplitPanelMaxWidthClassName,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { FilePreview } from "@/app/components/file-preview";
import { ListBadge } from "@/app/components/list-badge";
import { NameFormModal } from "@/app/components/name-form-modal";
import { StatusControl, useStatusLabels } from "@/app/components/status-control";
import { AssigneeCell, DateCell } from "@/app/components/subtask-table";
import { TaskAttachments } from "@/app/components/task-attachments";
import { Tooltip } from "@/app/components/tooltip";
import { UserAvatar } from "@/app/components/user-avatar";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import { mimeFromName } from "@/app/lib/list-files";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";
import {
  createTaskFileId,
  readTaskFileContent,
  sameIds,
  taskFilePreviewUrl,
  type TaskActivity,
} from "@/app/lib/task-activity";
import type { WorkTask, WorkTaskStatus } from "@/app/lib/lists";

type SubtaskDraft = {
  title: string;
  description: string;
  status: WorkTaskStatus;
  startDate: string | null;
  dueDate: string | null;
  assigneeIds: string[];
};

const emptyDraft: SubtaskDraft = {
  title: "",
  description: "",
  status: "todo",
  startDate: null,
  dueDate: null,
  assigneeIds: [],
};

function draftFromTask(task: WorkTask): SubtaskDraft {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    startDate: task.startDate,
    dueDate: task.dueDate,
    assigneeIds: [...task.assigneeIds],
  };
}

function normalizeDraft(draft: SubtaskDraft): SubtaskDraft {
  return {
    ...draft,
    title: draft.title.trim(),
    description: draft.description.trim(),
  };
}

function draftsEqual(left: SubtaskDraft, right: SubtaskDraft) {
  const a = normalizeDraft(left);
  const b = normalizeDraft(right);
  return (
    a.title === b.title &&
    a.description === b.description &&
    a.status === b.status &&
    a.startDate === b.startDate &&
    a.dueDate === b.dueDate &&
    sameIds(a.assigneeIds, b.assigneeIds)
  );
}

function activityTime(value: string) {
  return formatDisplayDateDdMmYy(value);
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
  const { showFeedback } = useFeedbackToast();
  const {
    lists,
    tasks,
    addTask,
    updateTask,
    addTaskFile,
    renameTaskFile,
    removeTaskFile,
    taskActivities,
    taskFiles,
  } = useLists();
  const { members } = useTeam();
  const [draft, setDraft] = useState<SubtaskDraft>(emptyDraft);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [forceCreate, setForceCreate] = useState(false);
  const createParentRef = useRef<{ listId: string; parentId: string } | null>(
    null,
  );
  const titleInputRef = useRef<HTMLInputElement>(null);
  const snapshotRef = useRef<SubtaskDraft>(emptyDraft);
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
  const [fileToView, setFileToView] = useState<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    content: string | null;
    revokeOnClose: boolean;
  } | null>(null);

  const isCreate = forceCreate || (Boolean(createFor) && !taskId && !createdTaskId);
  const activeTaskId = forceCreate ? null : (taskId ?? createdTaskId);
  const task = activeTaskId
    ? (tasks.find((item) => item.id === activeTaskId) ?? null)
    : null;
  const parentListId = task?.listId ?? createFor?.listId;
  const list = parentListId
    ? (lists.find((item) => item.id === parentListId) ?? null)
    : null;
  const activities = task ? taskActivities(task.id) : [];
  const files = task ? taskFiles(task.id) : [];
  const createdAt =
    activities.find((item) => item.kind === "created")?.at ??
    activities.reduce<string | null>(
      (oldest, item) =>
        !oldest || item.at < oldest ? item.at : oldest,
      null,
    );
  const createdOn = createdAt ? formatDisplayDateDdMmYy(createdAt) : "";

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
  }, [open, task?.id]);

  useEffect(() => {
    if (open) return;
    setCreatedTaskId(null);
    setForceCreate(false);
    setFileToDelete(null);
    setFileToRename(null);
    setFileToView((current) => {
      if (current?.revokeOnClose && current.content) {
        URL.revokeObjectURL(current.content);
      }
      return null;
    });
    setPendingFiles((current) => {
      for (const item of current) {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      }
      return [];
    });
  }, [open]);

  const statusLabel = useStatusLabels();

  function activityText(item: TaskActivity) {
    if (item.kind === "created") {
      return t("subtasks.history.created", "Apakšuzdevums izveidots.");
    }
    if (item.kind === "status") {
      return t("subtasks.history.status", "Statuss: {from} → {to}", {
        from: item.fromStatus ? statusLabel[item.fromStatus] : "—",
        to: item.toStatus ? statusLabel[item.toStatus] : "—",
      });
    }
    if (item.kind === "assignees") {
      const names = (item.assigneeIds ?? [])
        .map((id) => members.find((member) => member.id === id)?.name)
        .filter(Boolean)
        .join(", ");
      return t("subtasks.history.assignees", "Piesaistītie: {names}", {
        names: names || t("todo.fields.unassigned", "Nepiešķirts"),
      });
    }
    if (item.kind === "start_date") {
      return t("subtasks.history.start_date", "Sākums: {date}", {
        date: item.dateValue ? formatDisplayDateDdMmYy(item.dateValue) : "—",
      });
    }
    if (item.kind === "due_date") {
      return t("subtasks.history.due_date", "Termiņš: {date}", {
        date: item.dateValue ? formatDisplayDateDdMmYy(item.dateValue) : "—",
      });
    }
    if (item.kind === "comment") {
      return item.text ?? "";
    }
    if (item.kind === "file") {
      return t("subtasks.history.file", "Pievienots fails: {name}", {
        name: item.fileName ?? "",
      });
    }
    return "";
  }

  async function handleAddAttachments(selected: File[]) {
    if (task) {
      let storedWithoutPreview = false;
      for (const file of selected) {
        const record = await addTaskFile(task.id, file);
        if (file.size > 0 && !record.hasContent) storedWithoutPreview = true;
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

  function requestViewAttachment(fileId: string) {
    const pending = pendingFiles.find((item) => item.id === fileId);
    if (pending) {
      const content =
        pending.previewUrl ?? URL.createObjectURL(pending.file);
      setFileToView({
        id: pending.id,
        name: pending.name,
        mimeType: pending.file.type || mimeFromName(pending.name),
        size: pending.file.size,
        content,
        revokeOnClose: !pending.previewUrl,
      });
      return;
    }

    const stored = files.find((file) => file.id === fileId);
    if (!stored) return;
    setFileToView({
      id: stored.id,
      name: stored.name,
      mimeType: stored.mimeType,
      size: stored.size,
      content: readTaskFileContent(stored.id) ?? taskFilePreviewUrl(stored),
      revokeOnClose: false,
    });
  }

  function closeViewAttachment() {
    setFileToView((current) => {
      if (current?.revokeOnClose && current.content) {
        URL.revokeObjectURL(current.content);
      }
      return null;
    });
  }

  function confirmRenameAttachment(name: string) {
    if (!fileToRename) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const pending = pendingFiles.find((item) => item.id === fileToRename.id);
    if (pending) {
      setPendingFiles((current) =>
        current.map((item) =>
          item.id === fileToRename.id ? { ...item, name: trimmed } : item,
        ),
      );
    } else {
      renameTaskFile(fileToRename.id, trimmed);
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
  const dirty = !draftsEqual(draft, snapshotRef.current);
  const canSave = Boolean(trimmedTitle) && dirty;
  const showAddNew =
    Boolean(trimmedTitle) &&
    !canSave &&
    Boolean(
      createFor || (task?.listId && task.parentId) || createParentRef.current,
    );

  function startNewSubtask() {
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
      });
      for (const item of pendingFiles) {
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
    updateTask(task.id, {
      title: next.title,
      description: next.description,
      status: next.status,
      startDate: next.startDate,
      dueDate: next.dueDate,
      assigneeIds: next.assigneeIds,
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
        fileToRename !== null ||
        fileToView !== null
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
    >
      <form
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => event.preventDefault()}
        className="space-y-4"
      >
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="space-y-4">
            <div>
              <label htmlFor="subtask-title" className="sr-only">
                {t("tasks.fields.title", "Nosaukums")}
              </label>
              <input
                ref={titleInputRef}
                id="subtask-title"
                value={draft.title}
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
                {t("tasks.fields.description", "Apraksts")}
              </label>
              <textarea
                id="subtask-description"
                value={draft.description}
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
                    <ListBadge name={list.name} icon={list.icon} color={list.color} />
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
                    status={draft.status}
                    onChange={(status) =>
                      setDraft((current) => ({ ...current, status }))
                    }
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
                    onChange={(assigneeIds) =>
                      setDraft((current) => ({ ...current, assigneeIds }))
                    }
                  />
                </div>
              </div>
            </div>

            <TaskAttachments
              files={[
                ...files.map((file) => ({
                  id: file.id,
                  name: file.name,
                  mimeType: file.mimeType,
                  previewUrl: taskFilePreviewUrl(file),
                })),
                ...pendingFiles.map((item) => ({
                  id: item.id,
                  name: item.name,
                  mimeType: item.file.type || mimeFromName(item.name),
                  previewUrl: item.previewUrl,
                })),
              ]}
              onAdd={(selected) => {
                void handleAddAttachments(selected);
              }}
              onView={requestViewAttachment}
              onRename={requestRenameAttachment}
              onRemove={requestRemoveAttachment}
            />
          </div>

          <aside className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <h3 className="px-1 text-[12px] font-semibold tracking-wide text-zinc-400 uppercase">
              {t("subtasks.modal.history", "Vēsture")}
            </h3>
            {activities.length === 0 ? (
              <p className="mt-3 px-1 text-sm text-zinc-400">
                {t("subtasks.history.empty", "Vēl nav vēstures ierakstu.")}
              </p>
            ) : (
              <ol className="mt-3 space-y-3">
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
                        <p className="mt-0.5 text-[11px] text-zinc-400">
                          {activityTime(item.at)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
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
      descriptionLabel={t("lists.fields.description", "Apraksts")}
      descriptionPlaceholder={t(
        "lists.fields.description_placeholder",
        "Īss apraksts",
      )}
      submitLabel={t("actions.save", "Saglabāt")}
      showDescription={false}
      initialValue={
        fileToRename
          ? { name: fileToRename.name, description: "" }
          : null
      }
      onCreate={(input) => confirmRenameAttachment(input.name)}
    />
    <AppModal
      open={fileToView !== null}
      onOpenChange={(open) => {
        if (!open) closeViewAttachment();
      }}
      title={fileToView?.name ?? t("actions.view", "Apskatīt")}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      {fileToView ? (
        <FilePreview
          file={{
            name: fileToView.name,
            mimeType: fileToView.mimeType,
            size: fileToView.size,
          }}
          content={fileToView.content}
        />
      ) : null}
    </AppModal>
    </>
  );
}
