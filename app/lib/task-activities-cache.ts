"use client";

import { useEffect, useSyncExternalStore } from "react";
import { fetchTaskActivities } from "@/app/lib/db/work-data";
import type { TaskActivity } from "@/app/lib/task-activity";

const EMPTY: TaskActivity[] = [];
const cache = new Map<string, TaskActivity[]>();
const listeners = new Map<string, Set<() => void>>();
const inflight = new Map<string, Promise<void>>();
const pendingEmits = new Set<string>();
let emitScheduled = false;

function emit(taskId: string) {
  pendingEmits.add(taskId);
  if (emitScheduled) return;
  emitScheduled = true;
  queueMicrotask(() => {
    emitScheduled = false;
    const ids = [...pendingEmits];
    pendingEmits.clear();
    for (const id of ids) {
      const set = listeners.get(id);
      if (!set) continue;
      for (const listener of set) listener();
    }
  });
}

export function subscribeTaskActivities(taskId: string, listener: () => void) {
  const set = listeners.get(taskId) ?? new Set();
  set.add(listener);
  listeners.set(taskId, set);
  return () => {
    const current = listeners.get(taskId);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) listeners.delete(taskId);
  };
}

export function readTaskActivities(taskId: string): TaskActivity[] {
  return cache.get(taskId) ?? EMPTY;
}

export function setTaskActivities(taskId: string, items: TaskActivity[]) {
  cache.set(
    taskId,
    items.slice().sort((left, right) => right.at.localeCompare(left.at)),
  );
  emit(taskId);
}

export function appendTaskActivity(activity: TaskActivity) {
  const current = cache.get(activity.taskId);
  if (!current) return;
  setTaskActivities(activity.taskId, [...current, activity]);
}

export function patchTaskActivities(activities: TaskActivity[]) {
  const byTask = new Map<string, TaskActivity[]>();
  for (const activity of activities) {
    const list = byTask.get(activity.taskId) ?? [];
    list.push(activity);
    byTask.set(activity.taskId, list);
  }
  for (const [taskId, updates] of byTask) {
    const current = cache.get(taskId);
    if (!current) continue;
    const byId = new Map(updates.map((item) => [item.id, item]));
    setTaskActivities(
      taskId,
      current.map((item) => byId.get(item.id) ?? item),
    );
  }
}

export function clearTaskActivities(taskIds: string[]) {
  for (const taskId of taskIds) {
    cache.delete(taskId);
    inflight.delete(taskId);
    emit(taskId);
  }
}

export function loadTaskActivities(taskId: string) {
  if (!taskId || cache.has(taskId) || inflight.has(taskId)) return;
  const request = fetchTaskActivities(taskId)
    .then((items) => {
      setTaskActivities(taskId, items);
    })
    .catch((error) => {
      console.error("Failed to load task activities", error);
      if (!cache.has(taskId)) setTaskActivities(taskId, []);
    })
    .finally(() => {
      if (inflight.get(taskId) === request) inflight.delete(taskId);
    });
  inflight.set(taskId, request);
}

export function useTaskActivities(taskId: string | null | undefined): TaskActivity[] {
  const id = taskId ?? "";

  useEffect(() => {
    if (!id) return;
    loadTaskActivities(id);
  }, [id]);

  return useSyncExternalStore(
    (onStoreChange) => (id ? subscribeTaskActivities(id, onStoreChange) : () => undefined),
    () => (id ? readTaskActivities(id) : EMPTY),
    () => EMPTY,
  );
}
