import { isLegacyDemoMemberId } from "@/app/lib/clear-legacy-demo-storage";
import {
  getTeamMember as getTeamMemberFromList,
  type TeamMember,
} from "@/app/lib/team";

export type { TeamMember };

export type TodoStatus = "todo" | "in_progress" | "done";

export type TodoItem = {
  id: string;
  title: string;
  description: string;
  status: TodoStatus;
  assigneeId: string | null;
  dueDate: string | null;
};

export const TODO_STORAGE_KEY = "routine-app-team-todo-list";
export const DELETE_ZONE_ID = "todo-delete-zone";

export function isTodoStatus(value: string): value is TodoStatus {
  return value === "todo" || value === "in_progress" || value === "done";
}

export function getTeamMember(
  id: string | null,
  members: TeamMember[],
): TeamMember | null {
  return getTeamMemberFromList(members, id);
}

export function normalizeStoredItems(value: unknown): TodoItem[] | null {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("title" in item) ||
        !("status" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const title = String(item.title).trim();
      const description =
        "description" in item && typeof item.description === "string"
          ? item.description
          : "";
      const status = String(item.status);
      const rawAssigneeId =
        "assigneeId" in item && typeof item.assigneeId === "string"
          ? item.assigneeId
          : null;
      const assigneeId = isLegacyDemoMemberId(rawAssigneeId) ? null : rawAssigneeId;
      const dueDate =
        "dueDate" in item && typeof item.dueDate === "string" && item.dueDate
          ? item.dueDate
          : null;

      if (!id || !title || !isTodoStatus(status)) return null;
      if (
        id === "task-standup" ||
        id === "task-client-call" ||
        id === "task-review" ||
        id === "task-docs"
      ) {
        return null;
      }

      return { id, title, description, status, assigneeId, dueDate };
    })
    .filter((item): item is TodoItem => item !== null);

  return items;
}

export function createTodoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `task-${crypto.randomUUID()}`;
  }
  return `task-${Date.now()}`;
}
