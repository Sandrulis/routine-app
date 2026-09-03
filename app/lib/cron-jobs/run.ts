import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllRows, fetchInChunks } from "@/app/lib/db/fetch-all-rows";
import { recordCronJobRun } from "@/app/lib/cron-jobs/repository";
import type { CronJobKey } from "@/app/lib/cron-jobs/types";
import {
  mapListStatusRow,
  mapWorkTaskStatusRow,
  resolveStatusCatalogs,
  type ListStatus,
  type WorkTaskStatusDef,
} from "@/app/lib/list-statuses";
import { parseIdList, parseStatusGroupMap } from "@/app/lib/lists";
import {
  createNotificationId,
  type AppNotification,
  type NotificationKind,
} from "@/app/lib/notifications";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  CRON_DUE_HOUR,
  CRON_START_HOUR,
  CRON_USER_BATCH_LIMIT,
  resolveTimeZone,
  shiftUtcDate,
  zonedDateHour,
} from "@/app/lib/cron-jobs/timezone";

const FALLBACK_STATUS_GROUP: Record<string, "not_started" | "active" | "closed"> =
  {
    todo: "not_started",
    in_progress: "active",
    done: "closed",
  };

type SubtaskRow = {
  id: string;
  team_id: string;
  list_id: string;
  parent_id: string | null;
  title: string;
  status: string;
  start_date: string | null;
  due_date: string | null;
};

type LayoutRow = {
  id: string;
  hidden_status_ids?: string[] | null;
  status_order?: string[] | null;
  status_group_overrides?: unknown;
  deleted_at?: string | null;
  archived_at?: string | null;
};

type MemberRow = {
  id: string;
  team_id: string;
  user_id: string | null;
  role_id: string | null;
};

export type CronJobRunResult = {
  ok: boolean;
  message: string;
  notifiedCount: number;
  scannedCount: number;
};

function todayUtcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function layoutSource(row: LayoutRow | undefined) {
  if (!row) return null;
  return {
    hiddenStatusIds: parseIdList(row.hidden_status_ids),
    statusOrder: parseIdList(row.status_order),
    statusGroupOverrides: parseStatusGroupMap(row.status_group_overrides),
  };
}

function mapSystemStatus(row: {
  id: string;
  labels: unknown;
  label: string;
  color: string;
  sort_order: number;
  group_key: string;
}): TaskStatusSummary {
  const labels =
    row.labels && typeof row.labels === "object" && !Array.isArray(row.labels)
      ? (row.labels as Record<string, string>)
      : {};
  const groupKey =
    row.group_key === "not_started" ||
    row.group_key === "active" ||
    row.group_key === "closed"
      ? row.group_key
      : "active";
  return {
    id: String(row.id),
    labels,
    label: String(row.label ?? ""),
    color: String(row.color ?? "#71717a"),
    sortOrder: Number(row.sort_order) || 0,
    groupKey,
  };
}

function statusGroupFor(
  statusId: string,
  catalog: TaskStatusSummary[],
): "not_started" | "active" | "closed" {
  const fromCatalog = catalog.find((status) => status.id === statusId)?.groupKey;
  if (
    fromCatalog === "not_started" ||
    fromCatalog === "active" ||
    fromCatalog === "closed"
  ) {
    return fromCatalog;
  }
  return FALLBACK_STATUS_GROUP[statusId] ?? "active";
}

function subtaskHref(task: SubtaskRow): string {
  if (task.parent_id) {
    return `/lists/${task.list_id}/tasks/${task.parent_id}?subtask=${task.id}`;
  }
  return `/lists/${task.list_id}`;
}

export async function executeCronJob(
  jobKey: CronJobKey,
): Promise<CronJobRunResult> {
  if (jobKey === "purge_scheduled_account_deletions") {
    const { executeAccountDeletionPurgeCron } = await import(
      "@/app/lib/account-deletion/purge-cron"
    );
    return executeAccountDeletionPurgeCron();
  }

  const supabase = createAdminClient();
  const today = todayUtcDate();
  const kind: NotificationKind =
    jobKey === "subtask_start_reminder" ? "start" : "due";

  try {
    const result = await runJob(supabase, jobKey, kind, today);
    await recordCronJobRun(supabase, jobKey, {
      ok: result.ok,
      message: result.message,
      notifiedCount: result.notifiedCount,
    });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron job failed.";
    const failed = {
      ok: false,
      message,
      notifiedCount: 0,
      scannedCount: 0,
    };
    try {
      await recordCronJobRun(supabase, jobKey, failed);
    } catch {
      // Keep the original error.
    }
    return failed;
  }
}

