import { getTaskAncestors, type WorkList, type WorkTask } from "@/app/lib/lists";

export function googleDrivePathForListFile(input: {
  lists: WorkList[];
  tasks: WorkTask[];
  listId: string;
  parentId: string | null;
}) {
  const listName =
    input.lists.find((item) => item.id === input.listId)?.name.trim() || "list";
  const parts = [listName];
  if (input.parentId) {
    const parent = input.tasks.find((item) => item.id === input.parentId);
    if (parent) {
      for (const ancestor of getTaskAncestors(input.tasks, parent)) {
        const title = ancestor.title.trim();
        if (title) parts.push(title);
      }
      const title = parent.title.trim();
      if (title) parts.push(title);
    }
  }
  return parts;
}

export function googleDrivePathForTaskFile(input: {
  lists: WorkList[];
  tasks: WorkTask[];
  taskId: string;
}) {
  const task = input.tasks.find((item) => item.id === input.taskId);
  if (!task) return [];
  const listName =
    input.lists.find((item) => item.id === task.listId)?.name.trim() || "list";
  const parts = [listName];
  for (const ancestor of getTaskAncestors(input.tasks, task)) {
    const title = ancestor.title.trim();
    if (title) parts.push(title);
  }
  const title = task.title.trim();
  if (title) parts.push(title);
  return parts;
}
