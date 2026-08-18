import { createClient } from "@/app/lib/supabase/client";
import type { AppNotification } from "@/app/lib/notifications";
import type { ListFile } from "@/app/lib/list-files";
import type { WorkList, WorkTask } from "@/app/lib/lists";
import { parseTaskChecklists } from "@/app/lib/task-checklists";
import {
  DEFAULT_LIST_ACCESS_LEVEL,
  parseListAccessLevel,
  type ListAccessLevel,
} from "@/app/lib/list-access";
import { initialsFromName, type MembersByTeam, type RolesByTeam, type TeamMember, type TeamRole, type WorkTeam } from "@/app/lib/team";
import { normalizeTeamPermissionSet } from "@/app/lib/team-permissions";
import type { TaskActivity, TaskFile } from "@/app/lib/task-activity";
import { isTodoStatus, type TodoItem } from "@/app/lib/team-todo";
import {
  isListStatusGroup,
  mapListStatusRow,
  normalizeStatusColor,
  normalizeStatusLabels,
  parseStatusGroupOverrides,
  parseTeamStatusLabels,
  primaryStatusLabel,
  type ListStatus,
} from "@/app/lib/list-statuses";

function db() {
  return createClient();
}

function dateOrNull(value: string | null | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
}

async function replaceTaskAssignees(taskId: string, assigneeIds: string[]) {
  const supabase = db();
  const [{ error: delMembers }, { error: delRoles }] = await Promise.all([
    supabase.from("task_assignees").delete().eq("task_id", taskId),
    supabase.from("task_assignee_roles").delete().eq("task_id", taskId),
  ]);
  if (delMembers) throw new Error(formatSupabaseError(delMembers));
  if (delRoles) throw new Error(formatSupabaseError(delRoles));
  if (assigneeIds.length === 0) return;

  const [membersRes, rolesRes] = await Promise.all([
    supabase.from("team_members").select("id").in("id", assigneeIds),
    supabase.from("team_roles").select("id").in("id", assigneeIds),
  ]);
  if (membersRes.error) throw new Error(formatSupabaseError(membersRes.error));
  if (rolesRes.error) throw new Error(formatSupabaseError(rolesRes.error));

  const memberIds = new Set((membersRes.data ?? []).map((row) => row.id));
  const roleIds = new Set((rolesRes.data ?? []).map((row) => row.id));
  const memberRows = assigneeIds
    .filter((id) => memberIds.has(id))
    .map((memberId) => ({ task_id: taskId, member_id: memberId }));
  const roleRows = assigneeIds
    .filter((id) => roleIds.has(id) && !memberIds.has(id))
    .map((roleId) => ({ task_id: taskId, role_id: roleId }));

  if (memberRows.length > 0) {
    const { error } = await supabase.from("task_assignees").insert(memberRows);
    if (error) throw new Error(formatSupabaseError(error));
  }
  if (roleRows.length > 0) {
    const { error } = await supabase.from("task_assignee_roles").insert(roleRows);
    if (error) throw new Error(formatSupabaseError(error));
  }
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
  };
}

function teamFromRow(row: {
  id: string;
  name: string;
  initials: string;
  icon: string | null;
  color: string;
  logo_url: string | null;
}): WorkTeam {
  return {
    id: row.id,
    name: row.name,
    initials: row.initials,
    icon: row.icon,
    color: row.color,
    logoUrl: row.logo_url,
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
}): TeamMember {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role,
    roleId: row.role_id,
    initials: initialsFromName(row.name),
    toneClassName: row.tone_class_name,
    lastOnlineAt: row.last_online_at,
    avatarUrl: row.avatar_url,
  };
}

