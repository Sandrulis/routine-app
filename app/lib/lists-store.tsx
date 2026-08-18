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
  type WorkTaskKind,
  listColorById,
  randomListColorId,
  type WorkList,
  type WorkListKind,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import {
  DEFAULT_LIST_ACCESS_LEVEL,
  accessIds,
  type ListAccessLevel,
} from "@/app/lib/list-access";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { useTeam } from "@/app/lib/team-store";
import {
  appendNotifications,
  notificationsForNewAssignees,
} from "@/app/lib/notifications";
import {
  createActivity,
  createTaskFileId,
  hydrateTaskFileContents,
  cacheTaskFileContent,
  sameIds,
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
import {
  deleteListRow,
  deleteTaskFileRow,
  deleteTaskRow,
  fetchTeamWorkspace,
  insertActivity,
  insertList,
  insertTask,
  insertTaskFile,
  updateListRow,
  updateTaskFileName,
  updateTaskRow,
  updateTaskSortOrders,
} from "@/app/lib/db/work-data";

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
        | "isPrivate"
        | "defaultAccessLevel"
        | "viewerUserIds"
        | "viewerRoleIds"
        | "viewerUserAccess"
        | "viewerRoleAccess"
      >
    >,
  ) => void;
  deleteList: (listId: string) => void;
  addTask: (input: {
    listId: string;
    parentId?: string | null;
    kind?: WorkTaskKind;
    title: string;
    description: string;
  }) => WorkTask;
  updateTaskStatus: (taskId: string, status: WorkTaskStatus) => void;
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<
        WorkTask,
        "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate" | "deletedAt"
      >
    >,
  ) => void;
  hideTask: (taskId: string) => void;
  restoreTask: (taskId: string) => void;
  moveSubtask: (taskId: string, parentId: string) => void;
  deleteTask: (taskId: string) => void;
  addTaskComment: (taskId: string, text: string) => void;
  addTaskFile: (taskId: string, file: File) => Promise<TaskFile>;
  renameTaskFile: (fileId: string, name: string) => void;
  removeTaskFile: (fileId: string) => void;
  taskActivities: (taskId: string) => TaskActivity[];
  taskFiles: (taskId: string) => TaskFile[];
  listTasks: (listId: string) => WorkTask[];
  childTasks: (parentId: string) => WorkTask[];
  subtasks: (parentId: string) => WorkTask[];
  reorderTasks: (orderedIds: string[]) => void;
};

const ListsContext = createContext<ListsContextValue | null>(null);

