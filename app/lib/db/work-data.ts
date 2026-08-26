import { createClient } from "@/app/lib/supabase/client";
import type { AppNotification } from "@/app/lib/notifications";
import type { ListFile } from "@/app/lib/list-files";
import type { WorkList, WorkTask } from "@/app/lib/lists";
import type { WorkTemplate, WorkTemplateItem } from "@/app/lib/templates";
import { parseTemplateTaskStatuses } from "@/app/lib/templates";
import { parseTaskChecklists } from "@/app/lib/task-checklists";
import { sortTemplateItemsForInsert } from "@/app/lib/templates";
import {
  DEFAULT_LIST_ACCESS_LEVEL,
  parseListAccessLevel,
  type ListAccessLevel,
} from "@/app/lib/list-access";
import { memberInitials, type MembersByTeam, type RolesByTeam, type TeamMember, type TeamRole, type WorkTeam } from "@/app/lib/team";
import { normalizeTeamPermissionSet } from "@/app/lib/team-permissions";
import type { TaskActivity, TaskFile } from "@/app/lib/task-activity";
import { isTodoStatus, type TodoItem } from "@/app/lib/team-todo";
import {
  isListStatusGroup,
  mapListStatusRow,
  mapWorkTaskStatusRow,
  normalizeStatusColor,
  normalizeStatusLabels,
  parseStatusGroupOverrides,
  parseTeamStatusLabels,
  primaryStatusLabel,
  type ListStatus,
  type WorkTaskStatusDef,
} from "@/app/lib/list-statuses";
import {
  mapListAutomationRow,
  serializeConfig,
  type ListAutomation,
} from "@/app/lib/list-automations";
import { fetchAllRows, fetchInChunks } from "@/app/lib/db/fetch-all-rows";

function db() {
  return createClient();
}

function dateOrNull(value: string | null | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

const assigneeReplaceByTask = new Map<string, Promise<void>>();

async function replaceTaskAssignees(taskId: string, assigneeIds: string[]) {
  const previous = assigneeReplaceByTask.get(taskId) ?? Promise.resolve();
  const next = previous.catch(() => undefined).then(() =>
    replaceTaskAssigneesNow(taskId, assigneeIds),
  );
  assigneeReplaceByTask.set(taskId, next);
  try {
    await next;
  } finally {
    if (assigneeReplaceByTask.get(taskId) === next) {
      assigneeReplaceByTask.delete(taskId);
    }
  }
}

async function replaceTaskAssigneesNow(taskId: string, assigneeIds: string[]) {
  const uniqueIds = [...new Set(assigneeIds.filter((id) => id.trim()))];
  const { error } = await db().rpc("set_task_assignees", {
    p_task_id: taskId,
    p_ids: uniqueIds,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export function formatSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);
  const e = error as {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
  };
  const parts = [e.message, e.code, e.details, e.hint].filter(
    (part): part is string => Boolean(part && String(part).trim()),
  );
  return parts.join(" | ") || String(error);
}

/** PostgREST PGRST303: token `iat` is slightly ahead of the API clock. */
export function isJwtClockSkewError(error: unknown): boolean {
  const message = formatSupabaseError(error).toLowerCase();
  return (
    message.includes("pgrst303") ||
    message.includes("issued at future")
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function withJwtClockSkewRetry<T>(run: () => Promise<T>): Promise<T> {
  const delaysMs = [0, 400, 1000, 2000];
  let lastError: unknown;
  for (const delayMs of delaysMs) {
    if (delayMs > 0) await sleep(delayMs);
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isJwtClockSkewError(error)) throw error;
    }
  }
  throw lastError;
}

export function isUnauthenticatedDbError(error: unknown): boolean {
  if (isJwtClockSkewError(error)) return false;
  const message = formatSupabaseError(error).toLowerCase();
  return (
    message.includes("permission denied") ||
    message.includes("42501") ||
    message.includes("jwt") ||
    message.includes("not authenticated") ||
    message.includes("invalid claim") ||
    message.includes("pgrst301")
  );
}

export function teamToRow(team: WorkTeam, createdBy: string) {
  return {
    id: team.id,
    name: team.name,
    initials: team.initials,
    icon: team.icon,
    color: team.color,
    logo_url: team.logoUrl,
    created_by: createdBy,
  };
}

export function memberToRow(teamId: string, member: TeamMember) {
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const userId =
    member.userId || (uuidRe.test(member.id) ? member.id : null);
  return {
    id: member.id,
    team_id: teamId,
    user_id: userId,
    email: member.email,
    name: member.name,
    role: member.role,
    role_id: member.roleId,
    tone_class_name: member.toneClassName,
    avatar_url: member.avatarUrl ?? null,
    last_online_at: member.lastOnlineAt,
    seat_status: member.seatStatus === "pending_payment" ? "pending_payment" : "active",
  };
}

function teamFromRow(row: {
  id: string;
  name: string;
  initials: string;
  icon: string | null;
  color: string;
  logo_url: string | null;
  payment_plan_id?: string | null;
  payment_plan_until?: string | null;
  payment_plan_paid?: boolean | null;
  payment_plan_is_trial?: boolean | null;
  payment_plan_is_early_bird?: boolean | null;
  paid_seat_count?: number | null;
  billing_cycle_end?: string | null;
}): WorkTeam {
  const paidSeatCount = Number(row.paid_seat_count);
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    icon: row.icon,
    color: row.color,
    logoUrl: row.logo_url,
    paymentPlan: {
      planId:
        typeof row.payment_plan_id === "string" && row.payment_plan_id.trim()
          ? row.payment_plan_id
          : null,
      until:
        typeof row.payment_plan_until === "string" && row.payment_plan_until.trim()
          ? row.payment_plan_until.slice(0, 10)
          : null,
      paid: row.payment_plan_paid === true,
      isTrial: row.payment_plan_is_trial === true,
      isEarlyBird: row.payment_plan_is_early_bird === true,
    },
    paidSeatCount: Number.isFinite(paidSeatCount) ? Math.max(0, Math.trunc(paidSeatCount)) : 0,
    billingCycleEnd:
      typeof row.billing_cycle_end === "string" && row.billing_cycle_end.trim()
        ? row.billing_cycle_end.slice(0, 10)
        : null,
  };
}

function memberFromRow(row: {
  id: string;
  user_id: string | null;
  email: string;
  name: string;
  role: string;
  role_id: string | null;
  tone_class_name: string;
  avatar_url: string | null;
  last_online_at: string | null;
  seat_status?: string | null;
}): TeamMember {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleId: row.role_id,
    initials: memberInitials({ name: row.name, email: row.email }),
    toneClassName: row.tone_class_name,
    lastOnlineAt: row.last_online_at,
    avatarUrl: row.avatar_url,
    seatStatus: row.seat_status === "pending_payment" ? "pending_payment" : "active",
  };
}

