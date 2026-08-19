import type { TaskUpdatePatch } from "@/app/lib/build-task-activity-events";
import { memberIdsNotifiedForAssignees } from "@/app/lib/assignees";
import type { WorkTask } from "@/app/lib/lists";
import {
  createNotificationId,
  notificationsForNewAssignees,
  type AppNotification,
  type NotificationKind,
} from "@/app/lib/notifications";
import { sameIds, type TaskActivity } from "@/app/lib/task-activity";
import type { TeamMember } from "@/app/lib/team";

const TASK_UPDATED_ACTIVITY_KINDS = new Set<TaskActivity["kind"]>([
  "title",
  "description",
  "start_date",
  "due_date",
  "checklist",
  "moved",
  "hidden",
  "restored",
  "reordered",
  "created",
]);

export function expandAssigneeIdsToMemberIds(
  assigneeIds: string[],
  members: TeamMember[],
): string[] {
  return memberIdsNotifiedForAssignees(assigneeIds, members);
}

export function resolveTaskStakeholderMemberIds(
  task: WorkTask,
  tasks: WorkTask[],
  members: TeamMember[],
): string[] {
  const ids = new Set<string>();
  for (const memberId of expandAssigneeIdsToMemberIds(task.assigneeIds, members)) {
    ids.add(memberId);
  }
  if (task.parentId) {
    const parent = tasks.find((item) => item.id === task.parentId);
    if (parent) {
      for (const memberId of expandAssigneeIdsToMemberIds(
        parent.assigneeIds,
        members,
      )) {
        ids.add(memberId);
      }
    }
  }
  return [...ids];
}

export function taskNotificationHref(task: WorkTask, tasks: WorkTask[]): string {
  if (task.kind === "subtask" && task.parentId) {
    return `/lists/${task.listId}/tasks/${task.parentId}`;
  }
  if (task.kind === "task") {
    return `/lists/${task.listId}/tasks/${task.id}`;
  }
  const parentId = task.parentId;
  if (parentId) {
    const parent = tasks.find((item) => item.id === parentId);
    if (parent?.kind === "task") {
      return `/lists/${task.listId}/tasks/${parent.id}`;
    }
  }
  return `/lists/${task.listId}`;
}

function createStakeholderNotification(input: {
  kind: NotificationKind;
  actorId: string;
  recipientId: string;
  taskTitle: string;
  href: string;
}): AppNotification {
  const now = new Date().toISOString();
  return {
    id: createNotificationId(),
    kind: input.kind,
    actorId: input.actorId,
    recipientId: input.recipientId,
    targetUserId: null,
    invitationId: null,
    taskTitle: input.taskTitle.trim(),
    href: input.href,
    createdAt: now,
    readAt: null,
  };
}

function notifyStakeholders(input: {
  kind: NotificationKind;
  actorId: string;
  stakeholderIds: string[];
  taskTitle: string;
  href: string;
  extraRecipientIds?: string[];
}): AppNotification[] {
  const title = input.taskTitle.trim();
  if (!title) return [];

  const recipients = new Set([
    ...input.stakeholderIds,
    ...(input.extraRecipientIds ?? []),
  ]);
  recipients.delete(input.actorId);

  return [...recipients].map((recipientId) =>
    createStakeholderNotification({
      kind: input.kind,
      actorId: input.actorId,
      recipientId,
      taskTitle: title,
      href: input.href,
    }),
  );
}

export function notificationsForRemovedAssignees(input: {
  actorId: string;
  removedIds: string[];
  members: TeamMember[];
  taskTitle: string;
  href: string;
}): AppNotification[] {
  const memberIds = memberIdsNotifiedForAssignees(input.removedIds, input.members);
  return notifyStakeholders({
    kind: "unassigned",
    actorId: input.actorId,
    stakeholderIds: [],
    taskTitle: input.taskTitle,
    href: input.href,
    extraRecipientIds: memberIds,
  });
}

export function notificationsFromTaskActivities(input: {
  actorId: string;
  task: WorkTask;
  tasks: WorkTask[];
  members: TeamMember[];
  activities: TaskActivity[];
}): AppNotification[] {
  const stakeholders = resolveTaskStakeholderMemberIds(
    input.task,
    input.tasks,
    input.members,
  );
  const href = taskNotificationHref(input.task, input.tasks);
  const title = input.task.title;
  const notifications: AppNotification[] = [];
  const seen = new Set<string>();

  function push(kind: NotificationKind) {
    if (seen.has(kind)) return;
    seen.add(kind);
    notifications.push(
      ...notifyStakeholders({
        kind,
        actorId: input.actorId,
        stakeholderIds: stakeholders,
        taskTitle: title,
        href,
      }),
    );
  }

  for (const activity of input.activities) {
    if (activity.kind === "status") {
      push("status_changed");
      continue;
    }
    if (TASK_UPDATED_ACTIVITY_KINDS.has(activity.kind)) {
      push("task_updated");
    }
  }

  return notifications;
}

