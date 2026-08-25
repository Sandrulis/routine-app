import type { SupabaseClient, User } from "@supabase/supabase-js";
import { listExtensionStatusesForTask } from "@/app/lib/extension/browse";
import { createTaskId } from "@/app/lib/lists";
import { createNotificationId } from "@/app/lib/notifications";
import { logError } from "@/app/lib/security/log-error";
import { createActivity } from "@/app/lib/task-activity";

export type ExtensionAssigneeOption = {
  id: string;
  name: string;
  kind: "member" | "role";
  email?: string;
};

export type ExtensionCreatedSubtask = {
  id: string;
  title: string;
  listId: string;
  parentId: string;
};

function dateOrNull(value: string | null | undefined): string | null {
  const trimmed = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  return trimmed;
}

function uniqueIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean),
    ),
  ];
}

async function insertActivityRow(
  supabase: SupabaseClient,
  teamId: string,
  activity: ReturnType<typeof createActivity>,
) {
  const { error } = await supabase.from("task_activities").insert({
    id: activity.id,
    team_id: teamId,
    task_id: activity.taskId,
    actor_id: activity.actorId,
    kind: activity.kind,
    assignee_ids: activity.assigneeIds ?? [],
    from_assignee_ids: activity.fromAssigneeIds ?? [],
    date_value: dateOrNull(activity.dateValue ?? null),
    from_date_value: dateOrNull(activity.fromDateValue ?? null),
    text: activity.text ?? null,
    previous_text: activity.previousText ?? null,
    created_at: activity.at,
  });
  if (error) {
    logError("extension subtask activity insert failed", error);
  }
}

function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function personDisplayName(
  memberName: string,
  email: string,
  profileName: string,
): string {
  const profile = profileName.trim();
  const member = memberName.trim();
  const mail = email.trim();
  if (profile && !looksLikeEmail(profile)) return profile;
  if (member && !looksLikeEmail(member)) return member;
  return profile || member || mail;
}

export async function listExtensionAssignees(
  supabase: SupabaseClient,
  teamId: string,
): Promise<ExtensionAssigneeOption[]> {
  const [{ data: members }, { data: roles }] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, name, email, user_id")
      .eq("team_id", teamId)
      .order("name", { ascending: true }),
    supabase
      .from("team_roles")
      .select("id, name, sort_order")
      .eq("team_id", teamId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  const userIds = [
    ...new Set(
      (members ?? [])
        .map((row) => String(row.user_id || "").trim())
        .filter(Boolean),
    ),
  ];
  const profileNames = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("users")
      .select("id, name")
      .in("id", userIds);
    for (const row of profiles ?? []) {
      const id = String(row.id || "").trim();
      const name = String(row.name || "").trim();
      if (id && name) profileNames.set(id, name);
    }
  }

  const people: ExtensionAssigneeOption[] = (members ?? [])
    .map((row) => {
      const email = String(row.email || "").trim();
      const userId = String(row.user_id || "").trim();
      return {
        id: String(row.id || "").trim(),
        name: personDisplayName(
          String(row.name || ""),
          email,
          profileNames.get(userId) || "",
        ),
        email,
        kind: "member" as const,
      };
    })
    .filter((row) => row.id && row.name)
    .sort((left, right) => left.name.localeCompare(right.name, "lv"));

  const roleOptions: ExtensionAssigneeOption[] = (roles ?? [])
    .map((row) => ({
      id: String(row.id || "").trim(),
      name: String(row.name || "").trim(),
      kind: "role" as const,
    }))
    .filter((row) => row.id && row.name);

  return [...people, ...roleOptions];
}

export async function canCreateExtensionSubtask(
  supabase: SupabaseClient,
  listId: string,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("work_list_has_access", {
    p_list_id: listId,
    p_min: "full_edit",
  });
  if (error) {
    logError("extension work_list_has_access failed", error);
    return false;
  }
  return data === true;
}

export async function createExtensionSubtask(input: {
  supabase: SupabaseClient;
  user: User;
  parentId: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  assigneeIds?: string[];
  status?: string | null;
}): Promise<
  | { ok: true; subtask: ExtensionCreatedSubtask }
  | { ok: false; error: string; status: number }
