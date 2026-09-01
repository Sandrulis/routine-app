"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  deleteNotification,
  deleteNotifications,
  fetchVisibleNotifications,
  markNotificationsRead,
  purgeOldNotificationsOnce,
} from "@/app/lib/db/work-data";
import {
  NOTIFICATIONS_CHANGE_EVENT,
  unreadNotificationCount,
  type AppNotification,
} from "@/app/lib/notifications";

export function useNotifications() {
  const { user: authUser, isReady: authReady } = useAuthSession();
  const userId = authUser?.id ?? null;
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const refreshGenerationRef = useRef(0);

  const refresh = useCallback((options?: { silent?: boolean }) => {
    if (!authReady) return;
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    const generation = ++refreshGenerationRef.current;
    if (!options?.silent) setIsLoading(true);
    void purgeOldNotificationsOnce(30).catch(() => undefined);
    void fetchVisibleNotifications(null, userId)
      .then((next) => {
        if (generation !== refreshGenerationRef.current) return;
        setItems(next);
      })
      .catch((error) => {
        if (generation !== refreshGenerationRef.current) return;
        console.error("Failed to load notifications", error);
        setItems([]);
      })
      .finally(() => {
        if (generation === refreshGenerationRef.current) {
          setIsLoading(false);
        }
      });
  }, [authReady, userId]);

  useEffect(() => {
    if (!authReady) return;
    refresh();
    function handleChange() {
      refresh({ silent: true });
    }
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleChange);
    return () => {
      refreshGenerationRef.current += 1;
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleChange);
    };
  }, [authReady, refresh]);

  const unreadCount = useMemo(() => unreadNotificationCount(items), [items]);

  function markRead(id: string) {
    const readAt = new Date().toISOString();
    const next = items.map((item) =>
      item.id === id && item.readAt === null ? { ...item, readAt } : item,
    );
    setItems(next);
    void markNotificationsRead([id], readAt).catch((error) => {
      console.error("Failed to mark notification read", error);
    });
  }

  function markAllRead() {
    const now = new Date().toISOString();
    const ids = items.filter((item) => item.readAt === null).map((item) => item.id);
    const next = items.map((item) =>
      item.readAt === null ? { ...item, readAt: now } : item,
    );
    setItems(next);
    void markNotificationsRead(ids, now).catch((error) => {
      console.error("Failed to mark notifications read", error);
    });
  }

  function dismiss(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    void deleteNotification(id).catch((error) => {
      console.error("Failed to delete notification", error);
    });
  }

  function dismissAll() {
    const ids = items.map((item) => item.id);
    if (ids.length === 0) return;
    setItems([]);
    void deleteNotifications(ids).catch((error) => {
      console.error("Failed to delete notifications", error);
      refresh({ silent: true });
    });
  }

  return { items, isLoading, unreadCount, markRead, markAllRead, dismiss, dismissAll };
}