async function runJob(
  supabase: SupabaseClient,
  jobKey: CronJobKey,
  kind: NotificationKind,
  today: string,
): Promise<CronJobRunResult> {
  const candidates = (await fetchAllRows((from, to) => {
    let query = supabase
      .from("work_tasks")
      .select(
        "id, team_id, list_id, parent_id, title, status, start_date, due_date",
      )
      .eq("kind", "subtask")
      .is("deleted_at", null)
      .is("archived_at", null);
    if (jobKey === "subtask_start_reminder") {
      query = query
        .not("start_date", "is", null)
        .lte("start_date", shiftUtcDate(today, 1));
    } else {
      query = query
        .gte("due_date", shiftUtcDate(today, -1))
        .lte("due_date", shiftUtcDate(today, 1));
    }
    return query.range(from, to);
  })) as SubtaskRow[];

  if (candidates.length === 0) {
    return {
      ok: true,
      message: "No matching subtasks.",
      notifiedCount: 0,
      scannedCount: 0,
    };
  }

  const listIds = [...new Set(candidates.map((row) => row.list_id))];
  const parentIds = [
    ...new Set(
      candidates
        .map((row) => row.parent_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const [
    systemStatusRows,
    listRows,
    parentRows,
    listStatusRows,
    workTaskStatusRows,
  ] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("task_statuses")
        .select("id, labels, label, color, sort_order, group_key")
        .order("sort_order", { ascending: true })
        .range(from, to),
    ) as Promise<Parameters<typeof mapSystemStatus>[0][]>,
    fetchInChunks(listIds, (chunk) =>
      supabase
        .from("work_lists")
        .select("id, hidden_status_ids, status_order, status_group_overrides")
        .in("id", chunk),
    ) as Promise<LayoutRow[]>,
    fetchInChunks(parentIds, (chunk) =>
      supabase
        .from("work_tasks")
        .select(
          "id, hidden_status_ids, status_order, status_group_overrides, deleted_at, archived_at",
        )
        .in("id", chunk),
    ) as Promise<LayoutRow[]>,
    fetchInChunks(listIds, (chunk) =>
      supabase
        .from("list_statuses")
        .select("id, list_id, label, labels, color, sort_order, group_key")
        .in("list_id", chunk),
    ),
    parentIds.length > 0
      ? (fetchInChunks(parentIds, (chunk) =>
          supabase
            .from("work_task_statuses")
            .select(
              "id, parent_task_id, list_id, label, labels, color, sort_order, group_key",
            )
            .in("parent_task_id", chunk),
        ) as Promise<Parameters<typeof mapWorkTaskStatusRow>[0][]>)
      : Promise.resolve([]),
  ]);

  const systemStatuses = systemStatusRows.map(mapSystemStatus);
  const listsById = new Map(listRows.map((row) => [row.id, row]));
  const parentsById = new Map(parentRows.map((row) => [row.id, row]));
  const listStatuses = listStatusRows.map(mapListStatusRow) as ListStatus[];
  const workTaskStatuses = workTaskStatusRows.map(
    mapWorkTaskStatusRow,
  ) as WorkTaskStatusDef[];

  const catalogCache = new Map<string, TaskStatusSummary[]>();
  function catalogFor(listId: string, parentId: string | null): TaskStatusSummary[] {
    const cacheKey = `${listId}:${parentId ?? ""}`;
    const cached = catalogCache.get(cacheKey);
    if (cached) return cached;
    const { visible } = resolveStatusCatalogs(systemStatuses, listStatuses, {
      listId,
      parentTaskId: parentId,
      workTaskStatuses,
      list: layoutSource(listsById.get(listId)),
      parentTask: parentId ? layoutSource(parentsById.get(parentId)) : null,
    });
    catalogCache.set(cacheKey, visible);
    return visible;
  }

  const matching = candidates.filter((task) => {
    if (task.parent_id) {
      const parent = parentsById.get(task.parent_id);
      if (!parent || parent.deleted_at || parent.archived_at) return false;
    }
    const group = statusGroupFor(
      task.status,
      catalogFor(task.list_id, task.parent_id),
    );
    if (jobKey === "subtask_start_reminder") return group === "not_started";
    return group !== "closed";
  });

  if (matching.length === 0) {
    return {
      ok: true,
      message: "No subtasks needed a reminder.",
      notifiedCount: 0,
      scannedCount: candidates.length,
    };
  }

  const taskIds = matching.map((task) => task.id);
  const [assigneeRows, roleAssigneeRows, dutyAssigneeRows] = await Promise.all([
    fetchInChunks(taskIds, (chunk) =>
      supabase
        .from("task_assignees")
        .select("task_id, member_id")
        .in("task_id", chunk),
    ) as Promise<{ task_id: string; member_id: string }[]>,
    fetchInChunks(taskIds, (chunk) =>
      supabase
        .from("task_assignee_roles")
        .select("task_id, role_id")
        .in("task_id", chunk),
    ) as Promise<{ task_id: string; role_id: string }[]>,
    fetchInChunks(taskIds, (chunk) =>
      supabase
        .from("task_assignee_duties")
        .select("task_id, duty_id")
        .in("task_id", chunk),
    ) as Promise<{ task_id: string; duty_id: string }[]>,
  ]);

  const memberIdsByTask = new Map<string, Set<string>>();
  const roleIdsByTask = new Map<string, Set<string>>();
  const dutyIdsByTask = new Map<string, Set<string>>();
  for (const row of assigneeRows) {
    const set = memberIdsByTask.get(row.task_id) ?? new Set<string>();
    set.add(row.member_id);
    memberIdsByTask.set(row.task_id, set);
  }
  for (const row of roleAssigneeRows) {
    const set = roleIdsByTask.get(row.task_id) ?? new Set<string>();
    set.add(row.role_id);
    roleIdsByTask.set(row.task_id, set);
  }
  for (const row of dutyAssigneeRows) {
    const set = dutyIdsByTask.get(row.task_id) ?? new Set<string>();
    set.add(row.duty_id);
    dutyIdsByTask.set(row.task_id, set);
  }

  const teamIds = [...new Set(matching.map((task) => task.team_id))];
  const members = (await fetchInChunks(teamIds, (chunk) =>
    supabase
      .from("team_members")
      .select("id, team_id, user_id, role_id")
      .in("team_id", chunk),
  )) as MemberRow[];
  const memberIds = members.map((member) => member.id);
  const memberDutyRows = memberIds.length
    ? ((await fetchInChunks(memberIds, (chunk) =>
        supabase
          .from("team_member_duties")
          .select("member_id, duty_id")
          .in("member_id", chunk),
      )) as { member_id: string; duty_id: string }[])
    : [];
  const dutyIdsByMember = new Map<string, string[]>();
  for (const row of memberDutyRows) {
    const list = dutyIdsByMember.get(row.member_id) ?? [];
    list.push(row.duty_id);
    dutyIdsByMember.set(row.member_id, list);
  }
  const membersById = new Map(members.map((member) => [member.id, member]));
  const membersByTeamRole = new Map<string, MemberRow[]>();
  for (const member of members) {
    if (!member.role_id) continue;
    const key = `${member.team_id}:${member.role_id}`;
    const list = membersByTeamRole.get(key) ?? [];
    list.push(member);
    membersByTeamRole.set(key, list);
  }
  const membersByTeamDuty = new Map<string, MemberRow[]>();
  for (const member of members) {
    for (const dutyId of dutyIdsByMember.get(member.id) ?? []) {
      const key = `${member.team_id}:${dutyId}`;
      const list = membersByTeamDuty.get(key) ?? [];
      list.push(member);
      membersByTeamDuty.set(key, list);
    }
  }

  const recipientsByTask = new Map<string, MemberRow[]>();
  for (const task of matching) {
    const recipientIds = new Set(memberIdsByTask.get(task.id) ?? []);
    for (const roleId of roleIdsByTask.get(task.id) ?? []) {
      for (const member of membersByTeamRole.get(`${task.team_id}:${roleId}`) ?? []) {
        recipientIds.add(member.id);
      }
    }
    for (const dutyId of dutyIdsByTask.get(task.id) ?? []) {
      for (const member of membersByTeamDuty.get(`${task.team_id}:${dutyId}`) ?? []) {
        recipientIds.add(member.id);
      }
    }
    const recipients = [...recipientIds]
      .map((id) => membersById.get(id))
      .filter((member): member is MemberRow => Boolean(member?.user_id));
    if (recipients.length > 0) recipientsByTask.set(task.id, recipients);
  }

  const userIds = [
    ...new Set(
      [...recipientsByTask.values()].flatMap((rows) =>
        rows.map((row) => row.user_id).filter((id): id is string => Boolean(id)),
      ),
    ),
  ];
  const [preferenceRows, userRows, settingsRow] = await Promise.all([
    fetchInChunks(userIds, (chunk) =>
      supabase
        .from("user_notification_preferences")
        .select("user_id, kind, enabled")
        .eq("kind", kind)
        .in("user_id", chunk),
    ) as Promise<{ user_id: string; enabled: boolean }[]>,
    fetchInChunks(userIds, (chunk) =>
      supabase.from("users").select("id, timezone").in("id", chunk),
    ) as Promise<{ id: string; timezone: string | null }[]>,
    supabase
      .from("site_settings")
      .select("timezone")
      .eq("id", 1)
      .maybeSingle()
      .then((result) => result.data as { timezone?: string | null } | null),
  ]);
  const preferenceDisabled = new Set(
    preferenceRows.filter((row) => row.enabled === false).map((row) => row.user_id),
  );
  const siteTimeZone = resolveTimeZone(settingsRow?.timezone);
  const timeZoneByUser = new Map(
    userRows.map((row) => [row.id, resolveTimeZone(row.timezone || siteTimeZone)]),
  );

  const hrefs = [...new Set(matching.map(subtaskHref))];
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const existing = (await fetchInChunks(hrefs, (chunk) =>
    supabase
      .from("app_notifications")
      .select("recipient_id, href, created_at")
      .eq("kind", kind)
      .in("href", chunk)
      .gte("created_at", since),
  )) as {
    recipient_id: string | null;
    href: string | null;
    created_at: string | null;
  }[];
  const existingByRecipientHref = new Map<string, string[]>();
  for (const row of existing) {
    const key = `${row.recipient_id ?? ""}:${row.href ?? ""}`;
    const list = existingByRecipientHref.get(key) ?? [];
    if (row.created_at) list.push(row.created_at);
    existingByRecipientHref.set(key, list);
  }

  const now = new Date();
  const createdAt = now.toISOString();
  const minHour =
    jobKey === "subtask_start_reminder" ? CRON_START_HOUR : CRON_DUE_HOUR;
  type PendingItem = { teamId: string; userId: string; item: AppNotification };
  const pending: PendingItem[] = [];

  for (const task of matching) {
    const href = subtaskHref(task);
    const title = task.title.trim();
    if (!title) continue;
    for (const member of recipientsByTask.get(task.id) ?? []) {
      if (!member.user_id || preferenceDisabled.has(member.user_id)) continue;
      const timeZone = timeZoneByUser.get(member.user_id) || siteTimeZone;
      const local = zonedDateHour(now, timeZone);
      if (local.hour < minHour) continue;
      if (jobKey === "subtask_start_reminder") {
        if (!task.start_date || task.start_date > local.date) continue;
      } else if (task.due_date !== local.date) {
        continue;
      }
      const dedupeKey = `${member.id}:${href}`;
      const alreadyToday = (existingByRecipientHref.get(dedupeKey) ?? []).some(
        (created) => zonedDateHour(new Date(created), timeZone).date === local.date,
      );
      if (alreadyToday) continue;
      pending.push({
        teamId: task.team_id,
        userId: member.user_id,
        item: {
          id: createNotificationId(),
          kind,
          actorId: null,
          recipientId: member.id,
          targetUserId: member.user_id,
          invitationId: null,
          taskTitle: title,
          href,
          createdAt,
          readAt: null,
          teamId: null,
          teamName: null,
        },
      });
    }
  }

  const userIdsSorted = [...new Set(pending.map((row) => row.userId))].sort();
  const batchUserIds = new Set(userIdsSorted.slice(0, CRON_USER_BATCH_LIMIT));
  const batched = pending.filter((row) => batchUserIds.has(row.userId));
  const remainingUsers = Math.max(0, userIdsSorted.length - batchUserIds.size);

  const toInsertByTeam = new Map<string, AppNotification[]>();
  for (const row of batched) {
    const list = toInsertByTeam.get(row.teamId) ?? [];
    list.push(row.item);
    toInsertByTeam.set(row.teamId, list);
  }

  let notifiedCount = 0;
  for (const [teamId, items] of toInsertByTeam) {
    const { error } = await supabase.from("app_notifications").insert(
      items.map((item) => ({
        id: item.id,
        team_id: teamId,
        kind: item.kind,
        actor_id: item.actorId,
        recipient_id: item.recipientId,
        target_user_id: item.targetUserId,
        invitation_id: item.invitationId,
        task_title: item.taskTitle,
        href: item.href,
        created_at: item.createdAt,
        read_at: item.readAt,
      })),
    );
    if (error) throw error;
    notifiedCount += items.length;
  }

  const { sendCronReminderEmails } = await import(
    "@/app/lib/email/notification-email-sender"
  );
  const emailRows = batched.map((row) => ({
    teamId: row.teamId,
    item: row.item,
  }));
  const emailsSent = await sendCronReminderEmails(supabase, emailRows);

  const remainingNote =
    remainingUsers > 0
      ? ` ${remainingUsers} user(s) left for the next hourly run.`
      : "";
  return {
    ok: true,
    message: `Created ${notifiedCount} notification(s) for ${batchUserIds.size} user(s); sent ${emailsSent} email(s).${remainingNote}`,
    notifiedCount,
    scannedCount: candidates.length,
  };
}
