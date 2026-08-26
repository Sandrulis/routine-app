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
};

function normalizeSearchText(value: string): string {
  return value.trim().toLowerCase();
}

function taskMatchesQuery(task: WorkTask, needle: string): boolean {
  const haystack = `${task.title} ${task.description}`.toLowerCase();
  return haystack.includes(needle);
}

export function searchDashboardTasks(
  query: string,
  tasks: WorkTask[],
  lists: WorkList[],
  limit = 60,
): DashboardTaskSearchHit[] {
  const needle = normalizeSearchText(query);
  if (!needle) {
    return [];
  }

  const listById = new Map(lists.map((list) => [list.id, list]));
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const hits: DashboardTaskSearchHit[] = [];

  for (const task of tasks) {
    if (isWorkFolder(task) || isTaskDeleted(task)) {
      continue;
    }
    if (!taskMatchesQuery(task, needle)) {
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
    });
  }

  hits.sort((a, b) => {
    if (a.archived !== b.archived) {
      return a.archived ? 1 : -1;
    }
    if (a.task.kind !== b.task.kind) {
      return isWorkSubtask(a.task) ? 1 : -1;
    }
    return a.task.title.localeCompare(b.task.title, "lv");
  });

  return hits.slice(0, limit);
}