export async function fetchUserTeams(): Promise<{
  teams: WorkTeam[];
  membersByTeam: MembersByTeam;
  rolesByTeam: RolesByTeam;
}> {
  return withJwtClockSkewRetry(async () => {
  const supabase = db();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { teams: [], membersByTeam: {}, rolesByTeam: {} };
  }

  const { data: membershipRows, error: membershipError } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", user.id);
  if (membershipError) throw membershipError;

  const teamIds = [
    ...new Set(
      (membershipRows ?? []).flatMap((row: { team_id?: string | null }) => {
        const id = String(row.team_id || "").trim();
        return id ? [id] : [];
      }),
    ),
  ] as string[];
  if (teamIds.length === 0) {
    return { teams: [], membersByTeam: {}, rolesByTeam: {} };
  }

  const [teamRows, memberRows, roleRows] = await Promise.all([
    fetchInChunks(teamIds, (chunk) =>
      supabase
        .from("teams")
        .select(
          "id, name, initials, icon, color, logo_url, created_at, payment_plan_id, payment_plan_until, payment_plan_paid, payment_plan_is_trial, payment_plan_is_early_bird, paid_seat_count, billing_cycle_end",
        )
        .in("id", chunk)
        .order("created_at", { ascending: true }),
    ),
    fetchInChunks(teamIds, (chunk) =>
      supabase
        .from("team_members")
        .select(
          "id, team_id, user_id, email, name, role, role_id, tone_class_name, avatar_url, last_online_at, seat_status",
        )
        .in("team_id", chunk),
    ),
    fetchInChunks(teamIds, (chunk) =>
      supabase
        .from("team_roles")
        .select("id, team_id, slug, name, sort_order, is_system, permissions")
        .in("team_id", chunk)
        .order("sort_order", { ascending: true }),
    ),
  ]);

  teamRows.sort((left, right) => {
    const leftAt = String(left.created_at ?? "");
    const rightAt = String(right.created_at ?? "");
    return leftAt.localeCompare(rightAt) || String(left.id).localeCompare(String(right.id));
  });

  const membersByTeam: MembersByTeam = {};
  for (const row of memberRows ?? []) {
    const list = membersByTeam[row.team_id] ?? [];
    list.push(memberFromRow(row));
    membersByTeam[row.team_id] = list;
  }

  const rolesByTeam: RolesByTeam = {};
  for (const row of roleRows ?? []) {
    const list = rolesByTeam[row.team_id] ?? [];
    list.push(roleFromRow(row));
    rolesByTeam[row.team_id] = list;
  }

  return {
    teams: (teamRows ?? []).map(teamFromRow),
    membersByTeam,
    rolesByTeam,
  };
  });
}

function roleFromRow(row: {
  id: string;
  team_id: string;
  slug: string;
  name: string;
  sort_order: number;
  is_system: boolean;
  permissions: unknown;
}): TeamRole {
  return {
    id: row.id,
    teamId: row.team_id,
    slug: row.slug,
    name: row.name,
    sortOrder: row.sort_order,
    isSystem: row.is_system,
    permissions: normalizeTeamPermissionSet(row.permissions),
  };
}

export async function insertTeamRole(role: TeamRole) {
  const { error } = await db().from("team_roles").insert({
    id: role.id,
    team_id: role.teamId,
    slug: role.slug,
    name: role.name,
    sort_order: role.sortOrder,
    is_system: role.isSystem,
    permissions: role.permissions,
  });
  if (error) {
    console.error("insertTeamRole failed:", error.message, error.code);
    throw error;
  }
}

export async function updateTeamRoleRow(
  roleId: string,
  patch: Partial<Pick<TeamRole, "name" | "slug" | "sortOrder" | "permissions">>,
) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.permissions !== undefined) row.permissions = patch.permissions;
  if (Object.keys(row).length === 0) return;
  const { error } = await db().from("team_roles").update(row).eq("id", roleId);
  if (error) throw error;
}