export function ListsProvider({ children }: { children: ReactNode }) {
  const { user: authUser, isReady: authReady } = useAuthSession();
  const { isReady: teamReady, currentTeam, currentUser, members } = useTeam();
  const userId = authUser?.id ?? null;
  const teamId = currentTeam?.id ?? null;
  const scopeKey = `${userId ?? "anon"}:${teamId ?? ""}`;
  const canLoad = authReady && teamReady;
  const [lists, setLists] = useState<WorkList[]>([]);
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [files, setFiles] = useState<TaskFile[]>([]);
  const [isReady, setIsReady] = useState(false);
  const listsRef = useRef(lists);
  listsRef.current = lists;
  const assignmentNotifyRef = useRef({
    actorId: "",
    memberIds: [] as string[],
    userId,
    teamId,
  });
  assignmentNotifyRef.current = {
    actorId: currentUser.id,
    memberIds: members.map((member) => member.id),
    userId,
    teamId,
  };

  useEffect(() => {
    if (!canLoad) return;
    setIsReady(false);

    if (userId && !teamId) {
      setLists([]);
      setTasks([]);
      setActivities([]);
      setFiles([]);
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
      hydrateListFiles(null, [], {});
      hydrateTaskFileContents({});
      setIsReady(true);
      return;
    }

    let cancelled = false;
    void fetchTeamWorkspace(teamId)
      .then((workspace) => {
        if (cancelled) return;
        setLists(workspace.lists);
        setTasks(workspace.tasks);
        setActivities(workspace.activities);
        setFiles(workspace.taskFiles);
        hydrateListFiles(teamId, workspace.listFiles, workspace.listFileContents);
        hydrateTaskFileContents(workspace.taskFileContents);
      })
      .catch((error) => {
        console.error("Failed to load lists", error);
        if (cancelled) return;
        setLists([]);
        setTasks([]);
        setActivities([]);
        setFiles([]);
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
      const isPrivate = input.isPrivate === true;
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
        kind,
        isPrivate,
        createdBy: userId,
        defaultAccessLevel,
        viewerUserIds,
        viewerRoleIds,
        viewerUserAccess,
        viewerRoleAccess,
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
          | "isPrivate"
          | "defaultAccessLevel"
          | "viewerUserIds"
          | "viewerRoleIds"
          | "viewerUserAccess"
          | "viewerRoleAccess"
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
          const isPrivate =
            patch.isPrivate !== undefined ? patch.isPrivate : list.isPrivate;
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
        isPrivate: patch.isPrivate,
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

  const addTask = useCallback(
    (input: {
      listId: string;
      parentId?: string | null;
      kind?: WorkTaskKind;
      title: string;
      description: string;
    }) => {
      const createdAt = new Date().toISOString();
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
        assigneeIds: [],
        startDate: null,
        dueDate: null,
        sortOrder: 0,
      };
      setTasks((current) => {
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
        void insertTask(activeTeamId, task)
          .then(() => insertActivity(activeTeamId, createdActivity))
          .catch((error) => {
            console.error("Failed to save task", error);
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
          "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate" | "deletedAt"
        >
      >,
    ) => {
      setTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        if (!existing) {
          return current.map((task) =>
            task.id === taskId ? { ...task, ...patch } : task,
          );
        }

        const nextEvents: TaskActivity[] = [];
        let statusChangedAt = existing.statusChangedAt;
        if (patch.status && patch.status !== existing.status) {
          statusChangedAt = new Date().toISOString();
          nextEvents.push(
            createActivity({
              actorId: assignmentNotifyRef.current.actorId,
              taskId,
              kind: "status",
              fromStatus: existing.status,
              toStatus: patch.status,
            }),
          );
        }
        if (
          patch.assigneeIds &&
          !sameIds(existing.assigneeIds, patch.assigneeIds)
        ) {
          nextEvents.push(
            createActivity({
              actorId: assignmentNotifyRef.current.actorId,
              taskId,
              kind: "assignees",
              assigneeIds: patch.assigneeIds,
            }),
          );
          const addedIds = patch.assigneeIds.filter(
            (id) => !existing.assigneeIds.includes(id),
          );
          const parentId =
            existing.kind === "subtask" && existing.parentId
              ? existing.parentId
              : existing.id;
          const notify = assignmentNotifyRef.current;
          const extra = notificationsForNewAssignees({
            actorId: notify.actorId,
            addedIds,
            memberIds: notify.memberIds,
            taskTitle: patch.title ?? existing.title,
            href: `/lists/${existing.listId}/tasks/${parentId}`,
          });
          if (extra.length > 0) {
            queueMicrotask(() =>
              appendNotifications(extra, notify.userId, notify.teamId),
            );
          }
        }
        if (
          patch.startDate !== undefined &&
          patch.startDate !== existing.startDate
        ) {
          nextEvents.push(
            createActivity({
              actorId: assignmentNotifyRef.current.actorId,
              taskId,
              kind: "start_date",
              dateValue: patch.startDate,
            }),
          );
        }
        if (patch.dueDate !== undefined && patch.dueDate !== existing.dueDate) {
          nextEvents.push(
            createActivity({
              actorId: assignmentNotifyRef.current.actorId,
              taskId,
              kind: "due_date",
              dateValue: patch.dueDate,
            }),
          );
        }
        if (nextEvents.length > 0) {
          setActivities((currentActivities) => [
            ...currentActivities,
            ...nextEvents,
          ]);
          const activeTeamId = assignmentNotifyRef.current.teamId;
          if (activeTeamId) {
            for (const event of nextEvents) {
              void insertActivity(activeTeamId, event).catch((error) => {
                console.error("Failed to save activity", error);
              });
            }
          }
        }

        const dbPatch = {
          ...patch,
          ...(patch.status && patch.status !== existing.status
            ? { statusChangedAt }
            : {}),
        };

        void updateTaskRow(taskId, dbPatch).catch((error) => {
          console.error("Failed to update task", error);
        });

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
    [],
  );

  const addTaskComment = useCallback((taskId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const activity = createActivity({
      actorId: assignmentNotifyRef.current.actorId,
      taskId,
      kind: "comment",
      text: trimmed,
    });
    setActivities((current) => [...current, activity]);
    const activeTeamId = assignmentNotifyRef.current.teamId;
    if (activeTeamId) {
      void insertActivity(activeTeamId, activity).catch((error) => {
        console.error("Failed to save comment", error);
      });
    }
  }, []);

  const addTaskFile = useCallback(async (taskId: string, file: File) => {
    const name = file.name.trim() || "file";
    const record: TaskFile = {
      id: createTaskFileId(),
      taskId,
      name,
      mimeType: file.type || mimeFromName(name),
      size: file.size,
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
          console.error("Failed to save task file", error);
        });
    }
    return record;
  }, []);

  const removeTaskFile = useCallback((fileId: string) => {
    setFiles((current) => current.filter((file) => file.id !== fileId));
    cacheTaskFileContent(fileId, null);
    void deleteTaskFileRow(fileId).catch((error) => {
      console.error("Failed to delete task file", error);
    });
  }, []);

  const renameTaskFile = useCallback((fileId: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setFiles((current) =>
      current.map((file) =>
        file.id === fileId
          ? { ...file, name: trimmed, mimeType: mimeFromName(trimmed) }
          : file,
      ),
    );
    void updateTaskFileName(fileId, trimmed, mimeFromName(trimmed)).catch((error) => {
      console.error("Failed to rename task file", error);
    });
  }, []);

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
      void updateTaskRow(taskId, { parentId, sortOrder }).catch((error) => {
        console.error("Failed to move subtask", error);
      });
      return current.map((task) =>
        task.id === taskId ? { ...task, parentId, sortOrder } : task,
      );
    });
  }, []);

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
    deleteStoredListFilesForParents(removedIds);
    void deleteTaskRow(taskId).catch((error) => {
      console.error("Failed to delete task", error);
    });
  }, []);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks((current) => applySortOrder(current, orderedIds));
    void updateTaskSortOrders(orderedIds).catch((error) => {
      console.error("Failed to reorder tasks", error);
    });
  }, []);

  const updateTaskStatus = useCallback(
    (taskId: string, status: WorkTaskStatus) => {
      updateTask(taskId, { status });
    },
    [updateTask],
  );

  const value = useMemo(
    () => ({
      isReady,
      lists,
      tasks,
      addList,
      updateList,
      deleteList,
      addTask,
      updateTask,
      hideTask,
      restoreTask,
      moveSubtask,
      deleteTask,
      updateTaskStatus,
      addTaskComment,
      addTaskFile,
      renameTaskFile,
      removeTaskFile,
      reorderTasks,
      taskActivities: (taskId: string) =>
        activities
          .filter((item) => item.taskId === taskId)
          .slice()
          .sort((left, right) => right.at.localeCompare(left.at)),
      taskFiles: (taskId: string) =>
        files.filter((file) => file.taskId === taskId),
      listTasks: (listId: string) => getListTasks(tasks, listId),
      childTasks: (parentId: string) => getChildTasks(tasks, parentId),
      subtasks: (parentId: string) => getSubtasks(tasks, parentId),
    }),
    [
      activities,
      addList,
      updateList,
      deleteList,
      addTask,
      addTaskComment,
      addTaskFile,
      renameTaskFile,
      removeTaskFile,
      deleteTask,
      hideTask,
      restoreTask,
      moveSubtask,
      files,
      isReady,
      lists,
      reorderTasks,
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
