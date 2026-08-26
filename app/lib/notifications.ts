import { isLegacyDemoMemberId } from "@/app/lib/clear-legacy-demo-storage";

export type NotificationKind =
  | "assigned"
  | "unassigned"
  | "comment"
  | "due"
  | "start"
  | "file"
  | "status_changed"
  | "task_updated"
  | "team_invite"
  | "team_invite_rejected"
  | "seat_open"
  | "billing_due";

export type AppNotification = {
  id: string;
  kind: NotificationKind;
  actorId: string | null;
  recipientId: string | null;
  targetUserId: string | null;
  invitationId: string | null;
  taskTitle: string;
  href: string | null;
  createdAt: string;
  readAt: string | null;
};

export const NOTIFICATIONS_STORAGE_KEY = "routine-app-notifications";
export const NOTIFICATIONS_CHANGE_EVENT = "routine-app-notifications-change";

const NOTIFICATION_KINDS: NotificationKind[] = [
  "assigned",
  "unassigned",
  "comment",
  "due",
  "start",
  "file",
  "status_changed",
  "task_updated",
  "team_invite",
  "team_invite_rejected",
  "seat_open",
  "billing_due",
];

export function createNotificationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `notif-${crypto.randomUUID()}`;
  }
  return `notif-${Date.now()}`;
}

export function notificationsForNewAssignees(input: {
  actorId: string;
  addedIds: string[];
  memberIds: Iterable<string>;
  taskTitle: string;
  href: string;
}): AppNotification[] {
  const title = input.taskTitle.trim();
  if (!title) return [];

  const members = new Set(input.memberIds);
  const now = new Date().toISOString();

  return input.addedIds
    .filter((id) => id && id !== input.actorId && members.has(id))
    .map((recipientId) => ({
      id: createNotificationId(),
      kind: "assigned" as const,
      actorId: input.actorId,
      recipientId,
      targetUserId: null,
      invitationId: null,
      taskTitle: title,
      href: input.href,
      createdAt: now,
      readAt: null,
    }));
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
      const recipientId =
        "recipientId" in item &&
        typeof item.recipientId === "string" &&
        item.recipientId
          ? item.recipientId
          : null;
      const targetUserId =
        "targetUserId" in item &&
        typeof item.targetUserId === "string" &&
        item.targetUserId
          ? item.targetUserId
          : null;
      const invitationId =
        "invitationId" in item &&
        typeof item.invitationId === "string" &&
        item.invitationId
          ? item.invitationId
          : null;
      if (isLegacyDemoMemberId(actorId) || isLegacyDemoMemberId(recipientId)) {
        return null;
      }
      const href =
        "href" in item && typeof item.href === "string" && item.href
          ? item.href
          : null;
      const readAt =
        "readAt" in item && typeof item.readAt === "string" && item.readAt
          ? item.readAt
          : null;

      return {
        id,
        kind,
        actorId,
        recipientId,
        targetUserId,
        invitationId,
        taskTitle,
        href,
        createdAt,
        readAt,
      };
    })
    .filter((item): item is AppNotification => item !== null);

  return items;
}

export function unreadNotificationCount(items: AppNotification[]): number {
  return items.filter((item) => item.readAt === null).length;
}

export async function readStoredNotifications(
  userId: string | null = null,
  teamId: string | null = null,
): Promise<AppNotification[]> {
  if (!userId) return [];
  const { fetchVisibleNotifications } = await import("@/app/lib/db/work-data");
  return fetchVisibleNotifications(teamId, userId);
}

export async function appendNotifications(
  extra: AppNotification[],
  userId: string | null,
  teamId: string | null,
  members: { id: string; userId?: string | null }[] = [],
) {
  if (extra.length === 0) return;
  if (!teamId || (userId && !teamId)) return;

  const memberById = new Map(members.map((member) => [member.id, member]));
  const targetUserIds = new Set<string>();
  for (const item of extra) {
    if (item.targetUserId) targetUserIds.add(item.targetUserId);
    const member = item.recipientId
      ? memberById.get(item.recipientId)
      : undefined;
    if (member?.userId) targetUserIds.add(member.userId);
  }

  const { fetchNotificationPreferencesForUsers, insertNotifications } =
    await import("@/app/lib/db/work-data");
  const { isNotificationKindEnabled } = await import(
    "@/app/lib/notification-preferences"
  );

  const prefsByUser =
    targetUserIds.size > 0
      ? await fetchNotificationPreferencesForUsers([...targetUserIds])
      : new Map();

  const filtered = extra.filter((item) => {
    const userKey = item.targetUserId
      ? item.targetUserId
      : item.recipientId
        ? memberById.get(item.recipientId)?.userId
        : null;
    if (!userKey) return true;
    return isNotificationKindEnabled(prefsByUser.get(userKey), item.kind);
  });

  if (filtered.length === 0) return;
  await insertNotifications(teamId, filtered);
  const { sendNotificationEmailsAction } = await import(
    "@/app/lib/email/notification-emails"
  );
  void sendNotificationEmailsAction({ teamId, items: filtered });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
  }
}