export async function reorderTeamRoleRows(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const { error } = await db().rpc("update_team_role_sort_orders", {
    p_ids: orderedIds,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteTeamRoleRow(roleId: string) {
  const { error } = await db().from("team_roles").delete().eq("id", roleId);
  if (error) throw error;
}

export async function updateMemberRoleRow(memberId: string, roleId: string) {
  const { error } = await db()
    .from("team_members")
    .update({ role_id: roleId })
    .eq("id", memberId);
  if (error) throw error;
}

export async function insertTeam(
  team: WorkTeam,
  owner: TeamMember,
  createdBy: string,
) {
  const supabase = db();
  const { error: teamError } = await supabase
    .from("teams")
    .insert(teamToRow(team, createdBy));
  if (teamError) throw new Error(formatSupabaseError(teamError));
  const { error: memberError } = await supabase
    .from("team_members")
    .insert(memberToRow(team.id, owner));
  if (memberError) {
    await supabase.from("teams").delete().eq("id", team.id);
    throw new Error(formatSupabaseError(memberError));
  }
}

export async function updateTeamRow(team: WorkTeam) {
  const { error } = await db()
    .from("teams")
    .update({
      name: team.name,
      initials: team.initials,
      icon: team.icon,
      color: team.color,
      logo_url: team.logoUrl,
    })
    .eq("id", team.id);
  if (error) throw error;
}

export async function deleteTeamRow(teamId: string) {
  const { error } = await db().from("teams").delete().eq("id", teamId);
  if (error) throw error;
}

export async function insertMember(teamId: string, member: TeamMember) {
  const { error } = await db().from("team_members").insert(memberToRow(teamId, member));
  if (error) throw error;
}

export async function touchMemberOnline(
  teamId: string,
  userId: string,
  at: string,
): Promise<void> {
  const supabase = db();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session || session.user.id !== userId) return;

  const { error } = await supabase.rpc("touch_current_member_online", {
    p_team_id: teamId,
    p_seen_at: at,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export type TeamWorkspace = {
  lists: WorkList[];
  tasks: WorkTask[];
  taskFiles: TaskFile[];
  listFiles: ListFile[];
  listStatuses: ListStatus[];
  workTaskStatuses: WorkTaskStatusDef[];
  listAutomations: ListAutomation[];
  teamStatusLabels: Record<string, string>;
};

function mapActivityRow(row: {
  id: string;
  task_id: string;
  actor_id: string;
  kind: TaskActivity["kind"];
  from_status?: string | null;
  to_status?: string | null;
  assignee_ids?: string[] | null;
  from_assignee_ids?: string[] | null;
  date_value?: string | null;
  from_date_value?: string | null;
  text?: string | null;
  previous_text?: string | null;
  file_name?: string | null;
  from_parent_id?: string | null;
  to_parent_id?: string | null;
  metadata?: unknown;
  created_at: string;
}): TaskActivity {
  return {
    id: row.id,
    taskId: row.task_id,
    actorId: row.actor_id,
    kind: row.kind,
    at: row.created_at,
    fromStatus: (row.from_status ?? undefined) as TaskActivity["fromStatus"],
    toStatus: (row.to_status ?? undefined) as TaskActivity["toStatus"],
    assigneeIds: row.assignee_ids ?? undefined,
    fromAssigneeIds: row.from_assignee_ids ?? undefined,
    dateValue: row.date_value,
    fromDateValue: row.from_date_value,
    text: row.text ?? undefined,
    previousText: row.previous_text ?? undefined,
    fileName: row.file_name ?? undefined,
    fromParentId: row.from_parent_id ?? undefined,
    toParentId: row.to_parent_id ?? undefined,
    metadata:
      row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : undefined,
  };
}

export async function fetchTaskActivities(
  taskId: string,
  limit = 80,
  before?: string,
): Promise<TaskActivity[]> {
  let query = db()
    .from("task_activities")
    .select(
      "id, task_id, actor_id, kind, from_status, to_status, assignee_ids, from_assignee_ids, date_value, from_date_value, text, previous_text, file_name, from_parent_id, to_parent_id, metadata, created_at",
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (before) query = query.lt("created_at", before);
  const { data, error } = await query;
  if (error) throw new Error(formatSupabaseError(error));
  return ((data ?? []) as Parameters<typeof mapActivityRow>[0][]).map(mapActivityRow);
}

export async function fetchTaskDetails(taskId: string): Promise<{
  description: string;
  checklists: ReturnType<typeof parseTaskChecklists>;
} | null> {
  const { data, error } = await db()
    .from("work_tasks")
    .select("description, checklists")
    .eq("id", taskId)
    .maybeSingle();
  if (error) throw new Error(formatSupabaseError(error));
  if (!data) return null;
  const row = data as { description?: string | null; checklists?: unknown };
  return {
    description: row.description ?? "",
    checklists: parseTaskChecklists(row.checklists),
  };
}

export async function fetchTeamWorkspace(teamId: string): Promise<TeamWorkspace> {
  return withJwtClockSkewRetry(async () => {
  const supabase = db();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) {
    throw new Error(
      "Not authenticated. Sign out and sign in again, then reload the page.",
    );
  }

  const [
    lists,
    tasks,
    taskFileRows,
    listFileRows,
    listStatuses,
    workTaskStatuses,
    listAutomations,
    teamStatusLabelRows,
  ] = await Promise.all([
    fetchAllRows((from, to) =>
      supabase
        .from("work_lists")
        .select("id, name, description, icon, color, kind, sort_order, is_private, created_by, default_access_level, hidden_status_ids, status_order, status_group_overrides")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("work_tasks")
        .select(
          "id, list_id, parent_id, kind, title, status, status_changed_at, deleted_at, archived_at, start_date, due_date, sort_order, hidden_status_ids, status_order, status_group_overrides, created_at",
        )
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("task_files")
        .select("id, task_id, name, mime_type, size, has_content, google_drive_file_id, created_at")
        .eq("team_id", teamId)
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("list_files")
        .select(
          "id, list_id, parent_id, name, mime_type, size, has_content, google_drive_file_id, sort_order, created_at",
        )
        .eq("team_id", teamId)
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("list_statuses")
        .select("id, list_id, label, labels, color, sort_order, group_key")
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("work_task_statuses")
        .select(
          "id, parent_task_id, list_id, label, labels, color, sort_order, group_key",
        )
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("work_list_automations")
        .select(
          "id, list_id, trigger_kind, action_kind, template_id, config, enabled, sort_order",
        )
        .eq("team_id", teamId)
        .order("sort_order", { ascending: true })
        .range(from, to),
    ),
    fetchAllRows((from, to) =>
      supabase
        .from("team_status_labels")
        .select("status_id, label")
        .eq("team_id", teamId)
        .range(from, to),
    ),
  ]);

  const taskIds = tasks.map((row) => row.id);
  const [assigneeRows, assigneeRoleRows] = await Promise.all([
    fetchInChunks(taskIds, (chunk) =>
      supabase.from("task_assignees").select("task_id, member_id").in("task_id", chunk),
    ),
    fetchInChunks(taskIds, (chunk) =>
      supabase.from("task_assignee_roles").select("task_id, role_id").in("task_id", chunk),
    ),
  ]);

  const assigneesByTask = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assigneesByTask.get(row.task_id) ?? [];
    list.push(row.member_id);
    assigneesByTask.set(row.task_id, list);
  }
  for (const row of assigneeRoleRows) {
    const list = assigneesByTask.get(row.task_id) ?? [];
    list.push(row.role_id);
    assigneesByTask.set(row.task_id, list);
  }

  const taskFiles: TaskFile[] = taskFileRows.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    name: row.name,
    mimeType: row.mime_type,
    size: Number(row.size) || 0,
    hasContent: Boolean(row.has_content),
    googleDriveFileId: row.google_drive_file_id
      ? String(row.google_drive_file_id)
      : null,
    createdAt: row.created_at,
  }));

  const listFiles: ListFile[] = listFileRows.map((row) => ({
    id: row.id,
    listId: row.list_id,
    parentId: row.parent_id,
    name: row.name,
    mimeType: row.mime_type,
    size: Number(row.size) || 0,
    hasContent: Boolean(row.has_content),
    googleDriveFileId: row.google_drive_file_id
      ? String(row.google_drive_file_id)
      : null,
    createdAt: row.created_at,
    sortOrder: row.sort_order,
  }));

  const listIds = lists.map((row) => row.id);
  const viewersByList = new Map<string, Record<string, ListAccessLevel>>();
  const viewerRolesByList = new Map<string, Record<string, ListAccessLevel>>();
  const [viewerRows, viewerRoleRows] = await Promise.all([
    fetchInChunks(listIds, (chunk) =>
      supabase
        .from("work_list_viewers")
        .select("list_id, user_id, access_level")
        .in("list_id", chunk),
    ),
    fetchInChunks(listIds, (chunk) =>
      supabase
        .from("work_list_viewer_roles")
        .select("list_id, role_id, access_level")
        .in("list_id", chunk),
    ),
  ]);
  for (const row of viewerRows) {
    const list = viewersByList.get(row.list_id) ?? {};
    list[row.user_id] = parseListAccessLevel(row.access_level);
    viewersByList.set(row.list_id, list);
  }
  for (const row of viewerRoleRows) {
    const list = viewerRolesByList.get(row.list_id) ?? {};
    list[row.role_id] = parseListAccessLevel(row.access_level);
    viewerRolesByList.set(row.list_id, list);
  }

  return {
    lists: lists.map((row) => {
      const viewerUserAccess = viewersByList.get(row.id) ?? {};
      const viewerRoleAccess = viewerRolesByList.get(row.id) ?? {};
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        color: row.color,
        sortOrder: row.sort_order ?? 0,
        kind: row.kind,
        isPrivate: row.is_private === true,
        createdBy: row.created_by ?? null,
        defaultAccessLevel: parseListAccessLevel(
          row.default_access_level,
          DEFAULT_LIST_ACCESS_LEVEL,
        ),
        viewerUserIds: Object.keys(viewerUserAccess),
        viewerRoleIds: Object.keys(viewerRoleAccess),
        viewerUserAccess,
        viewerRoleAccess,
        hiddenStatusIds: Array.isArray(row.hidden_status_ids)
          ? row.hidden_status_ids.filter(
              (id: unknown): id is string =>
                typeof id === "string" && id.trim().length > 0,
            )
          : [],
        statusOrder: Array.isArray(row.status_order)
          ? row.status_order.filter(
              (id: unknown): id is string =>
                typeof id === "string" && id.trim().length > 0,
            )
          : [],
        statusGroupOverrides: parseStatusGroupOverrides(row.status_group_overrides),
      };
    }),
    tasks: tasks.map((row) => ({
      id: row.id,
      listId: row.list_id,
      parentId: row.parent_id,
      kind: row.kind,
      title: row.title,
      description: "",
      status: row.status,
      statusChangedAt: row.status_changed_at ?? null,
      deletedAt: row.deleted_at ?? null,
      archivedAt: row.archived_at ?? null,
      createdAt: row.created_at ?? null,
      assigneeIds: assigneesByTask.get(row.id) ?? [],
      startDate: row.start_date,
      dueDate: row.due_date,
      sortOrder: row.sort_order,
      checklists: [],
      hiddenStatusIds: Array.isArray(row.hidden_status_ids)
        ? row.hidden_status_ids.filter(
            (id: unknown): id is string => typeof id === "string" && id.trim().length > 0,
          )
        : [],
      statusOrder: Array.isArray(row.status_order)
        ? row.status_order.filter(
            (id: unknown): id is string => typeof id === "string" && id.trim().length > 0,
          )
        : [],
      statusGroupOverrides: parseStatusGroupOverrides(row.status_group_overrides),
    })),
    taskFiles,
    listFiles,
    listStatuses: listStatuses.map(mapListStatusRow),
    workTaskStatuses: workTaskStatuses.map(mapWorkTaskStatusRow),
    listAutomations: listAutomations.map(mapListAutomationRow),
    teamStatusLabels: parseTeamStatusLabels(teamStatusLabelRows),
  };
  });
}

