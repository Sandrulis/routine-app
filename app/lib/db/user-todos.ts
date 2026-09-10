import { createClient } from "@/app/lib/supabase/client";
import { formatSupabaseError } from "@/app/lib/db/work-data";
import type { UserTodo } from "@/app/lib/user-todos";

type UserTodoRow = {
  id: string;
  user_id: string;
  title: string;
  is_done: boolean;
  completed_at: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

function db() {
  return createClient();
}

function mapRow(row: UserTodoRow): UserTodo {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    isDone: row.is_done,
    completedAt: row.completed_at,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchUserTodos(userId: string): Promise<UserTodo[]> {
  const { data, error } = await db()
    .from("user_todos")
    .select("id, user_id, title, is_done, completed_at, sort_order, created_at, updated_at")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw new Error(formatSupabaseError(error));
  return ((data ?? []) as UserTodoRow[]).map(mapRow);
}

export async function insertUserTodo(item: UserTodo): Promise<void> {
  const { error } = await db().from("user_todos").insert({
    id: item.id,
    user_id: item.userId,
    title: item.title,
    is_done: item.isDone,
    completed_at: item.completedAt,
    sort_order: item.sortOrder,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function updateUserTodoTitle(
  userId: string,
  id: string,
  title: string,
): Promise<void> {
  const { error } = await db()
    .from("user_todos")
    .update({ title })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function updateUserTodoDone(
  userId: string,
  id: string,
  isDone: boolean,
  completedAt: string | null,
): Promise<void> {
  const { error } = await db()
    .from("user_todos")
    .update({
      is_done: isDone,
      completed_at: completedAt,
    })
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteUserTodo(userId: string, id: string): Promise<void> {
  const { error } = await db()
    .from("user_todos")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function reorderUserTodos(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await db()
      .from("user_todos")
      .update({ sort_order: i })
      .eq("user_id", userId)
      .eq("id", orderedIds[i])
      .eq("is_done", false);
    if (error) throw new Error(formatSupabaseError(error));
  }
}