export async function fetchUserTeams(): Promise<{
  teams: WorkTeam[];
  membersByTeam: MembersByTeam;
  rolesByTeam: RolesByTeam;
}> {
  const supabase = db();
  const { data: teamRows, error: teamError } = await supabase
    .from("teams")
    .select("id, name, initials, icon, color, logo_url")
    .order("created_at", { ascending: true });
  if (teamError) throw teamError;

  const { data: memberRows, error: memberError } = await supabase
    .from("team_members")
    .select(
      "id, team_id, user_id, email, name, role, role_id, tone_class_name, avatar_url, last_online_at",
    );
  if (memberError) throw memberError;

  const { data: roleRows, error: roleError } = await supabase
    .from("team_roles")
    .select("id, team_id, slug, name, sort_order, is_system, permissions")
    .order("sort_order", { ascending: true });
  if (roleError) throw roleError;

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
  for (let index = 0; index < orderedIds.length; index += 1) {
    await updateTeamRoleRow(orderedIds[index], { sortOrder: index });
  }
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
  if (teamError) throw teamError;
  const { error: memberError } = await supabase
    .from("team_members")
    .insert(memberToRow(team.id, owner));
  if (memberError) throw memberError;
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

export async function touchMemberOnline(memberId: string, at: string) {
  const { error } = await db()
    .from("team_members")
    .update({ last_online_at: at })
    .eq("id", memberId);
  if (error) throw error;
}

export type TeamWorkspace = {
  lists: WorkList[];
  tasks: WorkTask[];
  activities: TaskActivity[];
  taskFiles: TaskFile[];
  taskFileContents: Record<string, string>;
  listFiles: ListFile[];
  listFileContents: Record<string, string>;
  listStatuses: ListStatus[];
  teamStatusLabels: Record<string, string>;
  notifications: AppNotification[];
  todos: TodoItem[];
};

export async function fetchTeamWorkspace(teamId: string): Promise<TeamWorkspace> {
  const supabase = db();
  const [
    listsRes,
    tasksRes,
    activitiesRes,
    taskFilesRes,
    listFilesRes,
    notificationsRes,
    todosRes,
    listStatusesRes,
    teamStatusLabelsRes,
  ] = await Promise.all([
    supabase
      .from("work_lists")
      .select("id, name, description, icon, color, kind, is_private, created_by, default_access_level, hidden_status_ids, status_order, status_group_overrides")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true }),
    supabase
      .from("work_tasks")
      .select(
        "id, list_id, parent_id, kind, title, description, status, status_changed_at, deleted_at, start_date, due_date, sort_order, checklists",
      )
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("task_activities")
      .select(
        "id, task_id, actor_id, kind, from_status, to_status, assignee_ids, date_value, text, file_name, created_at",
      )
      .eq("team_id", teamId),
    supabase
      .from("task_files")
      .select("id, task_id, name, mime_type, size, content, created_at")
      .eq("team_id", teamId),
    supabase
      .from("list_files")
      .select(
        "id, list_id, parent_id, name, mime_type, size, content, sort_order, created_at",
      )
      .eq("team_id", teamId),
    supabase
      .from("app_notifications")
      .select("id, kind, actor_id, recipient_id, task_title, href, created_at, read_at")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false }),
    supabase
      .from("team_todos")
      .select("id, title, description, status, assignee_id, due_date")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true }),
    supabase
      .from("list_statuses")
      .select("id, list_id, label, labels, color, sort_order, group_key")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("team_status_labels")
      .select("status_id, label")
      .eq("team_id", teamId),
  ]);

  const errors = [
    listsRes.error,
    tasksRes.error,
    activitiesRes.error,
    taskFilesRes.error,
    listFilesRes.error,
    notificationsRes.error,
    todosRes.error,
    listStatusesRes.error,
    teamStatusLabelsRes.error,
  ].filter(Boolean);
  if (errors[0]) throw errors[0];

  const taskIds = (tasksRes.data ?? []).map((row) => row.id);
  let assigneeRows: { task_id: string; member_id: string }[] = [];
  let assigneeRoleRows: { task_id: string; role_id: string }[] = [];
  if (taskIds.length > 0) {
    const [assigneesRes, assigneeRolesRes] = await Promise.all([
      supabase
        .from("task_assignees")
        .select("task_id, member_id")
        .in("task_id", taskIds),
      supabase
        .from("task_assignee_roles")
        .select("task_id, role_id")
        .in("task_id", taskIds),
    ]);
    if (assigneesRes.error) throw assigneesRes.error;
    if (assigneeRolesRes.error) throw assigneeRolesRes.error;
    assigneeRows = assigneesRes.data ?? [];
    assigneeRoleRows = assigneeRolesRes.data ?? [];
  }

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

  const taskFileContents: Record<string, string> = {};
  const taskFiles: TaskFile[] = (taskFilesRes.data ?? []).map((row) => {
    if (row.content) taskFileContents[row.id] = row.content;
    return {
      id: row.id,
      taskId: row.task_id,
      name: row.name,
      mimeType: row.mime_type,
      size: row.size,
      hasContent: Boolean(row.content),
      createdAt: row.created_at,
    };
  });

  const listFileContents: Record<string, string> = {};
  const listFiles: ListFile[] = (listFilesRes.data ?? []).map((row) => {
    if (row.content) listFileContents[row.id] = row.content;
    return {
      id: row.id,
      listId: row.list_id,
      parentId: row.parent_id,
      name: row.name,
      mimeType: row.mime_type,
      size: row.size,
      hasContent: Boolean(row.content),
      createdAt: row.created_at,
      sortOrder: row.sort_order,
    };
  });

  const listIds = (listsRes.data ?? []).map((row) => row.id);
  const viewersByList = new Map<string, Record<string, ListAccessLevel>>();
  const viewerRolesByList = new Map<string, Record<string, ListAccessLevel>>();
  if (listIds.length > 0) {
    const [viewersRes, viewerRolesRes] = await Promise.all([
      supabase
        .from("work_list_viewers")
        .select("list_id, user_id, access_level")
        .in("list_id", listIds),
      supabase
        .from("work_list_viewer_roles")
        .select("list_id, role_id, access_level")
        .in("list_id", listIds),
    ]);
    if (viewersRes.error) throw viewersRes.error;
    if (viewerRolesRes.error) throw viewerRolesRes.error;
    for (const row of viewersRes.data ?? []) {
      const list = viewersByList.get(row.list_id) ?? {};
      list[row.user_id] = parseListAccessLevel(row.access_level);
      viewersByList.set(row.list_id, list);
    }
    for (const row of viewerRolesRes.data ?? []) {
      const list = viewerRolesByList.get(row.list_id) ?? {};
      list[row.role_id] = parseListAccessLevel(row.access_level);
      viewerRolesByList.set(row.list_id, list);
    }
  }

  return {
    lists: (listsRes.data ?? []).map((row) => {
      const viewerUserAccess = viewersByList.get(row.id) ?? {};
      const viewerRoleAccess = viewerRolesByList.get(row.id) ?? {};
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        icon: row.icon,
        color: row.color,
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
    tasks: (tasksRes.data ?? []).map((row) => ({
      id: row.id,
      listId: row.list_id,
      parentId: row.parent_id,
      kind: row.kind,
      title: row.title,
      description: row.description,
      status: row.status,
      statusChangedAt: row.status_changed_at ?? null,
      deletedAt: row.deleted_at ?? null,
      assigneeIds: assigneesByTask.get(row.id) ?? [],
      startDate: row.start_date,
      dueDate: row.due_date,
      sortOrder: row.sort_order,
      checklists: parseTaskChecklists(row.checklists),
    })),
    activities: (activitiesRes.data ?? []).map((row) => ({
      id: row.id,
      taskId: row.task_id,
      actorId: row.actor_id,
      kind: row.kind,
      at: row.created_at,
      fromStatus: row.from_status ?? undefined,
      toStatus: row.to_status ?? undefined,
      assigneeIds: row.assignee_ids ?? undefined,
      dateValue: row.date_value,
      text: row.text ?? undefined,
      fileName: row.file_name ?? undefined,
    })),
    taskFiles,
    taskFileContents,
    listFiles,
    listFileContents,
    listStatuses: (listStatusesRes.data ?? []).map(mapListStatusRow),
    teamStatusLabels: parseTeamStatusLabels(teamStatusLabelsRes.data),
    notifications: (notificationsRes.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      actorId: row.actor_id,
      recipientId: row.recipient_id,
      taskTitle: row.task_title,
      href: row.href,
      createdAt: row.created_at,
      readAt: row.read_at,
    })),
    todos: (todosRes.data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      status: isTodoStatus(row.status) ? row.status : "todo",
      assigneeId: row.assignee_id,
      dueDate: row.due_date,
    })),
  };
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
    start_date: dateOrNull(task.startDate),
    due_date: dateOrNull(task.dueDate),
    sort_order: task.sortOrder,
    checklists: task.checklists ?? [],
  });
  if (error) throw error;
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
      | "assigneeIds"
      | "startDate"
      | "dueDate"
      | "parentId"
      | "sortOrder"
      | "checklists"
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
  if (patch.startDate !== undefined) row.start_date = dateOrNull(patch.startDate);
  if (patch.dueDate !== undefined) row.due_date = dateOrNull(patch.dueDate);
  if (patch.parentId !== undefined) row.parent_id = patch.parentId;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.checklists !== undefined) row.checklists = patch.checklists;
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("work_tasks").update(row).eq("id", taskId);
    if (error) throw new Error(formatSupabaseError(error));
  }
  if (patch.assigneeIds) {
    await replaceTaskAssignees(taskId, patch.assigneeIds);
  }
}

