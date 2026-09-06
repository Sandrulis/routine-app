"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  getUnreadNotificationCountSnapshot,
  subscribeUnreadNotificationCount,
} from "@/app/lib/notification-unread-store";
import {
  resolveActiveHeadIcon,
  setDocumentFavicon,
} from "@/app/lib/site-admin/branding";
import { useNotifications } from "@/app/lib/use-notifications";

function NotificationFaviconActive({
  defaultIcon,
  notificationIcon,
}: {
  defaultIcon: string;
  notificationIcon: string;
}) {
  useNotifications();
  const unreadCount = useSyncExternalStore(
    subscribeUnreadNotificationCount,
    getUnreadNotificationCountSnapshot,
    getUnreadNotificationCountSnapshot,
  );

  useEffect(() => {
    const href = resolveActiveHeadIcon(defaultIcon, notificationIcon, unreadCount > 0);
    setDocumentFavicon(href);
    return () => {
      setDocumentFavicon(defaultIcon);
    };
  }, [defaultIcon, notificationIcon, unreadCount]);

  return null;
}

export function NotificationFavicon({
  defaultIcon,
  notificationIcon,
}: {
  defaultIcon: string;
  notificationIcon: string | null;
}) {
  const { user, isReady } = useAuthSession();
  if (!notificationIcon || !isReady || !user) return null;
  return (
    <NotificationFaviconActive
      defaultIcon={defaultIcon}
      notificationIcon={notificationIcon}
    />
  );
}
