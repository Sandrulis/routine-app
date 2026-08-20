"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createListId,
  createTaskId,
  getChildTasks,
  getListTasks,
  getSubtasks,
  nextSortOrder,
  applySortOrder,
  collectTaskSubtreeIds,
  getArchivedListRoots,
  getTaskAncestors,
  isWorkSubtask,
  type WorkTaskKind,
  listColorById,
  randomListColorId,
  isClosedTaskStatus,
  type WorkList,
  type WorkListKind,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import {
  templateSubtasks,
  templateTreeChildren,
  type WorkTemplateItem,
} from "@/app/lib/templates";
import {
  DEFAULT_LIST_ACCESS_LEVEL,
  accessIds,
  type ListAccessLevel,
} from "@/app/lib/list-access";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { memberIdsNotifiedForAssignees } from "@/app/lib/assignees";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { googleDrivePathForTaskFile } from "@/app/lib/google-drive/path";
import { queueGoogleDriveUpload } from "@/app/lib/google-drive/queue-upload";
import { queueOneDriveUpload } from "@/app/lib/onedrive/queue-upload";
import { useTeam } from "@/app/lib/team-store";
import {
  appendNotifications,
  notificationsForNewAssignees,
} from "@/app/lib/notifications";
import {
  buildTaskUpdateNotifications,
  notificationsForInitialAssignees,
  notificationsForNewSubtask,
  notificationsForTaskComment,
  notificationsForTaskFile,
  notificationsFromTaskActivities,
} from "@/app/lib/task-notifications";
import {
  buildFileRemovedActivity,
  buildFileRenamedActivity,
  buildSubtaskMovedActivity,
  buildTaskUpdateActivityEvents,
} from "@/app/lib/build-task-activity-events";
import {
  createActivity,
  createTaskFileId,
  hydrateTaskFileContents,
  cacheTaskFileContent,
  storeTaskFileContent,
  type TaskActivity,
  type TaskFile,
} from "@/app/lib/task-activity";
import {
  deleteStoredListFilesForList,
  deleteStoredListFilesForParents,
  childListFiles,
  hydrateListFiles,
  mimeFromName,
  nextItemSortOrder,
  readAllListFiles,
} from "@/app/lib/list-files";
import { isAllowedFileName } from "@/app/lib/file-types";
import {
  deleteListRow,
  deleteTaskFileRow,
  deleteTaskRow,
  deleteTeamStatusLabel,
  fetchTeamWorkspace,
  insertActivity,
  insertList,
  insertListStatus,
  insertTask,
  insertTaskFile,
  updateListRow,
  updateListStatusRow,
  updateListStatusSortOrders,
  deleteListStatusRow,
  insertWorkTaskStatus,
  updateWorkTaskStatusRow,
  deleteWorkTaskStatusRow,
  updateTaskFileName,
  formatSupabaseError,
  updateTaskRow,
  updateTaskSortOrders,
  updateTasksArchivedAt,
  upsertTeamStatusLabel,
  insertListAutomation,
  updateListAutomationRow,
  deleteListAutomationRow,
} from "@/app/lib/db/work-data";
import {
  createListStatusId,
  createWorkTaskStatusId,
  isListStatusGroup,
  normalizeStatusColor,
  type ListStatus,
  type WorkTaskStatusDef,
} from "@/app/lib/list-statuses";
import {
  createListAutomationId,
  activeStatusChangedAssignRules,
  activeChecklistCompletedRules,
  activeAllSubtasksCompletedRules,
  type AutomationActionKind,
  type AutomationConfig,
  type AutomationTriggerKind,
  type ListAutomation,
} from "@/app/lib/list-automations";
import {
  normalizeTaskChecklists,
  taskHasIncompleteChecklists,
  templateChecklistsForApply,
  type TaskChecklist,
} from "@/app/lib/task-checklists";

