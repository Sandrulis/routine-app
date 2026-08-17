"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  NOTIFICATIONS_CHANGE_EVENT,
  persistNotifications,
  readStoredNotifications,
  unreadNotificationCount,
  type AppNotification,
} from "@/app/lib/notifications";

export function useNotifications() {
  const [items, setItems] = useState<AppNotification[]>([]);

  const refresh = useCallback(() => {
    setItems(readStoredNotifications());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(NOTIFICATIONS_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  const unreadCount = useMemo(() => unreadNotificationCount(items), [items]);

  function markRead(id: string) {
    const next = items.map((item) =>
      item.id === id && item.readAt === null
        ? { ...item, readAt: new Date().toISOString() }
        : item,
    );
    persistNotifications(next);
    setItems(next);
  }

  function markAllRead() {
    const now = new Date().toISOString();
    const next = items.map((item) =>
      item.readAt === null ? { ...item, readAt: now } : item,
    );
    persistNotifications(next);
    setItems(next);
  }

  return { items, unreadCount, markRead, markAllRead };
}
