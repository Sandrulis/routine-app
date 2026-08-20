"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  deleteNotification,
  fetchVisibleNotifications,
  markNotificationsRead,
  purgeOldNotificationsOnce,
} from "@/app/lib/db/work-data";
import {
  NOTIFICATIONS_CHANGE_EVENT,
  unreadNotificationCount,
  type AppNotification,
} from "@/app/lib/notifications";
import { useTeam } from "@/app/lib/team-store";

export function useNotifications() {
  const { user: authUser, isReady: authReady } = useAuthSession();
  const { isReady: teamReady, currentTeam } = useTeam();
  const userId = authUser?.id ?? null;
  const teamId = currentTeam?.id ?? null;
  const [items, setItems] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback((options?: { silent?: boolean }) => {
    if (!authReady || !teamReady) return;
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    if (!options?.silent) setIsLoading(true);
    void purgeOldNotificationsOnce(30).catch(() => undefined);
    void fetchVisibleNotifications(teamId, userId)
      .then(setItems)
      .catch((error) => {
        console.error("Failed to load notifications", error);
        setItems([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [authReady, teamId, teamReady, userId]);

  useEffect(() => {
    if (!authReady) return;
    if (!teamReady) {
      setIsLoading(true);
      return;
    }
    refresh();
    function handleChange() {
      refresh({ silent: true });
    }
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, handleChange);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, handleChange);
    };
  }, [authReady, refresh, teamReady]);

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

  return { items, isLoading, unreadCount, markRead, markAllRead, dismiss };
}
