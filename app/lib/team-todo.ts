import { todayIsoDate } from "@/app/lib/format-display-date";
import {
  TEAM_MEMBERS,
  getTeamMember as getTeamMemberFromList,
  type TeamMember,
} from "@/app/lib/team";

export type { TeamMember };
export { TEAM_MEMBERS };

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
  members: TeamMember[] = TEAM_MEMBERS,
): TeamMember | null {
  return getTeamMemberFromList(members, id);
}

export function createDefaultItems(
  t: (key: string, fallback: string) => string,
): TodoItem[] {
  const today = todayIsoDate();

  return [
    {
      id: "task-standup",
      title: t("todo.defaults.standup", "Rīta standup piezīmes"),
      description: t(
        "todo.defaults.standup_description",
        "Sagatavot īsu kopsavilkumu par vakardienas darbiem.",
      ),
      status: "todo",
      assigneeId: "anna",
      dueDate: today,
    },
    {
      id: "task-client-call",
      title: t("todo.defaults.client_call", "Zvanīt klientam par termiņiem"),
      description: t(
        "todo.defaults.client_call_description",
        "Saskaņot nākamās nedēļas piegādes datumu.",
      ),
      status: "todo",
      assigneeId: "kristaps",
      dueDate: today,
    },
    {
      id: "task-review",
      title: t("todo.defaults.review", "Pārskatīt nedēļas uzdevumus"),
      description: t(
        "todo.defaults.review_description",
        "Aizvērt pabeigtos darbus un pārdalīt atlikušos.",
      ),
      status: "in_progress",
      assigneeId: "janis",
      dueDate: today,
    },
    {
      id: "task-docs",
      title: t("todo.defaults.docs", "Atjaunināt iekšējo dokumentāciju"),
      description: t(
        "todo.defaults.docs_description",
        "Pierakstīt, kā komanda pievieno un piešķir uzdevumus.",
      ),
      status: "done",
      assigneeId: "marta",
      dueDate: null,
    },
  ];
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
      const assigneeId =
        "assigneeId" in item && typeof item.assigneeId === "string"
          ? item.assigneeId
          : null;
      const dueDate =
        "dueDate" in item && typeof item.dueDate === "string" && item.dueDate
          ? item.dueDate
          : null;

      if (!id || !title || !isTodoStatus(status)) return null;

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
