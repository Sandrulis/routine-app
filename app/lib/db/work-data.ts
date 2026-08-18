import { createClient } from "@/app/lib/supabase/client";
import type { AppNotification } from "@/app/lib/notifications";
import type { ListFile } from "@/app/lib/list-files";
import type { WorkList, WorkTask } from "@/app/lib/lists";
import { initialsFromName, type MembersByTeam, type TeamMember, type WorkTeam } from "@/app/lib/team";
import type { TaskActivity, TaskFile } from "@/app/lib/task-activity";
import type { TodoItem } from "@/app/lib/team-todo";

function db() {
  return createClient();
}

function dateOrNull(value: string | null | undefined): string | null {
  return value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null;
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
    initials: initialsFromName(row.name),
    toneClassName: row.tone_class_name,
    lastOnlineAt: row.last_online_at,
    avatarUrl: row.avatar_url,
  };
}

export async function fetchUserTeams(): Promise<{
  teams: WorkTeam[];
  membersByTeam: MembersByTeam;
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
      "id, team_id, user_id, email, name, role, tone_class_name, avatar_url, last_online_at",
    );
  if (memberError) throw memberError;

  const membersByTeam: MembersByTeam = {};
  for (const row of memberRows ?? []) {
    const list = membersByTeam[row.team_id] ?? [];
    list.push(memberFromRow(row));
    membersByTeam[row.team_id] = list;
  }

  return {
    teams: (teamRows ?? []).map(teamFromRow),
    membersByTeam,
  };
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
  ] = await Promise.all([
    supabase
      .from("work_lists")
      .select("id, name, description, icon, color, kind")
      .eq("team_id", teamId)
      .order("created_at", { ascending: true }),
    supabase
      .from("work_tasks")
      .select(
        "id, list_id, parent_id, kind, title, description, status, start_date, due_date, sort_order",
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
  ]);

  const errors = [
    listsRes.error,
    tasksRes.error,
    activitiesRes.error,
    taskFilesRes.error,
    listFilesRes.error,
    notificationsRes.error,
    todosRes.error,
  ].filter(Boolean);
  if (errors[0]) throw errors[0];

  const taskIds = (tasksRes.data ?? []).map((row) => row.id);
  let assigneeRows: { task_id: string; member_id: string }[] = [];
  if (taskIds.length > 0) {
    const assigneesRes = await supabase
      .from("task_assignees")
      .select("task_id, member_id")
      .in("task_id", taskIds);
    if (assigneesRes.error) throw assigneesRes.error;
    assigneeRows = assigneesRes.data ?? [];
  }

  const assigneesByTask = new Map<string, string[]>();
  for (const row of assigneeRows) {
    const list = assigneesByTask.get(row.task_id) ?? [];
    list.push(row.member_id);
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

  return {
    lists: (listsRes.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      kind: row.kind,
    })),
    tasks: (tasksRes.data ?? []).map((row) => ({
      id: row.id,
      listId: row.list_id,
      parentId: row.parent_id,
      kind: row.kind,
      title: row.title,
      description: row.description,
      status: row.status,
      assigneeIds: assigneesByTask.get(row.id) ?? [],
      startDate: row.start_date,
      dueDate: row.due_date,
      sortOrder: row.sort_order,
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
      status: row.status,
      assigneeId: row.assignee_id,
      dueDate: row.due_date,
    })),
  };
}

export async function insertList(teamId: string, list: WorkList) {
  const { error } = await db().from("work_lists").insert({
    id: list.id,
    team_id: teamId,
    name: list.name,
    description: list.description,
    icon: list.icon,
    color: list.color,
    kind: list.kind,
  });
  if (error) throw error;
}

export async function updateListRow(
  listId: string,
  patch: Partial<Pick<WorkList, "name" | "description" | "icon" | "color">>,
) {
  const { error } = await db().from("work_lists").update(patch).eq("id", listId);
  if (error) throw error;
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
    start_date: dateOrNull(task.startDate),
    due_date: dateOrNull(task.dueDate),
    sort_order: task.sortOrder,
  });
  if (error) throw error;
  if (task.assigneeIds.length > 0) {
    const { error: assigneeError } = await supabase.from("task_assignees").insert(
      task.assigneeIds.map((memberId) => ({
        task_id: task.id,
        member_id: memberId,
      })),
    );
    if (assigneeError) throw assigneeError;
  }
}

export async function updateTaskRow(
  taskId: string,
  patch: Partial<
    Pick<WorkTask, "title" | "description" | "status" | "assigneeIds" | "startDate" | "dueDate">
  >,
) {
  const supabase = db();
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.startDate !== undefined) row.start_date = dateOrNull(patch.startDate);
  if (patch.dueDate !== undefined) row.due_date = dateOrNull(patch.dueDate);
  if (Object.keys(row).length > 0) {
    const { error } = await supabase.from("work_tasks").update(row).eq("id", taskId);
    if (error) throw error;
  }
  if (patch.assigneeIds) {
    const { error: delError } = await supabase
      .from("task_assignees")
      .delete()
      .eq("task_id", taskId);
    if (delError) throw delError;
    if (patch.assigneeIds.length > 0) {
      const { error: insError } = await supabase.from("task_assignees").insert(
        patch.assigneeIds.map((memberId) => ({
          task_id: taskId,
          member_id: memberId,
        })),
      );
      if (insError) throw insError;
    }
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
    status: row.status,
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