export function notificationsForTaskComment(input: {
  actorId: string;
  task: WorkTask;
  tasks: WorkTask[];
  members: TeamMember[];
}): AppNotification[] {
  return notifyStakeholders({
    kind: "comment",
    actorId: input.actorId,
    stakeholderIds: resolveTaskStakeholderMemberIds(
      input.task,
      input.tasks,
      input.members,
    ),
    taskTitle: input.task.title,
    href: taskNotificationHref(input.task, input.tasks),
  });
}

export function notificationsForTaskFile(input: {
  actorId: string;
  task: WorkTask;
  tasks: WorkTask[];
  members: TeamMember[];
}): AppNotification[] {
  return notifyStakeholders({
    kind: "file",
    actorId: input.actorId,
    stakeholderIds: resolveTaskStakeholderMemberIds(
      input.task,
      input.tasks,
      input.members,
    ),
    taskTitle: input.task.title,
    href: taskNotificationHref(input.task, input.tasks),
  });
}

export function notificationsForInitialAssignees(input: {
  actorId: string;
  assigneeIds: string[];
  memberIds: Iterable<string>;
  members: TeamMember[];
  task: WorkTask;
  tasks: WorkTask[];
}): AppNotification[] {
  if (input.assigneeIds.length === 0) return [];
  const addedIds = memberIdsNotifiedForAssignees(
    input.assigneeIds,
    input.members,
  );
  const parentId =
    input.task.kind === "subtask" && input.task.parentId
      ? input.task.parentId
      : input.task.id;
  return notificationsForNewAssignees({
    actorId: input.actorId,
    addedIds,
    memberIds: input.memberIds,
    taskTitle: input.task.title,
    href: `/lists/${input.task.listId}/tasks/${parentId}`,
  });
}

export function notificationsForNewSubtask(input: {
  actorId: string;
  task: WorkTask;
  tasks: WorkTask[];
  members: TeamMember[];
  memberIds: Iterable<string>;
}): AppNotification[] {
  if (input.task.kind !== "subtask" || !input.task.parentId) return [];
  const parent = input.tasks.find((item) => item.id === input.task.parentId);
  if (!parent) return [];
  const notifications = notifyStakeholders({
    kind: "task_updated",
    actorId: input.actorId,
    stakeholderIds: resolveTaskStakeholderMemberIds(
      parent,
      input.tasks,
      input.members,
    ),
    taskTitle: input.task.title,
    href: taskNotificationHref(input.task, input.tasks),
  });
  notifications.push(
    ...notificationsForInitialAssignees({
      actorId: input.actorId,
      assigneeIds: input.task.assigneeIds,
      memberIds: input.memberIds,
      members: input.members,
      task: input.task,
      tasks: input.tasks,
    }),
  );
  return dedupeNotifications(notifications);
}

function dedupeNotifications(items: AppNotification[]): AppNotification[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.kind}:${item.recipientId ?? ""}:${item.taskTitle}:${item.href ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildTaskUpdateNotifications(input: {
  actorId: string;
  existing: WorkTask;
  patch: TaskUpdatePatch;
  tasks: WorkTask[];
  members: TeamMember[];
  activities: TaskActivity[];
}): AppNotification[] {
  const href = taskNotificationHref(input.existing, input.tasks);
  const title = input.patch.title ?? input.existing.title;
  const notifications: AppNotification[] = [];

  if (
    input.patch.assigneeIds &&
    !sameIds(input.existing.assigneeIds, input.patch.assigneeIds)
  ) {
    const removed = input.existing.assigneeIds.filter(
      (id) => !input.patch.assigneeIds!.includes(id),
    );
    if (removed.length > 0) {
      notifications.push(
        ...notificationsForRemovedAssignees({
          actorId: input.actorId,
          removedIds: removed,
          members: input.members,
          taskTitle: title,
          href,
        }),
      );
    }
  }

  notifications.push(
    ...notificationsFromTaskActivities({
      actorId: input.actorId,
      task: input.existing,
      tasks: input.tasks,
      members: input.members,
      activities: input.activities,
    }),
  );

  return notifications;
}
