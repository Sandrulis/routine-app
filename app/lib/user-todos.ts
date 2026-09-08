export const USER_TODO_TITLE_MAX = 500;
export const TODO_RAIL_COLLAPSED_STORAGE_KEY = "routine-app-todo-rail-collapsed";

export type UserTodo = {
  id: string;
  userId: string;
  title: string;
  isDone: boolean;
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export function createUserTodoId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `todo-${crypto.randomUUID()}`;
  }
  return `todo-${Date.now()}`;
}

export function normalizeTodoTitle(value: string): string {
  return value.trim().slice(0, USER_TODO_TITLE_MAX);
}
