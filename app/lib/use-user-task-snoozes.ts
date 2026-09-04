"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteUserTaskSnooze,
  fetchUserTaskSnoozes,
  upsertUserTaskSnooze,
} from "@/app/lib/db/work-data";
import { isSnoozeActive } from "@/app/lib/task-snooze";

export function useUserTaskSnoozes(userId: string | null | undefined) {
  const [untilByTaskId, setUntilByTaskId] = useState<Map<string, string>>(
    () => new Map(),
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!userId) {
      setUntilByTaskId(new Map());
      return;
    }
    let cancelled = false;
    void fetchUserTaskSnoozes(userId)
      .then((map) => {
        if (!cancelled) setUntilByTaskId(map);
      })
      .catch(() => {
        if (!cancelled) setUntilByTaskId(new Map());
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const isSnoozed = useCallback(
    (taskId: string) => isSnoozeActive(untilByTaskId.get(taskId), now),
    [now, untilByTaskId],
  );

  const snoozeTask = useCallback(
    async (taskId: string, untilIso: string) => {
      if (!userId) return;
      const previous = untilByTaskId;
      setUntilByTaskId((current) => {
        const next = new Map(current);
        next.set(taskId, untilIso);
        return next;
      });
      try {
        await upsertUserTaskSnooze(userId, taskId, untilIso);
      } catch (error) {
        setUntilByTaskId(previous);
        throw error;
      }
    },
    [untilByTaskId, userId],
  );

  const unsnoozeTask = useCallback(
    async (taskId: string) => {
      if (!userId) return;
      const previous = untilByTaskId;
      setUntilByTaskId((current) => {
        const next = new Map(current);
        next.delete(taskId);
        return next;
      });
      try {
        await deleteUserTaskSnooze(userId, taskId);
      } catch (error) {
        setUntilByTaskId(previous);
        throw error;
      }
    },
    [untilByTaskId, userId],
  );

  return { isSnoozed, snoozeTask, unsnoozeTask };
}