type ListsContextValue = {
  isReady: boolean;
  lists: WorkList[];
  tasks: WorkTask[];
  addList: (input: {
    name: string;
    description: string;
    icon?: string | null;
    color?: string;
    kind?: WorkListKind;
    isPrivate?: boolean;
    defaultAccessLevel?: ListAccessLevel;
    viewerUserIds?: string[];
    viewerRoleIds?: string[];
    viewerUserAccess?: Record<string, ListAccessLevel>;
    viewerRoleAccess?: Record<string, ListAccessLevel>;
  }) => WorkList;
  updateList: (
    listId: string,
    patch: Partial<
      Pick<
        WorkList,
        | "name"
        | "description"
        | "icon"
        | "color"
        | "sortOrder"
        | "isPrivate"
        | "defaultAccessLevel"
        | "viewerUserIds"
        | "viewerRoleIds"
        | "viewerUserAccess"
        | "viewerRoleAccess"
        | "hiddenStatusIds"
        | "statusOrder"
        | "statusGroupOverrides"
      >
    >,
  ) => void;
  deleteList: (listId: string) => void;
  reorderLists: (orderedIds: string[]) => void;
  addTask: (input: {
    listId: string;
    parentId?: string | null;
    kind?: WorkTaskKind;
    title: string;
    description: string;
    assigneeIds?: string[];
    checklists?: TaskChecklist[];
  }) => WorkTask;
  applyTemplate: (input: {
    listId: string;
    parentId?: string | null;
    items: WorkTemplateItem[];
  }) => WorkTask[];
  updateTaskStatus: (taskId: string, status: WorkTaskStatus) => void;
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<
        WorkTask,
        "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate" | "deletedAt" | "checklists"
        | "hiddenStatusIds" | "statusOrder" | "statusGroupOverrides"
      >
    >,
  ) => void;
  hideTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  moveSubtask: (taskId: string, parentId: string) => void;
  moveWorkItem: (
    taskId: string,
    parentId: string | null,
    orderedIds: string[],
  ) => void;
  deleteTask: (taskId: string) => void;
  setWorkItemArchived: (taskId: string, archived: boolean) => void;
  addTaskComment: (taskId: string, text: string) => void;
  addTaskFile: (taskId: string, file: File) => Promise<TaskFile | null>;
  renameTaskFile: (fileId: string, name: string) => void;
  removeTaskFile: (fileId: string) => void;
  taskActivities: (taskId: string) => TaskActivity[];
  taskFiles: (taskId: string) => TaskFile[];
  allTaskFiles: TaskFile[];
  listTasks: (listId: string) => WorkTask[];
  archivedListTasks: (listId: string) => WorkTask[];
  childTasks: (parentId: string) => WorkTask[];
  subtasks: (parentId: string) => WorkTask[];
  reorderTasks: (orderedIds: string[]) => void;
  listStatuses: ListStatus[];
  addListStatus: (
    listId: string,
    input: { label: string; color: string; groupKey: string },
  ) => ListStatus | null;
  updateListStatus: (
    statusId: string,
    patch: Partial<Pick<ListStatus, "label" | "color" | "groupKey">>,
  ) => void;
  deleteListStatus: (statusId: string) => void;
  reorderListStatuses: (listId: string, orderedIds: string[]) => void;
  reassignTasksOffStatus: (
    listId: string,
    fromStatusId: string,
    preferredStatusIds: string[],
    closedStatusIds?: string[],
  ) => void;
  workTaskStatuses: WorkTaskStatusDef[];
  addWorkTaskStatus: (
    parentTaskId: string,
    listId: string,
    input: { label: string; color: string; groupKey: string },
  ) => WorkTaskStatusDef | null;
  updateWorkTaskStatus: (
    statusId: string,
    patch: Partial<Pick<WorkTaskStatusDef, "label" | "color" | "groupKey">>,
  ) => void;
  deleteWorkTaskStatus: (statusId: string) => void;
  reassignSubtasksOffStatus: (
    parentTaskId: string,
    fromStatusId: string,
    preferredStatusIds: string[],
    closedStatusIds?: string[],
  ) => void;
  teamStatusLabels: Record<string, string>;
  renameSystemStatus: (statusId: string, label: string) => void;
  resetSystemStatusLabel: (statusId: string) => void;
  listAutomations: ListAutomation[];
  addListAutomation: (
    listId: string,
    input: {
      triggerKind: AutomationTriggerKind;
      actionKind: AutomationActionKind;
      templateId?: string;
      config?: AutomationConfig;
      enabled?: boolean;
    },
  ) => ListAutomation | null;
  updateListAutomation: (
    automationId: string,
    patch: Partial<Pick<ListAutomation, "templateId" | "enabled" | "config">>,
  ) => void;
  deleteListAutomation: (automationId: string) => void;
};

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isReady: authReady } = useAuthSession();
  const { isReady: teamReady, currentTeam, currentUser, members } = useTeam();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const privateListsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.privateList);
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const checklistsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.checklist);
  const automationsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.automations);
  const templatesEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.templates);
  const googleDriveEnabled =
    fileUploadsEnabled && isModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive);
  const onedriveEnabled =
    fileUploadsEnabled && isModuleEnabled(FRONTEND_MODULE_KEYS.onedrive);
  const privateListsEnabledRef = useRef(privateListsEnabled);
  const fileUploadsEnabledRef = useRef(fileUploadsEnabled);
  const checklistsEnabledRef = useRef(checklistsEnabled);
  const automationsEnabledRef = useRef(automationsEnabled);
  const templatesEnabledRef = useRef(templatesEnabled);
  const googleDriveEnabledRef = useRef(googleDriveEnabled);
  const onedriveEnabledRef = useRef(onedriveEnabled);
  privateListsEnabledRef.current = privateListsEnabled;
  fileUploadsEnabledRef.current = fileUploadsEnabled;
  checklistsEnabledRef.current = checklistsEnabled;
  automationsEnabledRef.current = automationsEnabled;
  templatesEnabledRef.current = templatesEnabled;
  googleDriveEnabledRef.current = googleDriveEnabled;
  onedriveEnabledRef.current = onedriveEnabled;
  const userId = authUser?.id ?? null;
  const teamId = currentTeam?.id ?? null;
  const scopeKey = `${userId ?? "anon"}:${teamId ?? ""}`;
  const canLoad = authReady && teamReady;
  const [lists, setLists] = useState<WorkList[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [listStatuses, setListStatuses] = useState<ListStatus[]>([]);
  const [workTaskStatuses, setWorkTaskStatuses] = useState<WorkTaskStatusDef[]>([]);
  const [listAutomations, setListAutomations] = useState<ListAutomation[]>([]);
  const [teamStatusLabels, setTeamStatusLabels] = useState<Record<string, string>>(
    {},
  );
  const [isReady, setIsReady] = useState(false);
  const listsRef = useRef(lists);
  listsRef.current = lists;
  const listStatusesRef = useRef(listStatuses);
  listStatusesRef.current = listStatuses;
  const workTaskStatusesRef = useRef(workTaskStatuses);
  workTaskStatusesRef.current = workTaskStatuses;
  const listAutomationsRef = useRef(listAutomations);
  listAutomationsRef.current = listAutomations;
  const updateTaskRef = useRef<typeof updateTask>(null!);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const assignmentNotifyRef = useRef({
    actorId: "",
    memberIds: [] as string[],
    members: [] as typeof members,
    userId,
    teamId,
  });
  const pendingTaskInsertsRef = useRef<Map<string, Promise<void>>>(new Map());
  assignmentNotifyRef.current = {
    actorId: currentUser.id,
    memberIds: members.map((member) => member.id),
    members,
    userId,
    teamId,
  };

  const waitForTaskRow = useCallback((taskId: string) => {
    return pendingTaskInsertsRef.current.get(taskId) ?? Promise.resolve();
  }, []);

  const persistActivity = useCallback(
    (activity: TaskActivity, label = "Failed to save activity") => {
      const activeTeamId = assignmentNotifyRef.current.teamId;
      if (!activeTeamId) return;
      void waitForTaskRow(activity.taskId)
        .then(() => insertActivity(activeTeamId, activity))
        .catch((error) => {
          console.error(label, formatSupabaseError(error));
        });
    },
    [waitForTaskRow],
  );

  useEffect(() => {
    if (privateListsEnabled) return;
    setLists((current) => {
      if (current.every((list) => !list.isPrivate)) return current;
      return current.map((list) =>
        list.isPrivate ? { ...list, isPrivate: false } : list,
      );
    });
  }, [privateListsEnabled]);

  useEffect(() => {
    if (!canLoad) return;
    setIsReady(false);

    if (userId && !teamId) {
      setLists([]);
      setTasks([]);
      setActivities([]);
      setFiles([]);
      setListStatuses([]);
      setWorkTaskStatuses([]);
      setListAutomations([]);
      setTeamStatusLabels({});
      hydrateListFiles(null, [], {});
      hydrateTaskFileContents({});
      setIsReady(true);
      return;
    }

    if (!teamId) {
      setLists([]);
      setTasks([]);
      setActivities([]);
      setFiles([]);
      setListStatuses([]);
      setWorkTaskStatuses([]);
      setListAutomations([]);
      setTeamStatusLabels({});
      hydrateListFiles(null, [], {});
      hydrateTaskFileContents({});
      setIsReady(true);
      return;
    }

    let cancelled = false;
    pendingTaskInsertsRef.current.clear();
    void fetchTeamWorkspace(teamId)
      .then((workspace) => {
        if (cancelled) return;
        setLists(workspace.lists);
        setTasks(workspace.tasks);
        setActivities(workspace.activities);
        setFiles(workspace.taskFiles);
        setListStatuses(workspace.listStatuses);
        setWorkTaskStatuses(workspace.workTaskStatuses);
        setListAutomations(workspace.listAutomations);
        setTeamStatusLabels(workspace.teamStatusLabels);
        hydrateListFiles(teamId, workspace.listFiles, workspace.listFileContents);
        hydrateTaskFileContents(workspace.taskFileContents);
      })
      .catch((error) => {
        console.error("Failed to load lists", formatSupabaseError(error));
        if (cancelled) return;
        setLists([]);
        setTasks([]);
        setActivities([]);
        setFiles([]);
        setListStatuses([]);
        setTeamStatusLabels({});
        hydrateListFiles(teamId, [], {});
        hydrateTaskFileContents({});
      })
      .finally(() => {
        if (cancelled) return;
        setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [canLoad, scopeKey, teamId, userId]);

  const addList = useCallback(
    (input: {
      name: string;
      description: string;
      icon?: string | null;
      color?: string;
      kind?: WorkListKind;
      isPrivate?: boolean;
      defaultAccessLevel?: ListAccessLevel;
      viewerUserIds?: string[];
      viewerRoleIds?: string[];
      viewerUserAccess?: Record<string, ListAccessLevel>;
      viewerRoleAccess?: Record<string, ListAccessLevel>;
    }) => {
      const kind = input.kind ?? "list";
      const isPrivate =
        privateListsEnabledRef.current && input.isPrivate === true;
      const defaultAccessLevel =
        input.defaultAccessLevel ?? DEFAULT_LIST_ACCESS_LEVEL;
      const viewerUserAccess = input.viewerUserAccess ?? {};
      const viewerRoleAccess = input.viewerRoleAccess ?? {};
      const viewerUserIds = accessIds(viewerUserAccess);
      const viewerRoleIds = accessIds(viewerRoleAccess);
      const list: WorkList = {
        id: createListId(),
        name: input.name.trim(),
        description: input.description.trim(),
        icon:
          input.icon?.trim() ||
          (kind === "folder" ? "far fa-folder" : null),
        color: listColorById(input.color ?? randomListColorId()).id,
        sortOrder: listsRef.current.length,
        kind,
        isPrivate,
        createdBy: userId,
        defaultAccessLevel,
        viewerUserIds,
        viewerRoleIds,
        viewerUserAccess,
        viewerRoleAccess,
        hiddenStatusIds: [],
        statusOrder: [],
        statusGroupOverrides: {},
      };

      setLists((current) => [...current, list]);
      if (teamId) {
        void insertList(teamId, list, {
          createdBy: userId,
          viewerUserIds,
          viewerRoleIds,
          viewerUserAccess,
          viewerRoleAccess,
        }).catch((error) => {
          console.error("Failed to save list", error);
        });
      }
      return list;
    },
    [teamId, userId],
  );

  const updateList = useCallback(
    (
      listId: string,
      patch: Partial<
        Pick<
          WorkList,
          | "name"
          | "description"
          | "icon"
          | "color"
          | "sortOrder"
          | "isPrivate"
          | "defaultAccessLevel"
          | "viewerUserIds"
          | "viewerRoleIds"
          | "viewerUserAccess"
          | "viewerRoleAccess"
          | "hiddenStatusIds"
          | "statusOrder"
          | "statusGroupOverrides"
        >
      >,
    ) => {
      setLists((current) =>
        current.map((list) => {
          if (list.id !== listId) return list;
          const nextColor =
            patch.color !== undefined
              ? listColorById(patch.color).id
              : list.color;
          const isPrivate = privateListsEnabledRef.current
            ? patch.isPrivate !== undefined
              ? patch.isPrivate
              : list.isPrivate
            : false;
          const viewerUserAccess =
            patch.viewerUserAccess !== undefined
              ? patch.viewerUserAccess
              : list.viewerUserAccess;
          const viewerRoleAccess =
            patch.viewerRoleAccess !== undefined
              ? patch.viewerRoleAccess
              : list.viewerRoleAccess;
          return {
            ...list,
            ...patch,
            name: patch.name !== undefined ? patch.name.trim() : list.name,
            description:
              patch.description !== undefined
                ? patch.description.trim()
                : list.description,
            icon:
              patch.icon !== undefined
                ? patch.icon?.trim() || null
                : list.icon,
            color: nextColor,
            sortOrder:
              patch.sortOrder !== undefined ? patch.sortOrder : list.sortOrder,
            isPrivate,
            defaultAccessLevel:
              patch.defaultAccessLevel ?? list.defaultAccessLevel,
            viewerUserAccess,
            viewerRoleAccess,
            viewerUserIds: accessIds(viewerUserAccess),
            viewerRoleIds: accessIds(viewerRoleAccess),
          };
        }),
      );
      const current = listsRef.current.find((item) => item.id === listId);
      void updateListRow(listId, {
        ...patch,
        name: patch.name !== undefined ? patch.name.trim() : undefined,
        description:
          patch.description !== undefined ? patch.description.trim() : undefined,
        icon: patch.icon !== undefined ? patch.icon?.trim() || null : undefined,
        sortOrder: patch.sortOrder,
        isPrivate: privateListsEnabledRef.current ? patch.isPrivate : false,
        defaultAccessLevel: patch.defaultAccessLevel,
        createdBy: current?.createdBy ?? userId,
        viewerUserAccess: patch.viewerUserAccess,
        viewerRoleAccess: patch.viewerRoleAccess,
      }).catch((error) => {
        console.error("Failed to update list", error);
      });
    },
    [userId],
  );

  const deleteList = useCallback((listId: string) => {
    setLists((current) => current.filter((list) => list.id !== listId));
    setListStatuses((current) => current.filter((status) => status.listId !== listId));
    setTasks((current) => {
      const removedIds = new Set(
        current.filter((task) => task.listId === listId).map((task) => task.id),
      );
      setActivities((items) =>
        items.filter((item) => !removedIds.has(item.taskId)),
      );
      setFiles((items) => {
        const next = items.filter((item) => !removedIds.has(item.taskId));
        for (const file of items) {
          if (removedIds.has(file.taskId)) cacheTaskFileContent(file.id, null);
        }
        return next;
      });
      return current.filter((task) => task.listId !== listId);
    });
    deleteStoredListFilesForList(listId);
    void deleteListRow(listId).catch((error) => {
      console.error("Failed to delete list", error);
    });
  }, []);

  const reorderLists = useCallback((orderedIds: string[]) => {
    setLists((current) => {
      const byId = new Map(current.map((list) => [list.id, list]));
      const ordered = orderedIds
        .map((id, index) => {
          const list = byId.get(id);
          return list ? { ...list, sortOrder: index } : null;
        })
        .filter((list): list is WorkList => list !== null);
      if (ordered.length !== current.length) return current;
      return ordered;
    });
    for (const [index, id] of orderedIds.entries()) {
      void updateListRow(id, { sortOrder: index }).catch((error) => {
        console.error("Failed to reorder lists", error);
      });
    }
  }, []);

  const addTask = useCallback(
    (input: {
      listId: string;
      parentId?: string | null;
      kind?: WorkTaskKind;
      title: string;
      description: string;
      assigneeIds?: string[];
      checklists?: TaskChecklist[];
    }) => {
      const createdAt = new Date().toISOString();
      const assigneeIds = [...(input.assigneeIds ?? [])];
      const checklists =
        input.checklists !== undefined
          ? normalizeTaskChecklists(input.checklists)
          : [];
      const task: WorkTask = {
        id: createTaskId(),
        listId: input.listId,
        parentId: input.parentId ?? null,
        kind: input.kind ?? (input.parentId ? "subtask" : "task"),
        title: input.title.trim(),
        description: input.description.trim(),
        status: "todo",
        statusChangedAt: createdAt,
        deletedAt: null,
        archivedAt: null,
        assigneeIds,
        startDate: null,
        dueDate: null,
        sortOrder: 0,
        checklists,
        hiddenStatusIds: [],
        statusOrder: [],
        statusGroupOverrides: {},
      };
      setTasks((current) => {
        if (task.parentId) {
          const parent = current.find((item) => item.id === task.parentId);
          if (parent?.archivedAt) task.archivedAt = parent.archivedAt;
        }
        if (task.kind === "subtask") {
          task.sortOrder = nextSortOrder(current, task);
        } else {
          const siblingTasks = current.filter(
            (item) =>
              item.listId === task.listId &&
              item.parentId === task.parentId &&
              item.kind !== "subtask",
          );
          const siblingFiles = childListFiles(
            readAllListFiles(),
            task.listId,
            task.parentId,
          );
          task.sortOrder = nextItemSortOrder([...siblingTasks, ...siblingFiles]);
        }
        return [...current, task];
      });
      const createdActivity = createActivity({
        actorId: assignmentNotifyRef.current.actorId,
        taskId: task.id,
        kind: "created",
        at: createdAt,
      });
      setActivities((current) => [...current, createdActivity]);
      const activeTeamId = assignmentNotifyRef.current.teamId;
      if (activeTeamId) {
        const parentId = task.parentId;
        const parentWait =
          parentId != null
            ? (pendingTaskInsertsRef.current.get(parentId) ?? Promise.resolve())
            : Promise.resolve();
        const persist = parentWait
          .then(() => insertTask(activeTeamId, task))
          .then(() => insertActivity(activeTeamId, createdActivity))
          .catch((error) => {
            console.error("Failed to save task", formatSupabaseError(error));
          });
        pendingTaskInsertsRef.current.set(task.id, persist);
        void persist.finally(() => {
          if (pendingTaskInsertsRef.current.get(task.id) === persist) {
            pendingTaskInsertsRef.current.delete(task.id);
          }
        });
      }
      if (task.kind === "subtask") {
        queueMicrotask(() => {
          const notify = assignmentNotifyRef.current;
          const items = notificationsForNewSubtask({
            actorId: notify.actorId,
            task,
            tasks: tasksRef.current,
            members: notify.members,
            memberIds: notify.memberIds,
          });
          if (items.length > 0) {
            void appendNotifications(
              items,
              notify.userId,
              notify.teamId,
              notify.members,
            );
          }
        });
      } else if (task.assigneeIds.length > 0) {
        queueMicrotask(() => {
          const notify = assignmentNotifyRef.current;
          const items = notificationsForInitialAssignees({
            actorId: notify.actorId,
            assigneeIds: task.assigneeIds,
            memberIds: notify.memberIds,
            members: notify.members,
            task,
            tasks: tasksRef.current,
          });
          if (items.length > 0) {
            void appendNotifications(
              items,
              notify.userId,
              notify.teamId,
              notify.members,
            );
          }
        });
      }
      return task;
    },
    [],
  );

  const updateTask = useCallback(
    (
      taskId: string,
      patch: Partial<
        Pick<
          WorkTask,
          "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate" | "deletedAt" | "checklists"
          | "hiddenStatusIds" | "statusOrder" | "statusGroupOverrides"
        >
      >,
    ) => {
      setTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        if (!existing) {
          queueMicrotask(() => {
            const pending = tasksRef.current.find((task) => task.id === taskId);
            if (!pending) return;
            updateTaskRef.current(taskId, patch);
          });
          return current;
        }

        const nextChecklists =
          patch.checklists !== undefined
            ? normalizeTaskChecklists(patch.checklists)
            : (existing.checklists ?? []);
        const catalog = listStatusesRef.current.filter(
          (status) => status.listId === existing.listId,
        );
        const requestedStatus = patch.status;
        const closingBlocked =
          checklistsEnabledRef.current &&
          Boolean(requestedStatus) &&
          requestedStatus !== existing.status &&
          isClosedTaskStatus(requestedStatus as WorkTaskStatus, catalog) &&
          taskHasIncompleteChecklists(nextChecklists);
        if (closingBlocked) {
          const { status: ignoredStatus, ...rest } = patch;
          void ignoredStatus;
          patch = rest;
        }
        if (patch.checklists !== undefined) {
          patch = { ...patch, checklists: nextChecklists };
        }

        let statusChangedAt = existing.statusChangedAt;
        if (patch.status && patch.status !== existing.status) {
          statusChangedAt = new Date().toISOString();
        }

        const nextEvents = buildTaskUpdateActivityEvents(
          taskId,
          assignmentNotifyRef.current.actorId,
          existing,
          patch,
        );
        if (nextEvents.length > 0) {
          setActivities((currentActivities) => [
            ...currentActivities,
            ...nextEvents,
          ]);
          for (const event of nextEvents) {
            persistActivity(event);
          }

          const notify = assignmentNotifyRef.current;
          const taskNotifications = buildTaskUpdateNotifications({
            actorId: notify.actorId,
            existing,
            patch,
            tasks: current,
            members: notify.members,
            activities: nextEvents,
          });
          if (taskNotifications.length > 0) {
            queueMicrotask(() =>
              appendNotifications(
                taskNotifications,
                notify.userId,
                notify.teamId,
                notify.members,
              ),
            );
          }
        }

        if (
          patch.assigneeIds &&
          patch.assigneeIds.some(
            (id) => !existing.assigneeIds.includes(id),
          )
        ) {
          const notify = assignmentNotifyRef.current;
          const addedIds = memberIdsNotifiedForAssignees(
            patch.assigneeIds.filter(
              (id) => !existing.assigneeIds.includes(id),
            ),
            notify.members,
          );
          const parentId =
            existing.kind === "subtask" && existing.parentId
              ? existing.parentId
              : existing.id;
          const extra = notificationsForNewAssignees({
            actorId: notify.actorId,
            addedIds,
            memberIds: notify.memberIds,
            taskTitle: patch.title ?? existing.title,
            href: `/lists/${existing.listId}/tasks/${parentId}`,
          });
          if (extra.length > 0) {
            queueMicrotask(() =>
              appendNotifications(
                extra,
                notify.userId,
                notify.teamId,
                notify.members,
              ),
            );
          }
        }

        const dbPatch = {
          ...patch,
          ...(patch.status && patch.status !== existing.status
            ? { statusChangedAt }
            : {}),
        };

        void waitForTaskRow(taskId)
          .then(() => updateTaskRow(taskId, dbPatch))
          .catch((error) => {
            console.error("Failed to update task", formatSupabaseError(error));
          });

        // --- Automation triggers ---
        if (automationsEnabledRef.current) {
          const automations = listAutomationsRef.current;

          // 1) status_changed → assign_user
          if (patch.status && patch.status !== existing.status) {
            const assignRules = activeStatusChangedAssignRules(
              automations, existing.listId, patch.status,
            );
            for (const rule of assignRules) {
              const uid = rule.config.assigneeId;
              if (uid && !existing.assigneeIds.includes(uid)) {
                const merged = [...new Set([...(patch.assigneeIds ?? existing.assigneeIds), uid])];
                queueMicrotask(() => {
                  updateTaskRef.current(taskId, { assigneeIds: merged });
                });
              }
            }
          }

          // 2) checklist_completed → set_status
          if (patch.checklists !== undefined && checklistsEnabledRef.current) {
            const allComplete = !taskHasIncompleteChecklists(nextChecklists) && nextChecklists.length > 0;
            if (allComplete) {
              const checkRules = activeChecklistCompletedRules(automations, existing.listId);
              for (const rule of checkRules) {
                const targetId = rule.config.targetStatusId;
                if (targetId && targetId !== (patch.status ?? existing.status)) {
                  queueMicrotask(() => {
                    updateTaskRef.current(taskId, { status: targetId as WorkTaskStatus });
                  });
                  break;
                }
              }
            }
          }

          // 3) all_subtasks_completed → set parent status
          if (patch.status && patch.status !== existing.status && existing.kind === "subtask" && existing.parentId) {
            const parentId = existing.parentId;
            const closedStatus = patch.status;
            const parentTask = current.find((t) => t.id === parentId);
            if (parentTask) {
              const parentCatalog = listStatusesRef.current.filter(
                (s) => s.listId === parentTask.listId,
              );
              const isNewStatusClosed = isClosedTaskStatus(closedStatus, parentCatalog);
              if (isNewStatusClosed) {
                const siblings = current.filter(
                  (t) => t.parentId === parentId && t.id !== taskId && !t.deletedAt,
                );
                const allSiblingsClosed = siblings.every((t) =>
                  isClosedTaskStatus(t.status, parentCatalog),
                );
                if (allSiblingsClosed) {
                  const subRules = activeAllSubtasksCompletedRules(automations, parentTask.listId);
                  for (const rule of subRules) {
                    const targetId = rule.config.targetStatusId;
                    if (targetId && targetId !== parentTask.status) {
                      queueMicrotask(() => {
                        updateTaskRef.current(parentId, { status: targetId as WorkTaskStatus });
                      });
                      break;
                    }
                  }
                }
              }
            }
          }
        }

        return current.map((task) =>
          task.id === taskId
            ? {
                ...task,
                ...patch,
                ...(patch.status && patch.status !== existing.status
                  ? { statusChangedAt }
                  : {}),
              }
            : task,
        );
      });
    },
    [persistActivity, waitForTaskRow],
  );
  updateTaskRef.current = updateTask;

  const addTaskComment = useCallback((taskId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const task = tasksRef.current.find((item) => item.id === taskId);
    const activity = createActivity({
      actorId: assignmentNotifyRef.current.actorId,
      taskId,
      kind: "comment",
      text: trimmed,
    });
    setActivities((current) => [...current, activity]);
    persistActivity(activity, "Failed to save comment");
    if (task) {
      const notify = assignmentNotifyRef.current;
      const items = notificationsForTaskComment({
        actorId: notify.actorId,
        task,
        tasks: tasksRef.current,
        members: notify.members,
      });
      if (items.length > 0) {
        queueMicrotask(() =>
          appendNotifications(
            items,
            notify.userId,
            notify.teamId,
            notify.members,
          ),
        );
      }
    }
  }, [persistActivity]);

  const addTaskFile = useCallback(async (taskId: string, file: File) => {
    if (!fileUploadsEnabledRef.current) return null;
    const name = file.name.trim() || "file";
    if (!isAllowedFileName(name)) {
      return null;
    }
    const record: TaskFile = {
      id: createTaskFileId(),
      taskId,
      name,
      mimeType: file.type || mimeFromName(name),
      size: Math.max(0, Math.round(file.size)),
      hasContent: false,
      createdAt: new Date().toISOString(),
    };
    const content = await storeTaskFileContent(record.id, file);
    record.hasContent = Boolean(content);
    setFiles((current) => [...current, record]);
    const activity = createActivity({
      actorId: assignmentNotifyRef.current.actorId,
      taskId,
      kind: "file",
      fileName: record.name,
    });
    setActivities((current) => [...current, activity]);
    const activeTeamId = assignmentNotifyRef.current.teamId;
    if (activeTeamId) {
      void insertTaskFile(activeTeamId, record, content)
        .then(() => insertActivity(activeTeamId, activity))
        .catch((error) => {
          console.error("Failed to save task file", formatSupabaseError(error));
        });
    }
    const task = tasksRef.current.find((item) => item.id === taskId);
    if (task) {
      const notify = assignmentNotifyRef.current;
      const items = notificationsForTaskFile({
        actorId: notify.actorId,
        task,
        tasks: tasksRef.current,
        members: notify.members,
      });
      if (items.length > 0) {
        queueMicrotask(() =>
          appendNotifications(
            items,
            notify.userId,
            notify.teamId,
            notify.members,
          ),
        );
      }
      if (googleDriveEnabledRef.current) {
        queueGoogleDriveUpload({
          teamId: assignmentNotifyRef.current.teamId,
          file,
          pathParts: googleDrivePathForTaskFile({
            lists: listsRef.current,
            tasks: tasksRef.current,
            taskId,
          }),
        });
      }
      if (onedriveEnabledRef.current) {
        queueOneDriveUpload({
          teamId: assignmentNotifyRef.current.teamId,
          file,
          pathParts: googleDrivePathForTaskFile({
            lists: listsRef.current,
            tasks: tasksRef.current,
            taskId,
          }),
        });
      }
    }
    return record;
  }, []);

  const removeTaskFile = useCallback((fileId: string) => {
    setFiles((current) => {
      const file = current.find((item) => item.id === fileId);
      if (file) {
        const activity = buildFileRemovedActivity(
          file.taskId,
          assignmentNotifyRef.current.actorId,
          file.name,
        );
        setActivities((items) => [...items, activity]);
        persistActivity(activity, "Failed to save file removal activity");
      }
      return current.filter((item) => item.id !== fileId);
    });
    cacheTaskFileContent(fileId, null);
    void deleteTaskFileRow(fileId).catch((error) => {
      console.error("Failed to delete task file", error);
    });
  }, [persistActivity]);

  const renameTaskFile = useCallback((fileId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFiles((current) => {
      const file = current.find((item) => item.id === fileId);
      if (file && file.name !== trimmed) {
        const activity = buildFileRenamedActivity(
          file.taskId,
          assignmentNotifyRef.current.actorId,
          file.name,
          trimmed,
        );
        setActivities((items) => [...items, activity]);
        persistActivity(activity, "Failed to save file rename activity");
      }
      return current.map((item) =>
        item.id === fileId
          ? { ...item, name: trimmed, mimeType: mimeFromName(trimmed) }
          : item,
      );
    });
    void updateTaskFileName(fileId, trimmed, mimeFromName(trimmed)).catch((error) => {
      console.error("Failed to rename task file", error);
    });
  }, [persistActivity]);

  const hideTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { deletedAt: new Date().toISOString() });
    },
    [updateTask],
  );

  const restoreTask = useCallback(
    (taskId: string) => {
      updateTask(taskId, { deletedAt: null });
    },
    [updateTask],
  );

  const moveSubtask = useCallback((taskId: string, parentId: string) => {
    setTasks((current) => {
      const existing = current.find((task) => task.id === taskId);
      if (!existing || existing.kind !== "subtask" || existing.parentId === parentId) {
        return current;
      }
      const sortOrder = nextSortOrder(current, {
        listId: existing.listId,
        parentId,
        kind: "subtask",
      });
      const activity = buildSubtaskMovedActivity(
        taskId,
        assignmentNotifyRef.current.actorId,
        existing.parentId,
        parentId,
      );
      setActivities((items) => [...items, activity]);
      persistActivity(activity, "Failed to save move activity");
      const notify = assignmentNotifyRef.current;
      const moveNotifications = notificationsFromTaskActivities({
        actorId: notify.actorId,
        task: existing,
        tasks: current,
        members: notify.members,
        activities: [activity],
      });
      if (moveNotifications.length > 0) {
        queueMicrotask(() =>
          appendNotifications(
            moveNotifications,
            notify.userId,
            notify.teamId,
            notify.members,
          ),
        );
      }
      void updateTaskRow(taskId, { parentId, sortOrder }).catch((error) => {
        console.error("Failed to move subtask", error);
      });
      return current.map((task) =>
        task.id === taskId ? { ...task, parentId, sortOrder } : task,
      );
    });
  }, [persistActivity]);

  const moveWorkItem = useCallback(
    (taskId: string, parentId: string | null, orderedIds: string[]) => {
      setTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        if (!existing || existing.kind === "subtask") return current;
        if (parentId && collectTaskSubtreeIds(current, taskId).includes(parentId)) {
          return current;
        }
        const sortOrder = Math.max(0, orderedIds.indexOf(taskId));
        void updateTaskRow(taskId, { parentId, sortOrder }).catch((error) => {
          console.error("Failed to move work item", error);
        });
        const next = current.map((task) => {
          if (task.id === taskId) return { ...task, parentId, sortOrder };
          const index = orderedIds.indexOf(task.id);
          if (index < 0) return task;
          return { ...task, sortOrder: index };
        });
        void updateTaskSortOrders(orderedIds).catch((error) => {
          console.error("Failed to reorder after move", error);
        });
        return next;
      });
    },
    [],
  );

  const deleteTask = useCallback((taskId: string) => {
    let removedIds: string[] = [];
    setTasks((current) => {
      removedIds = collectTaskSubtreeIds(current, taskId);
      setActivities((items) =>
        items.filter((item) => !removedIds.includes(item.taskId)),
      );
      setFiles((items) => {
        const next = items.filter((item) => !removedIds.includes(item.taskId));
        for (const file of items) {
          if (removedIds.includes(file.taskId)) cacheTaskFileContent(file.id, null);
        }
        return next;
      });
      return current.filter((task) => !removedIds.includes(task.id));
    });
    setWorkTaskStatuses((current) =>
      current.filter((status) => !removedIds.includes(status.parentTaskId)),
    );
    deleteStoredListFilesForParents(removedIds);
    void deleteTaskRow(taskId).catch((error) => {
      console.error("Failed to delete task", error);
    });
  }, []);

  const setWorkItemArchived = useCallback(
    (taskId: string, archived: boolean) => {
      const archivedAt = archived ? new Date().toISOString() : null;
      let ids: string[] = [];
      setTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        if (!existing || isWorkSubtask(existing)) return current;
        const idSet = new Set(collectTaskSubtreeIds(current, taskId));
        if (!archived) {
          for (const ancestor of getTaskAncestors(current, existing)) {
            idSet.add(ancestor.id);
          }
        }
        ids = [...idSet];
        return current.map((task) =>
          idSet.has(task.id) ? { ...task, archivedAt } : task,
        );
      });
      if (ids.length === 0) return;
      void updateTasksArchivedAt(ids, archivedAt).catch((error) => {
        console.error("Failed to update task archive", error);
      });
    },
    [],
  );

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks((current) => {
      const orderBefore = new Map(
        current
          .filter((task) => orderedIds.includes(task.id))
          .map((task) => [task.id, task.sortOrder]),
      );
      const next = applySortOrder(current, orderedIds);
      const nextEvents: TaskActivity[] = [];
      for (const taskId of orderedIds) {
        const previousOrder = orderBefore.get(taskId);
        const task = next.find((entry) => entry.id === taskId);
        if (
          task &&
          previousOrder !== undefined &&
          previousOrder !== task.sortOrder
        ) {
          nextEvents.push(
            createActivity({
              actorId: assignmentNotifyRef.current.actorId,
              taskId,
              kind: "reordered",
            }),
          );
        }
      }
      if (nextEvents.length > 0) {
        setActivities((items) => [...items, ...nextEvents]);
        for (const event of nextEvents) {
          persistActivity(event, "Failed to save reorder activity");
        }
      }
      return next;
    });
    void updateTaskSortOrders(orderedIds).catch((error) => {
      console.error("Failed to reorder tasks", error);
    });
  }, [persistActivity]);

  const addListStatus = useCallback(
    (
      listId: string,
      input: { label: string; color: string; groupKey: string },
    ) => {
      const label = input.label.trim();
      if (!label) return null;
      const sortOrder =
        listStatuses
          .filter((status) => status.listId === listId)
          .reduce((max, status) => Math.max(max, status.sortOrder), -1) + 1;
      const status: ListStatus = {
        id: createListStatusId(),
        listId,
        labels: {},
        label,
        color: normalizeStatusColor(input.color),
        sortOrder,
        groupKey: isListStatusGroup(input.groupKey) ? input.groupKey : "active",
      };
      setListStatuses((current) => [...current, status]);
      if (teamId) {
        void insertListStatus(teamId, status).catch((error) => {
          console.error("Failed to save list status", error);
        });
      }
      return status;
    },
    [listStatuses, teamId],
  );

  const updateListStatus = useCallback(
    (
      statusId: string,
      patch: Partial<Pick<ListStatus, "label" | "color" | "groupKey">>,
    ) => {
      setListStatuses((current) =>
        current.map((status) => {
          if (status.id !== statusId) return status;
          const label = patch.label?.trim() || status.label;
          return {
            ...status,
            labels: patch.label !== undefined ? {} : status.labels,
            label,
            color:
              patch.color !== undefined
                ? normalizeStatusColor(patch.color)
                : status.color,
            groupKey:
              patch.groupKey !== undefined
                ? isListStatusGroup(patch.groupKey)
                  ? patch.groupKey
                  : status.groupKey
                : status.groupKey,
          };
        }),
      );
      void updateListStatusRow(statusId, patch).catch((error) => {
        console.error("Failed to update list status", error);
      });
    },
    [],
  );

  const deleteListStatus = useCallback((statusId: string) => {
    setListStatuses((current) => current.filter((status) => status.id !== statusId));
    void deleteListStatusRow(statusId).catch((error) => {
      console.error("Failed to delete list status", error);
    });
  }, []);

  const addWorkTaskStatus = useCallback(
    (
      parentTaskId: string,
      listId: string,
      input: { label: string; color: string; groupKey: string },
    ) => {
      const label = input.label.trim();
      if (!label) return null;
      const sortOrder =
        workTaskStatusesRef.current
          .filter((status) => status.parentTaskId === parentTaskId)
          .reduce((max, status) => Math.max(max, status.sortOrder), -1) + 1;
      const status: WorkTaskStatusDef = {
        id: createWorkTaskStatusId(),
        parentTaskId,
        listId,
        labels: {},
        label,
        color: normalizeStatusColor(input.color),
        sortOrder,
        groupKey: isListStatusGroup(input.groupKey) ? input.groupKey : "active",
      };
      setWorkTaskStatuses((current) => [...current, status]);
      if (teamId) {
        const parentWait =
          pendingTaskInsertsRef.current.get(parentTaskId) ?? Promise.resolve();
        void parentWait
          .then(() => insertWorkTaskStatus(teamId, status))
          .catch((error) => {
            console.error(
              "Failed to save task status",
              formatSupabaseError(error),
            );
          });
      }
      return status;
    },
    [teamId],
  );

  const updateWorkTaskStatus = useCallback(
    (
      statusId: string,
      patch: Partial<Pick<WorkTaskStatusDef, "label" | "color" | "groupKey">>,
    ) => {
      setWorkTaskStatuses((current) =>
        current.map((status) => {
          if (status.id !== statusId) return status;
          const label = patch.label?.trim() || status.label;
          return {
            ...status,
            labels: patch.label !== undefined ? {} : status.labels,
            label,
            color:
              patch.color !== undefined
                ? normalizeStatusColor(patch.color)
                : status.color,
            groupKey:
              patch.groupKey !== undefined
                ? isListStatusGroup(patch.groupKey)
                  ? patch.groupKey
                  : status.groupKey
                : status.groupKey,
          };
        }),
      );
      void updateWorkTaskStatusRow(statusId, patch).catch((error) => {
        console.error("Failed to update task status", error);
      });
    },
    [],
  );

  const deleteWorkTaskStatus = useCallback((statusId: string) => {
    setWorkTaskStatuses((current) =>
      current.filter((status) => status.id !== statusId),
    );
    void deleteWorkTaskStatusRow(statusId).catch((error) => {
      console.error("Failed to delete task status", error);
    });
  }, []);

  const applyTemplate = useCallback(
    (input: {
      listId: string;
      parentId?: string | null;
      items: WorkTemplateItem[];
    }) => {
      const templateId = input.items[0]?.templateId ?? "";
      const created: WorkTask[] = [];

      function applyTemplateDefaults(
        workItem: WorkTask,
        templateItem: WorkTemplateItem,
      ) {
        if (templateItem.kind !== "task") return;

        const idMap = new Map<string, string>();
        for (const def of templateItem.taskStatuses ?? []) {
          const createdStatus = addWorkTaskStatus(workItem.id, workItem.listId, {
            label: def.label,
            color: def.color,
            groupKey: def.groupKey,
          });
          if (createdStatus) idMap.set(def.id, createdStatus.id);
        }
        const remap = (id: string) => idMap.get(id) ?? id;
        const patch: Parameters<typeof updateTask>[1] = {};
        const hiddenStatusIds = (templateItem.hiddenStatusIds ?? []).map(remap);
        const statusOrder = (templateItem.statusOrder ?? []).map(remap);
        const statusGroupOverrides = Object.fromEntries(
          Object.entries(templateItem.statusGroupOverrides ?? {}).map(
            ([id, groupKey]) => [remap(id), groupKey],
          ),
        );
        if (hiddenStatusIds.length > 0) patch.hiddenStatusIds = hiddenStatusIds;
        if (statusOrder.length > 0) patch.statusOrder = statusOrder;
        if (Object.keys(statusGroupOverrides).length > 0) {
          patch.statusGroupOverrides = statusGroupOverrides;
        }
        if (Object.keys(patch).length === 0) return;
        const taskPersist =
          pendingTaskInsertsRef.current.get(workItem.id) ?? Promise.resolve();
        void taskPersist.then(() => {
          updateTaskRef.current(workItem.id, patch);
        });
      }

      function templateDefaultsForItem(templateItem: WorkTemplateItem) {
        const assigneeIds = templateItem.assigneeIds ?? [];
        const checklists = templateChecklistsForApply(templateItem.checklists ?? []);
        return {
          assigneeIds: assigneeIds.length > 0 ? [...assigneeIds] : undefined,
          checklists: checklists.length > 0 ? checklists : undefined,
        };
      }

      function applyBranch(templateParentId: string | null, workParentId: string | null) {
        const siblings = templateTreeChildren(
          input.items,
          templateParentId,
          templateId,
        );
        for (const item of siblings) {
          const title = item.title.trim();
          if (!title) continue;
          const defaults = templateDefaultsForItem(item);
          const workItem = addTask({
            listId: input.listId,
            parentId: workParentId,
            kind: item.kind,
            title,
            description: item.description,
            assigneeIds: defaults.assigneeIds,
            checklists: defaults.checklists,
          });
          applyTemplateDefaults(workItem, item);
          if (item.kind !== "subtask") {
            created.push(workItem);
          }
          if (item.kind === "folder") {
            applyBranch(item.id, workItem.id);
          } else if (item.kind === "task") {
            for (const child of templateSubtasks(input.items, item.id)) {
              const childTitle = child.title.trim();
              if (!childTitle) continue;
              const childDefaults = templateDefaultsForItem(child);
              addTask({
                listId: input.listId,
                parentId: workItem.id,
                kind: "subtask",
                title: childTitle,
                description: child.description,
                assigneeIds: childDefaults.assigneeIds,
                checklists: childDefaults.checklists,
              });
            }
          }
        }
      }

      applyBranch(null, input.parentId ?? null);
      return created;
    },
    [addTask, addWorkTaskStatus],
  );

  const addListAutomation = useCallback(
    (
      listId: string,
      input: {
        triggerKind: AutomationTriggerKind;
        actionKind: AutomationActionKind;
        templateId?: string;
        config?: AutomationConfig;
        enabled?: boolean;
      },
    ) => {
      if (!automationsEnabledRef.current) return null;
      if (
        input.triggerKind === "folder_created" &&
        !templatesEnabledRef.current
      ) {
        return null;
      }
      const templateId = (input.templateId ?? "").trim() || null;
      const sortOrder =
        listAutomations
          .filter((automation) => automation.listId === listId)
          .reduce((max, automation) => Math.max(max, automation.sortOrder), -1) + 1;
      const automation: ListAutomation = {
        id: createListAutomationId(),
        listId,
        triggerKind: input.triggerKind,
        actionKind: input.actionKind,
        templateId,
        config: input.config ?? {},
        enabled: input.enabled !== false,
        sortOrder,
      };
      setListAutomations((current) => [...current, automation]);
      if (teamId) {
        void insertListAutomation(teamId, automation).catch((error) => {
          console.error("Failed to save list automation", error);
        });
      }
      return automation;
    },
    [listAutomations, teamId],
  );

  const updateListAutomation = useCallback(
    (
      automationId: string,
      patch: Partial<Pick<ListAutomation, "templateId" | "enabled" | "config">>,
    ) => {
      setListAutomations((current) =>
        current.map((automation) => {
          if (automation.id !== automationId) return automation;
          return {
            ...automation,
            templateId:
              patch.templateId !== undefined
                ? (patch.templateId?.trim() || null)
                : automation.templateId,
            enabled:
              patch.enabled !== undefined ? patch.enabled : automation.enabled,
            config:
              patch.config !== undefined ? patch.config : automation.config,
          };
        }),
      );
      void updateListAutomationRow(automationId, patch).catch((error) => {
        console.error("Failed to update list automation", error);
      });
    },
    [],
  );

  const deleteListAutomation = useCallback((automationId: string) => {
    setListAutomations((current) =>
      current.filter((automation) => automation.id !== automationId),
    );
    void deleteListAutomationRow(automationId).catch((error) => {
      console.error("Failed to delete list automation", error);
    });
  }, []);

  const reassignTasksOffStatus = useCallback(
    (
      listId: string,
      fromStatusId: string,
      preferredStatusIds: string[],
      closedStatusIds: string[] = [],
    ) => {
      if (preferredStatusIds.length === 0) return;
      const now = new Date().toISOString();
      const closed = new Set(closedStatusIds);
      const changes: {
        taskId: string;
        fromStatus: string;
        toStatus: string;
      }[] = [];

      for (const task of tasksRef.current) {
        if (task.listId !== listId || task.status !== fromStatusId) continue;
        const incomplete =
          checklistsEnabledRef.current &&
          taskHasIncompleteChecklists(task.checklists ?? []);
        const toStatus =
          preferredStatusIds.find(
            (statusId) => !(closed.has(statusId) && incomplete),
          ) ?? preferredStatusIds[0];
        if (!toStatus || toStatus === task.status) continue;
        changes.push({
          taskId: task.id,
          fromStatus: task.status,
          toStatus,
        });
      }

      if (changes.length === 0) return;

      const byId = new Map(changes.map((change) => [change.taskId, change.toStatus]));
      setTasks((current) =>
        current.map((task) => {
          const toStatus = byId.get(task.id);
          if (!toStatus) return task;
          return {
            ...task,
            status: toStatus as WorkTaskStatus,
            statusChangedAt: now,
          };
        }),
      );

      const actorId = assignmentNotifyRef.current.actorId;
      const nextEvents = changes.map((change) =>
        createActivity({
          actorId,
          taskId: change.taskId,
          kind: "status",
          fromStatus: change.fromStatus as WorkTaskStatus,
          toStatus: change.toStatus as WorkTaskStatus,
          at: now,
        }),
      );
      setActivities((current) => [...current, ...nextEvents]);
      for (const change of changes) {
        void updateTaskRow(change.taskId, {
          status: change.toStatus as WorkTaskStatus,
          statusChangedAt: now,
        }).catch((error) => {
          console.error("Failed to reassign task status", formatSupabaseError(error));
        });
      }
      for (const event of nextEvents) {
        persistActivity(event, "Failed to save status activity");
      }
    },
    [persistActivity],
  );

  const reassignSubtasksOffStatus = useCallback(
    (
      parentTaskId: string,
      fromStatusId: string,
      preferredStatusIds: string[],
      closedStatusIds: string[] = [],
    ) => {
      if (preferredStatusIds.length === 0) return;
      const now = new Date().toISOString();
      const closed = new Set(closedStatusIds);
      const changes: {
        taskId: string;
        fromStatus: string;
        toStatus: string;
      }[] = [];

      for (const task of tasksRef.current) {
        if (
          task.parentId !== parentTaskId ||
          task.kind !== "subtask" ||
          task.status !== fromStatusId
        ) {
          continue;
        }
        const incomplete =
          checklistsEnabledRef.current &&
          taskHasIncompleteChecklists(task.checklists ?? []);
        const toStatus =
          preferredStatusIds.find(
            (statusId) => !(closed.has(statusId) && incomplete),
          ) ?? preferredStatusIds[0];
        if (!toStatus || toStatus === task.status) continue;
        changes.push({
          taskId: task.id,
          fromStatus: task.status,
          toStatus,
        });
      }

      if (changes.length === 0) return;

      const byId = new Map(changes.map((change) => [change.taskId, change.toStatus]));
      setTasks((current) =>
        current.map((task) => {
          const toStatus = byId.get(task.id);
          if (!toStatus) return task;
          return {
            ...task,
            status: toStatus as WorkTaskStatus,
            statusChangedAt: now,
          };
        }),
      );

      const actorId = assignmentNotifyRef.current.actorId;
      const nextEvents = changes.map((change) =>
        createActivity({
          actorId,
          taskId: change.taskId,
          kind: "status",
          fromStatus: change.fromStatus as WorkTaskStatus,
          toStatus: change.toStatus as WorkTaskStatus,
          at: now,
        }),
      );
      setActivities((current) => [...current, ...nextEvents]);
      for (const change of changes) {
        void updateTaskRow(change.taskId, {
          status: change.toStatus as WorkTaskStatus,
          statusChangedAt: now,
        }).catch((error) => {
          console.error("Failed to reassign subtask status", formatSupabaseError(error));
        });
      }
      for (const event of nextEvents) {
        persistActivity(event, "Failed to save status activity");
      }
    },
    [persistActivity],
  );

  const renameSystemStatus = useCallback(
    (statusId: string, label: string) => {
      const trimmed = label.trim();
      if (!statusId.trim() || !trimmed) return;
      setTeamStatusLabels((current) => ({ ...current, [statusId]: trimmed }));
      if (teamId) {
        void upsertTeamStatusLabel(teamId, statusId, trimmed).catch((error) => {
          console.error("Failed to rename system status", error);
        });
      }
    },
    [teamId],
  );

  const resetSystemStatusLabel = useCallback(
    (statusId: string) => {
      if (!statusId.trim()) return;
      setTeamStatusLabels((current) => {
        if (!(statusId in current)) return current;
        const next = { ...current };
        delete next[statusId];
        return next;
      });
      if (teamId) {
        void deleteTeamStatusLabel(teamId, statusId).catch((error) => {
          console.error("Failed to reset system status label", error);
        });
      }
    },
    [teamId],
  );

  const reorderListStatuses = useCallback(
    (listId: string, orderedIds: string[]) => {
      setListStatuses((current) =>
        current.map((status) => {
          if (status.listId !== listId) return status;
          const index = orderedIds.indexOf(status.id);
          if (index < 0) return status;
          return { ...status, sortOrder: index };
        }),
      );
      void updateListStatusSortOrders(orderedIds).catch((error) => {
        console.error("Failed to reorder list statuses", error);
      });
    },
    [],
  );

  const updateTaskStatus = useCallback(
    (taskId: string, status: WorkTaskStatus) => {
      updateTask(taskId, { status });
    },
    [updateTask],
  );

  const visibleLists = useMemo(
    () =>
      privateListsEnabled
        ? lists
        : lists.map((list) =>
            list.isPrivate ? { ...list, isPrivate: false } : list,
          ),
    [lists, privateListsEnabled],
  );

  const value = useMemo(
    () => ({
      isReady,
      lists: visibleLists,
      tasks,
      listStatuses,
      workTaskStatuses,
      listAutomations,
      addList,
      updateList,
      deleteList,
      reorderLists,
      addTask,
      applyTemplate,
      updateTask,
      hideTask,
      restoreTask,
      moveSubtask,
      moveWorkItem,
      deleteTask,
      setWorkItemArchived,
      updateTaskStatus,
      addTaskComment,
      addTaskFile,
      renameTaskFile,
      removeTaskFile,
      reorderTasks,
      addListStatus,
      updateListStatus,
      deleteListStatus,
      reorderListStatuses,
      addWorkTaskStatus,
      updateWorkTaskStatus,
      deleteWorkTaskStatus,
      reassignSubtasksOffStatus,
      addListAutomation,
      updateListAutomation,
      deleteListAutomation,
      reassignTasksOffStatus,
      teamStatusLabels,
      renameSystemStatus,
      resetSystemStatusLabel,
      taskActivities: (taskId: string) =>
        activities
          .filter((item) => item.taskId === taskId)
          .slice()
          .sort((left, right) => right.at.localeCompare(left.at)),
      taskFiles: (taskId: string) =>
        files.filter((file) => file.taskId === taskId),
      allTaskFiles: files,
      listTasks: (listId: string) => getListTasks(tasks, listId),
      archivedListTasks: (listId: string) => getArchivedListRoots(tasks, listId),
      childTasks: (parentId: string) => getChildTasks(tasks, parentId),
      subtasks: (parentId: string) => getSubtasks(tasks, parentId),
    }),
    [
      activities,
      addList,
      updateList,
      deleteList,
      reorderLists,
      addTask,
      applyTemplate,
      addTaskComment,
      addTaskFile,
      renameTaskFile,
      removeTaskFile,
      deleteTask,
      setWorkItemArchived,
      hideTask,
      restoreTask,
      moveSubtask,
      moveWorkItem,
      files,
      isReady,
      visibleLists,
      listStatuses,
      workTaskStatuses,
      listAutomations,
      reorderTasks,
      addListStatus,
      updateListStatus,
      deleteListStatus,
      reorderListStatuses,
      addWorkTaskStatus,
      updateWorkTaskStatus,
      deleteWorkTaskStatus,
      reassignSubtasksOffStatus,
      addListAutomation,
      updateListAutomation,
      deleteListAutomation,
      reassignTasksOffStatus,
      teamStatusLabels,
      renameSystemStatus,
      resetSystemStatusLabel,
      tasks,
      updateTask,
      updateTaskStatus,
    ],
  );

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
}

export function useLists() {
  const context = useContext(ListsContext);
  if (!context) {
    throw new Error("useLists must be used within ListsProvider");
  }
  return context;
}

export function useListsOptional() {
  return useContext(ListsContext);
}