export async function deleteTaskRow(taskId: string) {
  const { error } = await db().from("work_tasks").delete().eq("id", taskId);
  if (error) throw error;
}

export async function updateTaskSortOrders(orderedIds: string[]) {
  const supabase = db();
  await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("work_tasks").update({ sort_order: index }).eq("id", id),
    ),
  );
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
    date_value: dateOrNull(activity.dateValue ?? null),
    text: activity.text ?? null,
    file_name: activity.fileName ?? null,
    created_at: activity.at,
  });
  if (error) throw error;
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
    size: file.size,
    content,
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
    size: file.size,
    content,
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
    .select("id, kind, actor_id, recipient_id, task_title, href, created_at, read_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    actorId: row.actor_id,
    recipientId: row.recipient_id,
    taskTitle: row.task_title,
    href: row.href,
    createdAt: row.created_at,
    readAt: row.read_at,
  }));
}

export async function fetchTeamTodos(teamId: string): Promise<TodoItem[]> {
  const { data, error } = await db()
    .from("team_todos")
    .select("id, title, description, status, assignee_id, due_date")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
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

export async function updateListStatusSortOrders(orderedIds: string[]) {
  const supabase = db();
  for (let index = 0; index < orderedIds.length; index += 1) {
    const { error } = await supabase
      .from("list_statuses")
      .update({ sort_order: index })
      .eq("id", orderedIds[index]);
    if (error) throw error;
  }
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