export async function insertList(
  teamId: string,
  list: WorkList,
  options?: {
    createdBy?: string | null;
    viewerUserIds?: string[];
    viewerRoleIds?: string[];
    viewerUserAccess?: Record<string, ListAccessLevel>;
    viewerRoleAccess?: Record<string, ListAccessLevel>;
  },
) {
  const supabase = db();
  const { error } = await supabase.from("work_lists").insert({
    id: list.id,
    team_id: teamId,
    name: list.name,
    description: list.description,
    icon: list.icon,
    color: list.color,
    sort_order: list.sortOrder,
    kind: list.kind,
    is_private: list.isPrivate,
    created_by: options?.createdBy ?? list.createdBy ?? null,
    default_access_level: list.defaultAccessLevel,
    hidden_status_ids: list.hiddenStatusIds ?? [],
    status_order: list.statusOrder ?? [],
    status_group_overrides: list.statusGroupOverrides ?? {},
  });
  if (error) throw error;

  const createdBy = options?.createdBy ?? list.createdBy ?? null;
  const userAccess = options?.viewerUserAccess ?? list.viewerUserAccess;
  const roleAccess = options?.viewerRoleAccess ?? list.viewerRoleAccess;
  await replaceListAccessRows(list.id, createdBy, userAccess, roleAccess);
}

async function replaceListAccessRows(
  listId: string,
  createdBy: string | null,
  userAccess: Record<string, ListAccessLevel>,
  roleAccess: Record<string, ListAccessLevel>,
) {
  const supabase = db();
  const { error: deleteUsersError } = await supabase
    .from("work_list_viewers")
    .delete()
    .eq("list_id", listId);
  if (deleteUsersError) throw deleteUsersError;
  const { error: deleteRolesError } = await supabase
    .from("work_list_viewer_roles")
    .delete()
    .eq("list_id", listId);
  if (deleteRolesError) throw deleteRolesError;

  const userRows = Object.entries(userAccess)
    .filter(([userId]) => userId && userId !== createdBy)
    .map(([userId, accessLevel]) => ({
      list_id: listId,
      user_id: userId,
      access_level: accessLevel,
    }));
  if (userRows.length > 0) {
    const { error: viewerError } = await supabase.from("work_list_viewers").insert(userRows);
    if (viewerError) throw viewerError;
  }

  const roleRows = Object.entries(roleAccess)
    .filter(([, level]) => Boolean(level))
    .map(([roleId, accessLevel]) => ({
      list_id: listId,
      role_id: roleId,
      access_level: accessLevel,
    }));
  if (roleRows.length > 0) {
    const { error: roleError } = await supabase.from("work_list_viewer_roles").insert(roleRows);
    if (roleError) throw roleError;
  }
}

