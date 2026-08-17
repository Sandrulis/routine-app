export type NotificationKind = "assigned" | "comment" | "due" | "file";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actorId: string | null;
  taskTitle: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

export const NOTIFICATIONS_STORAGE_KEY = "routine-app-notifications";
export const NOTIFICATIONS_CHANGE_EVENT = "routine-app-notifications-change";

const NOTIFICATION_KINDS: NotificationKind[] = [
  "assigned",
  "comment",
  "due",
  "file",
];

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

export function createDefaultNotifications(): AppNotification[] {
  return [
    {
      id: "notif-assigned",
      kind: "assigned",
      actorId: "janis",
      taskTitle: "Pārbaudīt palaišanas soļus",
      href: "/lists/list-projects/tasks/task-website",
      createdAt: isoMinutesAgo(18),
      readAt: null,
    },
    {
      id: "notif-comment",
      kind: "comment",
      actorId: "marta",
      taskTitle: "Sagatavot foto materiālu",
      href: "/lists/list-projects/tasks/task-website",
      createdAt: isoMinutesAgo(125),
      readAt: null,
    },
    {
      id: "notif-due",
      kind: "due",
      actorId: null,
      taskTitle: "Iekšējā dokumentācija",
      href: "/lists/list-projects/tasks/task-docs",
      createdAt: isoMinutesAgo(60 * 26),
      readAt: null,
    },
    {
      id: "notif-file",
      kind: "file",
      actorId: "kristaps",
      taskTitle: "Mājas lapa",
      href: "/lists/list-projects/tasks/task-website",
      createdAt: isoMinutesAgo(60 * 26 * 3),
      readAt: isoMinutesAgo(60 * 20),
    },
  ];
}

function isNotificationKind(value: unknown): value is NotificationKind {
  return (
    typeof value === "string" &&
    NOTIFICATION_KINDS.includes(value as NotificationKind)
  );
}

export function normalizeStoredNotifications(
  value: unknown,
): AppNotification[] | null {
  if (!Array.isArray(value)) return null;

  const items = value
    .map((item) => {
      if (
        typeof item !== "object" ||
        item === null ||
        !("id" in item) ||
        !("kind" in item) ||
        !("taskTitle" in item) ||
        !("createdAt" in item)
      ) {
        return null;
      }

      const id = String(item.id);
      const kind = isNotificationKind(item.kind) ? item.kind : null;
      const taskTitle = String(item.taskTitle).trim();
      const createdAt = String(item.createdAt);
      if (!id || !kind || !taskTitle || !createdAt) return null;

      const actorId =
        "actorId" in item && typeof item.actorId === "string" && item.actorId
          ? item.actorId
          : null;
      const href =
        "href" in item && typeof item.href === "string" && item.href
          ? item.href
          : null;
      const readAt =
        "readAt" in item && typeof item.readAt === "string" && item.readAt
          ? item.readAt
          : null;

      return { id, kind, actorId, taskTitle, href, createdAt, readAt };
    })
    .filter((item): item is AppNotification => item !== null);

  return items;
}

export function unreadNotificationCount(items: AppNotification[]): number {
  return items.filter((item) => item.readAt === null).length;
}

export function persistNotifications(items: AppNotification[]) {
  window.localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
}

export function readStoredNotifications(): AppNotification[] {
  try {
    const storedValue = window.localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!storedValue) {
      const seed = createDefaultNotifications();
      persistNotifications(seed);
      return seed;
    }
    return (
      normalizeStoredNotifications(JSON.parse(storedValue)) ??
      createDefaultNotifications()
    );
  } catch {
    return createDefaultNotifications();
  }
}
