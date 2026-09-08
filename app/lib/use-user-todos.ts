"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteUserTodo,
  fetchUserTodos,
  insertUserTodo,
  updateUserTodoDone,
} from "@/app/lib/db/user-todos";
import {
  createUserTodoId,
  normalizeTodoTitle,
  type UserTodo,
} from "@/app/lib/user-todos";

export function useUserTodos(userId: string | null | undefined) {
  const [items, setItems] = useState<UserTodo[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsReady(true);
      return;
    }

    let cancelled = false;
    setIsReady(false);
    void fetchUserTodos(userId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setIsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const activeItems = useMemo(
    () => items.filter((item) => !item.isDone),
    [items],
  );

  const archivedItems = useMemo(
    () =>
      items
        .filter((item) => item.isDone)
        .slice()
        .sort((left, right) => {
          const leftAt = left.completedAt ?? left.updatedAt;
          const rightAt = right.completedAt ?? right.updatedAt;
          return rightAt.localeCompare(leftAt);
        }),
    [items],
  );

  const addTodo = useCallback(
    async (rawTitle: string) => {
      if (!userId) return;
      const title = normalizeTodoTitle(rawTitle);
      if (!title) return;

      const now = new Date().toISOString();
      const nextOrder =
        items.reduce((max, item) => Math.max(max, item.sortOrder), 0) + 1;
      const item: UserTodo = {
        id: createUserTodoId(),
        userId,
        title,
        isDone: false,
        completedAt: null,
        sortOrder: nextOrder,
        createdAt: now,
        updatedAt: now,
      };

      setItems((current) => [...current, item]);
      try {
        await insertUserTodo(item);
      } catch (error) {
        setItems((current) => current.filter((row) => row.id !== item.id));
        throw error;
      }
    },
    [items, userId],
  );

  const setTodoDone = useCallback(
    async (id: string, isDone: boolean) => {
      if (!userId) return;
      const previous = items;
      const completedAt = isDone ? new Date().toISOString() : null;
      const now = new Date().toISOString();
      setItems((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, isDone, completedAt, updatedAt: now }
            : item,
        ),
      );
      try {
        await updateUserTodoDone(userId, id, isDone, completedAt);
      } catch (error) {
        setItems(previous);
        throw error;
      }
    },
    [items, userId],
  );

  const removeTodo = useCallback(
    async (id: string) => {
      if (!userId) return;
      const previous = items;
      setItems((current) => current.filter((item) => item.id !== id));
      try {
        await deleteUserTodo(userId, id);
      } catch (error) {
        setItems(previous);
        throw error;
      }
    },
    [items, userId],
  );

  return {
    isReady,
    activeItems,
    archivedItems,
    addTodo,
    setTodoDone,
    removeTodo,
  };
}