export async function updateListRow(
  listId: string,
  patch: Partial<
    Pick<
      WorkList,
      | "name"
      | "description"
      | "icon"
      | "color"
      | "sortOrder"
      | "isPrivate"
      | "defaultAccessLevel"
      | "viewerUserIds"
      | "viewerRoleIds"
      | "viewerUserAccess"
      | "viewerRoleAccess"
      | "hiddenStatusIds"
      | "statusOrder"
      | "statusGroupOverrides"
    >
  > & { createdBy?: string | null },
) {
  const supabase = db();
  const rowPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.description !== undefined) rowPatch.description = patch.description;
  if (patch.icon !== undefined) rowPatch.icon = patch.icon;
  if (patch.color !== undefined) rowPatch.color = patch.color;
  if (patch.sortOrder !== undefined) rowPatch.sort_order = patch.sortOrder;
  if (patch.isPrivate !== undefined) rowPatch.is_private = patch.isPrivate;
  if (patch.defaultAccessLevel !== undefined) {
    rowPatch.default_access_level = patch.defaultAccessLevel;
  }
  if (patch.hiddenStatusIds !== undefined) {
    rowPatch.hidden_status_ids = patch.hiddenStatusIds;
  }
  if (patch.statusOrder !== undefined) {
    rowPatch.status_order = patch.statusOrder;
  }
  if (patch.statusGroupOverrides !== undefined) {
    rowPatch.status_group_overrides = patch.statusGroupOverrides;
  }

  if (Object.keys(rowPatch).length > 0) {
    const { error } = await supabase.from("work_lists").update(rowPatch).eq("id", listId);
    if (error) throw error;
  }

  if (
    patch.viewerUserAccess !== undefined ||
    patch.viewerRoleAccess !== undefined ||
    patch.viewerUserIds !== undefined ||
    patch.viewerRoleIds !== undefined ||
    patch.isPrivate !== undefined
  ) {
    const userAccess = patch.viewerUserAccess ?? {};
    const roleAccess = patch.viewerRoleAccess ?? {};
    await replaceListAccessRows(
      listId,
      patch.createdBy ?? null,
      userAccess,
      roleAccess,
    );
  }
}

export async function deleteListRow(listId: string) {
  const { error } = await db().from("work_lists").delete().eq("id", listId);
  if (error) throw error;
}

export async function insertTask(teamId: string, task: WorkTask) {
  const supabase = db();
  const { error } = await supabase.from("work_tasks").insert({
    id: task.id,
    team_id: teamId,
    list_id: task.listId,
    parent_id: task.parentId,
    kind: task.kind,
    title: task.title,
    description: task.description,
    status: task.status,
    status_changed_at: task.statusChangedAt,
    deleted_at: task.deletedAt,
    archived_at: task.archivedAt,
    start_date: dateOrNull(task.startDate),
    due_date: dateOrNull(task.dueDate),
    sort_order: task.sortOrder,
    checklists: task.checklists ?? [],
    hidden_status_ids: task.hiddenStatusIds ?? [],
    status_order: task.statusOrder ?? [],
    status_group_overrides: task.statusGroupOverrides ?? {},
    created_at: task.createdAt ?? undefined,
  });
  if (error) throw new Error(formatSupabaseError(error));
  await replaceTaskAssignees(task.id, task.assigneeIds);
}

export async function updateTaskRow(
  taskId: string,
  patch: Partial<
    Pick<
      WorkTask,
      | "title"
      | "description"
      | "status"
      | "statusChangedAt"
      | "deletedAt"
      | "archivedAt"
      | "assigneeIds"
      | "startDate"
      | "dueDate"
      | "parentId"
      | "sortOrder"
      | "checklists"
      | "hiddenStatusIds"
      | "statusOrder"
      | "statusGroupOverrides"
    >
  >,
) {
  const supabase = db();
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.statusChangedAt !== undefined) {
    row.status_changed_at = patch.statusChangedAt;
  }
  if (patch.deletedAt !== undefined) {
    row.deleted_at = patch.deletedAt;
  }
  if (patch.archivedAt !== undefined) {
    row.archived_at = patch.archivedAt;
  }
  if (patch.startDate !== undefined) row.start_date = dateOrNull(patch.startDate);
  if (patch.dueDate !== undefined) row.due_date = dateOrNull(patch.dueDate);
  if (patch.parentId !== undefined) row.parent_id = patch.parentId;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.checklists !== undefined) row.checklists = patch.checklists;
  if (patch.hiddenStatusIds !== undefined) {
    row.hidden_status_ids = patch.hiddenStatusIds;
  }
  if (patch.statusOrder !== undefined) row.status_order = patch.statusOrder;
  if (patch.statusGroupOverrides !== undefined) {
    row.status_group_overrides = patch.statusGroupOverrides;
  }
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("work_tasks").update(row).eq("id", taskId);
    if (error) throw new Error(formatSupabaseError(error));
  }
  if (patch.assigneeIds) {
    await replaceTaskAssignees(taskId, patch.assigneeIds);
  }
}

