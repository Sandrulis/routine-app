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
  LISTS_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  createDefaultLists,
  createDefaultTasks,
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
  normalizeStoredLists,
  normalizeStoredTasks,
  type WorkList,
  type WorkListKind,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import {
  TASK_ACTIVITY_STORAGE_KEY,
  TASK_FILES_STORAGE_KEY,
  createActivity,
  createDefaultActivities,
  createDefaultTaskFiles,
  createTaskFileId,
  ensureDefaultTaskFileContents,
  mergeDefaultTaskFiles,
  normalizeStoredActivities,
  normalizeStoredTaskFiles,
  removeTaskFileContent,
  sameIds,
  storeTaskFileContent,
  type TaskActivity,
  type TaskFile,
} from "@/app/lib/task-activity";
import {
  deleteStoredListFilesForList,
  deleteStoredListFilesForParents,
  childListFiles,
  mimeFromName,
  nextItemSortOrder,
  readAllListFiles,
} from "@/app/lib/list-files";

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
  }) => WorkList;
  updateList: (
    listId: string,
    patch: Partial<Pick<WorkList, "name" | "description" | "icon" | "color">>,
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
        "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate"
      >
    >,
  ) => void;
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
  const loadedFromStorage = useRef(false);
  const [lists, setLists] = useState<WorkList[]>(createDefaultLists);
  const [tasks, setTasks] = useState<WorkTask[]>(createDefaultTasks);
  const [activities, setActivities] = useState<TaskActivity[]>(
    createDefaultActivities,
  );
  const [files, setFiles] = useState<TaskFile[]>(createDefaultTaskFiles);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (loadedFromStorage.current) return;
    loadedFromStorage.current = true;

    try {
      const storedLists = window.localStorage.getItem(LISTS_STORAGE_KEY);
      const storedTasks = window.localStorage.getItem(TASKS_STORAGE_KEY);
      const storedActivities = window.localStorage.getItem(
        TASK_ACTIVITY_STORAGE_KEY,
      );
      const storedFiles = window.localStorage.getItem(TASK_FILES_STORAGE_KEY);
      setLists(
        storedLists
          ? (normalizeStoredLists(JSON.parse(storedLists)) ?? createDefaultLists())
          : createDefaultLists(),
      );
      setTasks(
        storedTasks
          ? (normalizeStoredTasks(JSON.parse(storedTasks)) ?? createDefaultTasks())
          : createDefaultTasks(),
      );
      setActivities(
        storedActivities
          ? (normalizeStoredActivities(JSON.parse(storedActivities)) ??
            createDefaultActivities())
          : createDefaultActivities(),
      );
      setFiles(
        mergeDefaultTaskFiles(
          storedFiles
            ? (normalizeStoredTaskFiles(JSON.parse(storedFiles)) ??
              createDefaultTaskFiles())
            : createDefaultTaskFiles(),
        ),
      );
    } catch {
      setLists(createDefaultLists());
      setTasks(createDefaultTasks());
      setFiles(createDefaultTaskFiles());
    } finally {
      ensureDefaultTaskFileContents();
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (!isReady) return;
    window.localStorage.setItem(LISTS_STORAGE_KEY, JSON.stringify(lists));
    window.localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    window.localStorage.setItem(
      TASK_ACTIVITY_STORAGE_KEY,
      JSON.stringify(activities),
    );
    window.localStorage.setItem(TASK_FILES_STORAGE_KEY, JSON.stringify(files));
  }, [activities, files, isReady, lists, tasks]);

  const addList = useCallback(
    (input: {
      name: string;
      description: string;
      icon?: string | null;
      color?: string;
      kind?: WorkListKind;
    }) => {
      const kind = input.kind ?? "list";
      const list: WorkList = {
        id: createListId(),
        name: input.name.trim(),
        description: input.description.trim(),
        icon:
          input.icon?.trim() ||
          (kind === "folder" ? "far fa-folder" : null),
        color: listColorById(input.color ?? randomListColorId()).id,
        kind,
      };

      setLists((current) => [...current, list]);
      return list;
    },
    [],
  );

  const updateList = useCallback(
    (
      listId: string,
      patch: Partial<Pick<WorkList, "name" | "description" | "icon" | "color">>,
    ) => {
      setLists((current) =>
        current.map((list) => {
          if (list.id !== listId) return list;
          const nextColor =
            patch.color !== undefined
              ? listColorById(patch.color).id
              : list.color;
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
          };
        }),
      );
    },
    [],
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
          if (removedIds.has(file.taskId)) removeTaskFileContent(file.id);
        }
        return next;
      });
      return current.filter((task) => task.listId !== listId);
    });
    deleteStoredListFilesForList(listId);
  }, []);

  const addTask = useCallback(
    (input: {
      listId: string;
      parentId?: string | null;
      kind?: WorkTaskKind;
      title: string;
      description: string;
    }) => {
      const task: WorkTask = {
        id: createTaskId(),
        listId: input.listId,
        parentId: input.parentId ?? null,
        kind: input.kind ?? (input.parentId ? "subtask" : "task"),
        title: input.title.trim(),
        description: input.description.trim(),
        status: "todo",
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
      setActivities((current) => [
        ...current,
        createActivity({ taskId: task.id, kind: "created" }),
      ]);
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
          "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate"
        >
      >,
    ) => {
      setTasks((current) => {
        const existing = current.find((task) => task.id === taskId);
        if (existing) {
          const nextEvents: TaskActivity[] = [];
          if (patch.status && patch.status !== existing.status) {
            nextEvents.push(
              createActivity({
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
                taskId,
                kind: "assignees",
                assigneeIds: patch.assigneeIds,
              }),
            );
          }
          if (
            patch.startDate !== undefined &&
            patch.startDate !== existing.startDate
          ) {
            nextEvents.push(
              createActivity({
                taskId,
                kind: "start_date",
                dateValue: patch.startDate,
              }),
            );
          }
          if (patch.dueDate !== undefined && patch.dueDate !== existing.dueDate) {
            nextEvents.push(
              createActivity({
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
          }
        }

        return current.map((task) =>
          task.id === taskId ? { ...task, ...patch } : task,
        );
      });
    },
    [],
  );

  const addTaskComment = useCallback((taskId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setActivities((current) => [
      ...current,
      createActivity({ taskId, kind: "comment", text: trimmed }),
    ]);
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
    record.hasContent = await storeTaskFileContent(record.id, file);
    setFiles((current) => [...current, record]);
    setActivities((current) => [
      ...current,
      createActivity({ taskId, kind: "file", fileName: record.name }),
    ]);
    return record;
  }, []);

  const removeTaskFile = useCallback((fileId: string) => {
    setFiles((current) => current.filter((file) => file.id !== fileId));
    removeTaskFileContent(fileId);
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
          if (removedIds.includes(file.taskId)) removeTaskFileContent(file.id);
        }
        return next;
      });
      return current.filter((task) => !removedIds.includes(task.id));
    });
    deleteStoredListFilesForParents(removedIds);
  }, []);

  const reorderTasks = useCallback((orderedIds: string[]) => {
    setTasks((current) => applySortOrder(current, orderedIds));
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