> {
  const parentId = input.parentId.trim();
  const title = input.title.trim().slice(0, 240);
  if (!parentId) {
    return { ok: false, error: "errors.extension_task_required", status: 400 };
  }
  if (!title) {
    return { ok: false, error: "errors.extension_title_required", status: 400 };
  }

  const { data: parent, error: parentError } = await input.supabase
    .from("work_tasks")
    .select("id, team_id, list_id, kind, deleted_at, archived_at")
    .eq("id", parentId)
    .maybeSingle();

  if (parentError || !parent) {
    return { ok: false, error: "errors.extension_task_required", status: 404 };
  }
  if (parent.kind !== "task") {
    return { ok: false, error: "errors.extension_task_required", status: 400 };
  }
  if (parent.deleted_at || parent.archived_at) {
    return {
      ok: false,
      error: "errors.extension_subtask_unavailable",
      status: 400,
    };
  }

  const teamId = String(parent.team_id || "").trim();
  const listId = String(parent.list_id || "").trim();
  if (!teamId || !listId) {
    return { ok: false, error: "errors.extension_task_required", status: 404 };
  }

  const allowed = await canCreateExtensionSubtask(input.supabase, listId);
  if (!allowed) {
    return {
      ok: false,
      error: "errors.extension_create_forbidden",
      status: 403,
    };
  }

  const allowedAssignees = await listExtensionAssignees(input.supabase, teamId);
  const allowedIds = new Set(allowedAssignees.map((item) => item.id));
  const assigneeIds = uniqueIds(input.assigneeIds).filter((id) =>
    allowedIds.has(id),
  );
  const startDate = dateOrNull(input.startDate);
  const dueDate = dateOrNull(input.dueDate);
  const description = String(input.description || "").trim().slice(0, 8000);
  const requestedStatus = String(input.status || "").trim();
  const statusCatalog = await listExtensionStatusesForTask(
    input.supabase,
    parentId,
    "lv",
  );
  const allowedStatusIds = new Set(
    statusCatalog.statuses.map((item) => item.id),
  );
  const status =
    allowedStatusIds.size === 0
      ? requestedStatus && /^[\w.-]{1,80}$/.test(requestedStatus)
        ? requestedStatus
        : "todo"
      : allowedStatusIds.has(requestedStatus)
        ? requestedStatus
        : statusCatalog.defaultStatus;
  const createdAt = new Date().toISOString();
  const id = createTaskId();

  const { data: siblingRows } = await input.supabase
    .from("work_tasks")
    .select("sort_order")
    .eq("parent_id", parentId)
    .eq("kind", "subtask");
  const sortOrder =
    (siblingRows ?? []).reduce(
      (max, row) => Math.max(max, Number(row.sort_order) || 0),
      -1,
    ) + 1;

  const { error: insertError } = await input.supabase.from("work_tasks").insert({
    id,
    team_id: teamId,
    list_id: listId,
    parent_id: parentId,
    kind: "subtask",
    title,
    description,
    status,
    status_changed_at: createdAt,
    deleted_at: null,
    archived_at: null,
    start_date: startDate,
    due_date: dueDate,
    sort_order: sortOrder,
    checklists: [],
    hidden_status_ids: [],
    status_order: [],
    status_group_overrides: {},
    created_at: createdAt,
  });
  if (insertError) {
    logError("extension subtask insert failed", insertError);
    const message = String(insertError.message || "").toLowerCase();
    if (
      insertError.code === "42501" ||
      message.includes("row-level security") ||
      message.includes("not allowed")
    ) {
      return {
        ok: false,
        error: "errors.extension_create_forbidden",
        status: 403,
      };
    }
    return { ok: false, error: "errors.extension_create_failed", status: 500 };
  }

  if (assigneeIds.length > 0) {
    const { error: assigneeError } = await input.supabase.rpc(
      "set_task_assignees",
      {
        p_task_id: id,
        p_ids: assigneeIds,
      },
    );
    if (assigneeError) {
      logError("extension subtask assignees failed", assigneeError);
    }
  }

  const actorId = input.user.id;
  await insertActivityRow(
    input.supabase,
    teamId,
    createActivity({
      actorId,
      taskId: id,
      kind: "created",
      at: createdAt,
    }),
  );
  if (assigneeIds.length > 0) {
    await insertActivityRow(
      input.supabase,
      teamId,
      createActivity({
        actorId,
        taskId: id,
        kind: "assignee_added",
        assigneeIds,
        at: createdAt,
      }),
    );
  }
  if (startDate) {
    await insertActivityRow(
      input.supabase,
      teamId,
      createActivity({
        actorId,
        taskId: id,
        kind: "start_date",
        dateValue: startDate,
        at: createdAt,
      }),
    );
  }
  if (dueDate) {
    await insertActivityRow(
      input.supabase,
      teamId,
      createActivity({
        actorId,
        taskId: id,
        kind: "due_date",
        dateValue: dueDate,
        at: createdAt,
      }),
    );
  }

  if (assigneeIds.length > 0) {
    const { data: memberRows } = await input.supabase
      .from("team_members")
      .select("id, role_id")
      .eq("team_id", teamId);
    const memberIds = new Set(
      (memberRows ?? []).map((row) => String(row.id || "")).filter(Boolean),
    );
    const fromRoles = (memberRows ?? [])
      .filter((row) => row.role_id && assigneeIds.includes(String(row.role_id)))
      .map((row) => String(row.id || ""))
      .filter(Boolean);
    const recipientIds = [...new Set([...assigneeIds, ...fromRoles])].filter(
      (memberId) => memberIds.has(memberId) && memberId !== actorId,
    );
    if (recipientIds.length > 0) {
      const href = `/lists/${listId}/tasks/${parentId}`;
      const { error: notifyError } = await input.supabase
        .from("app_notifications")
        .insert(
          recipientIds.map((recipientId) => ({
            id: createNotificationId(),
            team_id: teamId,
            kind: "assigned",
            actor_id: actorId,
            recipient_id: recipientId,
            task_title: title,
            href,
            created_at: createdAt,
          })),
        );
      if (notifyError) {
        logError("extension subtask notify failed", notifyError);
      }
    }
  }

  return {
    ok: true,
    subtask: {
      id,
      title,
      listId,
      parentId,
    },
  };
}