export async function updateTasksArchivedAt(
  taskIds: string[],
  archivedAt: string | null,
) {
  if (taskIds.length === 0) return;
  const { error } = await db()
    .from("work_tasks")
    .update({ archived_at: archivedAt })
    .in("id", taskIds);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteTaskRow(taskId: string) {
  const { error } = await db().from("work_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function updateTaskSortOrders(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const { error } = await db().rpc("update_task_sort_orders", {
    p_ids: orderedIds,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function updateListSortOrders(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const { error } = await db().rpc("update_list_sort_orders", {
    p_ids: orderedIds,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function updateTasksStatus(
  taskIds: string[],
  status: WorkTask["status"],
  statusChangedAt: string,
) {
  if (taskIds.length === 0) return;
  const { error } = await db().rpc("update_tasks_status", {
    p_ids: taskIds,
    p_status: status,
    p_changed_at: statusChangedAt,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function insertActivity(teamId: string, activity: TaskActivity) {
  const { error } = await db().from("task_activities").insert({
    id: activity.id,
    team_id: teamId,
    task_id: activity.taskId,
    actor_id: activity.actorId,
    kind: activity.kind,
    from_status: activity.fromStatus ?? null,
    to_status: activity.toStatus ?? null,
    assignee_ids: activity.assigneeIds ?? [],
    from_assignee_ids: activity.fromAssigneeIds ?? [],
    date_value: dateOrNull(activity.dateValue ?? null),
    from_date_value: dateOrNull(activity.fromDateValue ?? null),
    text: activity.text ?? null,
    previous_text: activity.previousText ?? null,
    file_name: activity.fileName ?? null,
    from_parent_id: activity.fromParentId ?? null,
    to_parent_id: activity.toParentId ?? null,
    metadata: activity.metadata ?? null,
    created_at: activity.at,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function insertTaskFile(
  teamId: string,
  file: TaskFile,
  content: string | null,
) {
  const { error } = await db().from("task_files").insert({
    id: file.id,
    team_id: teamId,
    task_id: file.taskId,
    name: file.name,
    mime_type: file.mimeType,
    size: Math.max(0, Math.round(Number(file.size) || 0)),
    content,
    google_drive_file_id: file.googleDriveFileId,
    has_content: Boolean(content),
    created_at: file.createdAt,
  });
  if (error) throw error;
}

export async function updateTaskFileName(fileId: string, name: string, mimeType: string) {
  const { error } = await db()
    .from("task_files")
    .update({ name, mime_type: mimeType })
    .eq("id", fileId);
  if (error) throw error;
}

export async function deleteTaskFileRow(fileId: string) {
  const { error } = await db().from("task_files").delete().eq("id", fileId);
  if (error) throw error;
}

export async function insertListFile(
  teamId: string,
  file: ListFile,
  content: string | null,
) {
  const { error } = await db().from("list_files").insert({
    id: file.id,
    team_id: teamId,
    list_id: file.listId,
    parent_id: file.parentId,
    name: file.name,
    mime_type: file.mimeType,
    size: Math.max(0, Math.round(Number(file.size) || 0)),
    content,
    google_drive_file_id: file.googleDriveFileId,
    has_content: Boolean(content),
    sort_order: file.sortOrder,
    created_at: file.createdAt,
  });
  if (error) throw error;
}

export async function updateListFileName(fileId: string, name: string, mimeType: string) {
  const { error } = await db()
    .from("list_files")
    .update({ name, mime_type: mimeType })
    .eq("id", fileId);
  if (error) throw error;
}

export async function updateListFileRow(
  fileId: string,
  patch: { parentId?: string | null; sortOrder?: number },
) {
  const row: Record<string, unknown> = {};
  if (patch.parentId !== undefined) row.parent_id = patch.parentId;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (Object.keys(row).length === 0) return;
  const { error } = await db().from("list_files").update(row).eq("id", fileId);
  if (error) throw error;
}

export async function deleteListFileRow(fileId: string) {
  const { error } = await db().from("list_files").delete().eq("id", fileId);
  if (error) throw error;
}

export async function deleteListFilesForList(listId: string) {
  const { error } = await db().from("list_files").delete().eq("list_id", listId);
  if (error) throw error;
}

export async function deleteListFilesForParents(parentIds: string[]) {
  if (parentIds.length === 0) return;
  const { error } = await db()
    .from("list_files")
    .delete()
    .in("parent_id", parentIds);
  if (error) throw error;
}

export async function fetchListFileContent(fileId: string): Promise<string | null> {
  const { data, error } = await db()
    .from("list_files")
    .select("content")
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

export async function fetchTaskFileContent(fileId: string): Promise<string | null> {
  const { data, error } = await db()
    .from("task_files")
    .select("content")
    .eq("id", fileId)
    .maybeSingle();
  if (error) throw error;
  return data?.content ?? null;
}

export async function insertNotifications(teamId: string, items: AppNotification[]) {
  if (items.length === 0) return;
  const { error } = await db().from("app_notifications").insert(
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
}

export async function markNotificationsRead(ids: string[], readAt: string) {
  if (ids.length === 0) return;
  const { error } = await db()
    .from("app_notifications")
    .update({ read_at: readAt })
    .in("id", ids);
  if (error) throw error;
}

export async function deleteNotification(id: string) {
  const { error } = await db()
    .from("app_notifications")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function deleteOldNotifications(olderThanDays: number = 30) {
  const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString();
  const { error } = await db()
    .from("app_notifications")
    .delete()
    .lt("created_at", cutoff);
  if (error) throw error;
}

let oldNotificationsPurged = false;

export async function purgeOldNotificationsOnce(olderThanDays: number = 30) {
  if (oldNotificationsPurged) return;
  oldNotificationsPurged = true;
  await deleteOldNotifications(olderThanDays);
}

export async function replaceTeamTodos(teamId: string, items: TodoItem[]) {
  const supabase = db();
  const { error: delError } = await supabase.from("team_todos").delete().eq("team_id", teamId);
  if (delError) throw delError;
  if (items.length === 0) return;
  const { error } = await supabase.from("team_todos").insert(
    items.map((item) => ({
      id: item.id,
      team_id: teamId,
      title: item.title,
      description: item.description,
      status: item.status,
      assignee_id: item.assigneeId,
      due_date: dateOrNull(item.dueDate),
    })),
  );
  if (error) throw error;
}

export async function fetchAppNotifications(teamId: string): Promise<AppNotification[]> {
  const { data, error } = await db()
    .from("app_notifications")
    .select(
      "id, kind, actor_id, recipient_id, target_user_id, invitation_id, task_title, href, created_at, read_at",
    )
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapNotificationRow);
}

function mapNotificationRow(row: {
  id: string;
  kind: AppNotification["kind"];
  actor_id: string | null;
  recipient_id: string | null;
  target_user_id?: string | null;
  invitation_id?: string | null;
  task_title: string;
  href: string | null;
  created_at: string;
  read_at: string | null;
}): AppNotification {
  return {
    id: row.id,
    kind: row.kind,
    actorId: row.actor_id,
    recipientId: row.recipient_id,
    targetUserId: row.target_user_id ?? null,
    invitationId: row.invitation_id ?? null,
    taskTitle: row.task_title,
    href: row.href,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}

export async function fetchVisibleNotifications(
  teamId: string | null,
  userId: string,
): Promise<AppNotification[]> {
  let selfMemberId: string | null = null;
  if (teamId) {
    const { data: selfRow } = await db()
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();
    selfMemberId = selfRow?.id ?? null;
  }

  const filters = [`target_user_id.eq.${userId}`];
  if (selfMemberId) {
    filters.push(`recipient_id.eq.${selfMemberId}`);
  }

  const { data, error } = await db()
    .from("app_notifications")
    .select(
      "id, kind, actor_id, recipient_id, target_user_id, invitation_id, task_title, href, created_at, read_at, team_id",
    )
    .or(filters.join(","))
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as Parameters<typeof mapNotificationRow>[0][])
    .map(mapNotificationRow)
    .filter((item: AppNotification) => {
      if (item.kind === "team_invite") {
        return item.targetUserId === userId;
      }
      if (item.kind === "team_invite_rejected") {
        return selfMemberId !== null && item.recipientId === selfMemberId;
      }
      if (!teamId || selfMemberId === null) {
        return item.targetUserId === userId;
      }
      return item.recipientId === selfMemberId || item.targetUserId === userId;
    });
}

export async function fetchUserNotificationPreferences(userId: string) {
  const { mergeNotificationPreferences } = await import(
    "@/app/lib/notification-preferences"
  );
  const { data, error } = await db()
    .from("user_notification_preferences")
    .select("kind, enabled")
    .eq("user_id", userId);
  if (error) throw error;
  const partial: Partial<Record<string, boolean>> = {};
  for (const row of data ?? []) {
    partial[row.kind] = row.enabled;
  }
  return mergeNotificationPreferences(partial);
}

export async function fetchNotificationPreferencesForUsers(userIds: string[]) {
  const { mergeNotificationPreferences } = await import(
    "@/app/lib/notification-preferences"
  );
  const map = new Map<string, ReturnType<typeof mergeNotificationPreferences>>();
  if (userIds.length === 0) return map;

  const { data, error } = await db()
    .from("user_notification_preferences")
    .select("user_id, kind, enabled")
    .in("user_id", userIds);
  if (error) throw error;

  const partialByUser = new Map<string, Partial<Record<string, boolean>>>();
  for (const row of data ?? []) {
    const current = partialByUser.get(row.user_id) ?? {};
    current[row.kind] = row.enabled;
    partialByUser.set(row.user_id, current);
  }

  for (const userId of userIds) {
    map.set(userId, mergeNotificationPreferences(partialByUser.get(userId) ?? {}));
  }
  return map;
}

export async function upsertUserNotificationPreferences(
  userId: string,
  preferences: Record<string, boolean>,
) {
  const rows = Object.entries(preferences).map(([kind, enabled]) => ({
    user_id: userId,
    kind,
    enabled,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return;
  const { error } = await db()
    .from("user_notification_preferences")
    .upsert(rows, { onConflict: "user_id,kind" });
  if (error) throw error;
}

export async function fetchTeamTodos(teamId: string): Promise<TodoItem[]> {
  const { data, error } = await db()
    .from("team_todos")
    .select("id, title, description, status, assignee_id, due_date")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    assignee_id: string | null;
    due_date: string | null;
  }>).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: isTodoStatus(row.status) ? row.status : "todo",
    assigneeId: row.assignee_id,
    dueDate: row.due_date,
  }));
}

export function sortTasksForInsert(tasks: WorkTask[]): WorkTask[] {
  const remaining = [...tasks];
  const done = new Set<string>();
  const ordered: WorkTask[] = [];
  while (remaining.length > 0) {
    const ready = remaining.filter((task) => !task.parentId || done.has(task.parentId));
    if (ready.length === 0) {
      ordered.push(...remaining);
      break;
    }
    for (const task of ready) {
      ordered.push(task);
      done.add(task.id);
    }
    remaining.splice(
      0,
      remaining.length,
      ...remaining.filter((task) => !done.has(task.id)),
    );
  }
  return ordered;
}

export async function insertListStatus(teamId: string, status: ListStatus) {
  const supabase = db();
  const label = status.label.trim();
  const { error } = await supabase.from("list_statuses").insert({
    id: status.id,
    list_id: status.listId,
    team_id: teamId,
    label,
    labels: {},
    color: normalizeStatusColor(status.color),
    sort_order: status.sortOrder,
    group_key: status.groupKey,
  });
  if (error) throw error;
}

export async function updateListStatusRow(
  statusId: string,
  patch: Partial<Pick<ListStatus, "labels" | "label" | "color" | "groupKey" | "sortOrder">>,
) {
  const supabase = db();
  const next: Record<string, unknown> = {};
  if (patch.label !== undefined) {
    next.label = patch.label.trim();
    next.labels = {};
  } else if (patch.labels) {
    const labels = normalizeStatusLabels(patch.labels);
    next.labels = labels;
    next.label = primaryStatusLabel(labels, "");
  }
  if (patch.color !== undefined) next.color = normalizeStatusColor(patch.color);
  if (patch.groupKey !== undefined) {
    next.group_key = isListStatusGroup(patch.groupKey) ? patch.groupKey : "active";
  }
  if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder;
  if (Object.keys(next).length === 0) return;
  const { error } = await supabase.from("list_statuses").update(next).eq("id", statusId);
  if (error) throw error;
}

export async function deleteListStatusRow(statusId: string) {
  const { error } = await db().from("list_statuses").delete().eq("id", statusId);
  if (error) throw error;
}

export async function insertWorkTaskStatus(
  teamId: string,
  status: WorkTaskStatusDef,
) {
  const supabase = db();
  const label = status.label.trim();
  const { error } = await supabase.from("work_task_statuses").insert({
    id: status.id,
    parent_task_id: status.parentTaskId,
    list_id: status.listId,
    team_id: teamId,
    label,
    labels: {},
    color: normalizeStatusColor(status.color),
    sort_order: status.sortOrder,
    group_key: status.groupKey,
  });
  if (error) throw error;
}

export async function updateWorkTaskStatusRow(
  statusId: string,
  patch: Partial<
    Pick<WorkTaskStatusDef, "labels" | "label" | "color" | "groupKey" | "sortOrder">
  >,
) {
  const supabase = db();
  const next: Record<string, unknown> = {};
  if (patch.label !== undefined) {
    next.label = patch.label.trim();
    next.labels = {};
  } else if (patch.labels) {
    const labels = normalizeStatusLabels(patch.labels);
    next.labels = labels;
    next.label = primaryStatusLabel(labels, "");
  }
  if (patch.color !== undefined) next.color = normalizeStatusColor(patch.color);
  if (patch.groupKey !== undefined) {
    next.group_key = isListStatusGroup(patch.groupKey) ? patch.groupKey : "active";
  }
  if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder;
  if (Object.keys(next).length === 0) return;
  const { error } = await supabase
    .from("work_task_statuses")
    .update(next)
    .eq("id", statusId);
  if (error) throw error;
}

export async function deleteWorkTaskStatusRow(statusId: string) {
  const { error } = await db().from("work_task_statuses").delete().eq("id", statusId);
  if (error) throw error;
}

export async function updateWorkTaskStatusSortOrders(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const { error } = await db().rpc("update_work_task_status_sort_orders", {
    p_ids: orderedIds,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function insertListAutomation(teamId: string, automation: ListAutomation) {
  const supabase = db();
  const { error } = await supabase.from("work_list_automations").insert({
    id: automation.id,
    list_id: automation.listId,
    team_id: teamId,
    trigger_kind: automation.triggerKind,
    action_kind: automation.actionKind,
    template_id: automation.templateId,
    config: serializeConfig(automation.config),
    enabled: automation.enabled,
    sort_order: automation.sortOrder,
  });
  if (error) throw error;
}

export async function updateListAutomationRow(
  automationId: string,
  patch: Partial<Pick<ListAutomation, "templateId" | "enabled" | "sortOrder" | "config">>,
) {
  const supabase = db();
  const next: Record<string, unknown> = {};
  if (patch.templateId !== undefined) next.template_id = patch.templateId;
  if (patch.enabled !== undefined) next.enabled = patch.enabled;
  if (patch.sortOrder !== undefined) next.sort_order = patch.sortOrder;
  if (patch.config !== undefined) next.config = serializeConfig(patch.config);
  if (Object.keys(next).length === 0) return;
  const { error } = await supabase
    .from("work_list_automations")
    .update(next)
    .eq("id", automationId);
  if (error) throw error;
}

export async function deleteListAutomationRow(automationId: string) {
  const { error } = await db()
    .from("work_list_automations")
    .delete()
    .eq("id", automationId);
  if (error) throw error;
}

export async function updateListStatusSortOrders(orderedIds: string[]) {
  if (orderedIds.length === 0) return;
  const { error } = await db().rpc("update_list_status_sort_orders", {
    p_ids: orderedIds,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function upsertTeamStatusLabel(
  teamId: string,
  statusId: string,
  label: string,
) {
  const trimmed = label.trim();
  if (!trimmed) {
    await deleteTeamStatusLabel(teamId, statusId);
    return;
  }
  const { error } = await db().from("team_status_labels").upsert(
    {
      team_id: teamId,
      status_id: statusId,
      label: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_id,status_id" },
  );
  if (error) throw error;
}

export async function deleteTeamStatusLabel(teamId: string, statusId: string) {
  const { error } = await db()
    .from("team_status_labels")
    .delete()
    .eq("team_id", teamId)
    .eq("status_id", statusId);
  if (error) throw error;
}

function templateFromRow(row: {
  id: string;
  team_id: string;
  name: string;
  description: string;
  sort_order: number;
  created_at: string;
}): WorkTemplate {
  return {
    id: row.id,
    teamId: row.team_id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function templateItemFromRow(row: {
  id: string;
  template_id: string;
  parent_id: string | null;
  kind: string;
  title: string;
  description: string;
  sort_order: number;
  assignee_ids?: string[] | null;
  checklists?: unknown;
  task_statuses?: unknown;
  hidden_status_ids?: string[] | null;
  status_order?: string[] | null;
  status_group_overrides?: unknown;
}): WorkTemplateItem {
  return {
    id: row.id,
    templateId: row.template_id,
    parentId: row.parent_id,
    kind:
      row.kind === "subtask"
        ? "subtask"
        : row.kind === "folder"
          ? "folder"
          : "task",
    title: row.title,
    description: row.description,
    sortOrder: row.sort_order,
    assigneeIds: row.assignee_ids ?? [],
    checklists: parseTaskChecklists(row.checklists),
    taskStatuses:
      row.kind === "task" ? parseTemplateTaskStatuses(row.task_statuses) : [],
    hiddenStatusIds:
      row.kind === "task" && Array.isArray(row.hidden_status_ids)
        ? row.hidden_status_ids.filter(
            (id: unknown): id is string => typeof id === "string" && id.trim().length > 0,
          )
        : [],
    statusOrder:
      row.kind === "task" && Array.isArray(row.status_order)
        ? row.status_order.filter(
            (id: unknown): id is string => typeof id === "string" && id.trim().length > 0,
          )
        : [],
    statusGroupOverrides:
      row.kind === "task"
        ? parseStatusGroupOverrides(row.status_group_overrides)
        : {},
  };
}

function templateItemToRow(item: WorkTemplateItem) {
  return {
    id: item.id,
    template_id: item.templateId,
    parent_id: item.parentId,
    kind: item.kind,
    title: item.title,
    description: item.description,
    sort_order: item.sortOrder,
    assignee_ids: item.assigneeIds,
    checklists: item.checklists,
    task_statuses: item.kind === "task" ? item.taskStatuses : [],
    hidden_status_ids: item.kind === "task" ? item.hiddenStatusIds : [],
    status_order: item.kind === "task" ? item.statusOrder : [],
    status_group_overrides:
      item.kind === "task" ? item.statusGroupOverrides : {},
  };
}

export async function fetchTeamTemplates(teamId: string): Promise<{
  templates: WorkTemplate[];
  items: WorkTemplateItem[];
}> {
  const supabase = db();
  const { data: templateRows, error: templatesError } = await supabase
    .from("work_templates")
    .select("id, team_id, name, description, sort_order, created_at")
    .eq("team_id", teamId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (templatesError) throw new Error(formatSupabaseError(templatesError));

  const templates = ((templateRows ?? []) as Parameters<typeof templateFromRow>[0][]).map(
    templateFromRow,
  );
  const templateIds = templates.map((item) => item.id);
  if (templateIds.length === 0) return { templates, items: [] };

  const { data: itemRows, error: itemsError } = await supabase
    .from("work_template_items")
    .select(
      "id, template_id, parent_id, kind, title, description, sort_order, assignee_ids, checklists, task_statuses, hidden_status_ids, status_order, status_group_overrides",
    )
    .in("template_id", templateIds)
    .order("sort_order", { ascending: true });
  if (itemsError) throw new Error(formatSupabaseError(itemsError));

  return {
    templates,
    items: (itemRows ?? []).map(templateItemFromRow),
  };
}

export async function insertTemplate(template: WorkTemplate) {
  const { error } = await db().from("work_templates").insert({
    id: template.id,
    team_id: template.teamId,
    name: template.name,
    description: template.description,
    sort_order: template.sortOrder,
    created_at: template.createdAt,
  });
  if (error) throw new Error(formatSupabaseError(error));
}

export async function updateTemplateRow(
  templateId: string,
  patch: Partial<Pick<WorkTemplate, "name" | "description" | "sortOrder">>,
) {
  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (Object.keys(row).length === 0) return;
  const { error } = await db().from("work_templates").update(row).eq("id", templateId);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function deleteTemplateRow(templateId: string) {
  const { error } = await db().from("work_templates").delete().eq("id", templateId);
  if (error) throw new Error(formatSupabaseError(error));
}

export async function replaceTemplateItems(
  templateId: string,
  items: WorkTemplateItem[],
) {
  const supabase = db();
  const { error: deleteError } = await supabase
    .from("work_template_items")
    .delete()
    .eq("template_id", templateId);
  if (deleteError) throw new Error(formatSupabaseError(deleteError));
  if (items.length === 0) return;

  const sorted = sortTemplateItemsForInsert(items);
  const { error } = await supabase
    .from("work_template_items")
    .insert(sorted.map(templateItemToRow));
  if (error) throw new Error(formatSupabaseError(error));
}

