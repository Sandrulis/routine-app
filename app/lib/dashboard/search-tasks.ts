import {
  isTaskDeleted,
  isWorkFolder,
  isWorkItemArchived,
  isWorkSubtask,
  type WorkList,
  type WorkTask,
} from "@/app/lib/lists";

export type DashboardTaskSearchHit = {
  task: WorkTask;
  listName: string;
  parentTitle: string | null;
  archived: boolean;
  matchedFileName: string | null;
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function stripMarkup(value: string): string {
  return value.replace(/<[^>]+>/g, " ");
}

function checklistSearchText(task: WorkTask): string {
  return task.checklists
    .flatMap((list) => [list.title, ...list.items.map((item) => item.title)])
    .join(" ");
}

function taskMatchesQuery(
  task: WorkTask,
  needle: string,
  fileNames: string[],
): { match: boolean; matchedFileName: string | null } {
  if (task.title.toLowerCase().includes(needle)) {
    return { match: true, matchedFileName: null };
  }
  if (stripMarkup(task.description).toLowerCase().includes(needle)) {
    return { match: true, matchedFileName: null };
  }
  if (checklistSearchText(task).toLowerCase().includes(needle)) {
    return { match: true, matchedFileName: null };
  }
  const matchedFileName =
    fileNames.find((name) => name.toLowerCase().includes(needle)) ?? null;
  if (matchedFileName) {
    return { match: true, matchedFileName };
  }
  return { match: false, matchedFileName: null };
}

export function searchDashboardTasks(
  query: string,
  tasks: WorkTask[],
  lists: WorkList[],
  taskFiles: Array<{ taskId: string; name: string }> = [],
  limit = 60,
): DashboardTaskSearchHit[] {
  const needle = normalizeSearchText(query);
  if (!needle) {
    return [];
  }

  const listById = new Map(lists.map((list) => [list.id, list]));
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const fileNamesByTask = new Map<string, string[]>();
  for (const file of taskFiles) {
    const names = fileNamesByTask.get(file.taskId) ?? [];
    names.push(file.name);
    fileNamesByTask.set(file.taskId, names);
  }
  const hits: DashboardTaskSearchHit[] = [];

  for (const task of tasks) {
    if (isWorkFolder(task) || isTaskDeleted(task)) {
      continue;
    }
    const { match, matchedFileName } = taskMatchesQuery(
      task,
      needle,
      fileNamesByTask.get(task.id) ?? [],
    );
    if (!match) {
      continue;
    }

    const list = listById.get(task.listId);
    if (!list) {
      continue;
    }

    let parentTitle: string | null = null;
    if (task.parentId) {
      const parent = taskById.get(task.parentId);
      parentTitle = parent?.title?.trim() || null;
    }

    hits.push({
      task,
      listName: list.name,
      parentTitle,
      archived: isWorkItemArchived(task),
      matchedFileName,
    });
  }

  hits.sort((a, b) => {
    if (a.archived !== b.archived) {
      return a.archived ? 1 : -1;
    }
    const aTitle = a.task.title.toLowerCase().includes(needle);
    const bTitle = b.task.title.toLowerCase().includes(needle);
    if (aTitle !== bTitle) {
      return aTitle ? -1 : 1;
    }
    if (a.task.kind !== b.task.kind) {
      return isWorkSubtask(a.task) ? 1 : -1;
    }
    return a.task.title.localeCompare(b.task.title, "lv");
  });

  return hits.slice(0, limit);
}
