import { getRequestLanguageCode } from "@/app/lib/i18n/server";
import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";
import {
  LIST_STATUS_GROUPS,
  mapListStatusRow,
  mapWorkTaskStatusRow,
  parseStatusGroupOverrides,
  parseStatusLabels,
  primaryStatusLabel,
  resolveStatusCatalogs,
} from "@/app/lib/list-statuses";
import { parseIdList } from "@/app/lib/lists";
import { touchFactoryUserOnline } from "@/app/lib/factory/repository";
import {
  normalizeTaskChecklists,
  parseTaskChecklists,
  type TaskChecklist,
} from "@/app/lib/task-checklists";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { decryptSecret } from "@/app/lib/security/secret-box";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { getPaymentPlansEnabledCached } from "@/app/lib/payment-plans/repository";
import {
  readFactorySession,
  secretsMatch,
  writeFactorySession,
} from "@/app/lib/factory/session";

export type FactoryPortalUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type CandidateRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_secret: string;
  team_id: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapUser(row: Pick<CandidateRow, "id" | "first_name" | "last_name" | "email">): FactoryPortalUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
  };
}

export async function teamAllowsFactoryLogin(teamId: string) {
  const admin = createAdminClient();
  const { data: team } = await admin
    .from("teams")
    .select("payment_plan_paid, payment_plan_id, is_vip")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) return false;
  if (team.is_vip === true) return true;
  if (team.payment_plan_paid !== true) return false;

  const plansOn = await getPaymentPlansEnabledCached();
  const planId = team.payment_plan_id as string | null;
  if (!plansOn) return true;
  if (!planId) return true;

  const [{ data: plan }, { data: moduleRow }] = await Promise.all([
    admin.from("site_payment_plans").select("is_free").eq("id", planId).maybeSingle(),
    admin
      .from("site_payment_plan_modules")
      .select("module_key")
      .eq("plan_id", planId)
      .eq("module_key", FRONTEND_MODULE_KEYS.factory)
      .maybeSingle(),
  ]);
  if (plan?.is_free === true) return false;
  return Boolean(moduleRow);
}

export async function factoryPortalAvailable() {
  return isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.factory);
}

export async function loadFactoryPortalUser(): Promise<FactoryPortalUser | null> {
  if (!(await factoryPortalAvailable())) return null;
  const session = await readFactorySession();
  if (!session || !isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_factory_users")
    .select("id, first_name, last_name, email, team_id")
    .eq("id", session.id)
    .maybeSingle();
  if (!data) return null;
  if (!(await teamAllowsFactoryLogin(data.team_id as string))) return null;
  return mapUser(data as CandidateRow);
}

export async function signInFactoryPortal(emailInput: string, password: string) {
  if (!(await factoryPortalAvailable())) {
    return { ok: false as const, error: "errors.factory_module_disabled" };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const email = emailInput.trim().toLowerCase();
  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false as const, error: "errors.factory_login_invalid" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_factory_users")
    .select("id, first_name, last_name, email, password_secret, team_id")
    .eq("email", email);
  if (error || !data?.length) {
    return { ok: false as const, error: "errors.factory_login_invalid" };
  }

  for (const row of data as CandidateRow[]) {
    const stored = decryptSecret(row.password_secret);
    if (!stored || !secretsMatch(stored, password)) continue;
    if (!(await teamAllowsFactoryLogin(row.team_id))) {
      return { ok: false as const, error: "errors.factory_not_paid" };
    }
    await writeFactorySession(row.id);
    await touchFactoryUserOnline(row.id);
    return { ok: true as const, data: mapUser(row) };
  }
  return { ok: false as const, error: "errors.factory_login_invalid" };
}

export type FactoryItemStatus = {
  id: string;
  label: string;
  color: string;
  groupKey: string;
};

export type FactorySharedJob = {
  id: string;
  folderName: string;
  hasFolder: boolean;
  taskName: string;
  subtaskTitle: string;
  checklists: TaskChecklist[];
  statuses: FactoryItemStatus[];
};

type NameRow = {
  id: string;
  title: string;
  kind: string;
  parent_id: string | null;
  list_id: string;
};

async function requireFactoryTeamId() {
  if (!(await factoryPortalAvailable())) return null;
  const session = await readFactorySession();
  if (!session || !isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("team_factory_users")
    .select("team_id")
    .eq("id", session.id)
    .maybeSingle();
  const teamId = data?.team_id as string | undefined;
  if (!teamId || !(await teamAllowsFactoryLogin(teamId))) return null;
  return { admin, teamId, userId: session.id };
}

export async function factoryPortalTimeTracking() {
  const access = await requireFactoryTeamId();
  if (!access) return false;
  if (!(await isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.timeTracking))) return false;

  const { data: team } = await access.admin
    .from("teams")
    .select("is_vip, payment_plan_paid, payment_plan_id")
    .eq("id", access.teamId)
    .maybeSingle();
  if (!team) return false;
  if (team.is_vip === true) return true;

  const plansOn = await getPaymentPlansEnabledCached();
  const planId = team.payment_plan_id as string | null;
  if (!plansOn) return true;
  if (team.payment_plan_paid === true && !planId) return true;
  if (!planId) return false;

  const { data: moduleRow } = await access.admin
    .from("site_payment_plan_modules")
    .select("module_key")
    .eq("plan_id", planId)
    .eq("module_key", FRONTEND_MODULE_KEYS.timeTracking)
    .maybeSingle();
  return Boolean(moduleRow);
}

type LayoutRow = {
  id: string;
  hidden_status_ids: unknown;
  status_order: unknown;
  status_group_overrides: unknown;
};

function layoutOf(row: LayoutRow | undefined) {
  if (!row) return null;
  return {
    hiddenStatusIds: parseIdList(row.hidden_status_ids),
    statusOrder: parseIdList(row.status_order),
    statusGroupOverrides: parseStatusGroupOverrides(row.status_group_overrides),
  };
}

function groupRank(groupKey: string) {
  const index = LIST_STATUS_GROUPS.indexOf(groupKey as (typeof LIST_STATUS_GROUPS)[number]);
  return index < 0 ? LIST_STATUS_GROUPS.length : index;
}

export function highestStandingStatusId(
  statusIds: Array<string | null | undefined>,
  catalog: Array<{ id: string; groupKey: string }>,
) {
  const chosen = statusIds
    .map((id) => catalog.find((status) => status.id === id))
    .filter((status): status is { id: string; groupKey: string } => Boolean(status));
  if (chosen.length === 0) return null;
  chosen.sort((left, right) => {
    const groupDiff = groupRank(left.groupKey) - groupRank(right.groupKey);
    if (groupDiff !== 0) return groupDiff;
    return catalog.findIndex((status) => status.id === left.id) -
      catalog.findIndex((status) => status.id === right.id);
  });
  return chosen[0]?.id ?? null;
}

export async function listFactorySharedJobs(): Promise<FactorySharedJob[]> {
  const access = await requireFactoryTeamId();
  if (!access) return [];
  const { admin, teamId } = access;
  const { data: shared } = await admin
    .from("work_tasks")
    .select("id, title, kind, parent_id, list_id, status, checklists")
    .eq("team_id", teamId)
    .eq("kind", "subtask")
    .eq("factory_shared", true)
    .is("deleted_at", null);

  const rows = (shared ?? []) as Array<NameRow & { checklists?: unknown }>;
  if (rows.length === 0) return [];

  const needed = new Set<string>();
  for (const row of rows) {
    if (row.parent_id) needed.add(row.parent_id);
  }
  const byId = new Map<string, NameRow>();
  if (needed.size > 0) {
    const { data: parents } = await admin
      .from("work_tasks")
      .select("id, title, kind, parent_id, list_id")
      .eq("team_id", teamId)
      .in("id", [...needed]);
    for (const parent of (parents ?? []) as NameRow[]) {
      byId.set(parent.id, parent);
      if (parent.parent_id) needed.add(parent.parent_id);
    }
    const missing = [...needed].filter((id) => !byId.has(id));
    if (missing.length > 0) {
      const { data: grandparents } = await admin
        .from("work_tasks")
        .select("id, title, kind, parent_id, list_id")
        .eq("team_id", teamId)
        .in("id", missing);
      for (const item of (grandparents ?? []) as NameRow[]) byId.set(item.id, item);
    }
  }

  const listIds = [...new Set(rows.map((row) => row.list_id))];
  const parentIds = [...new Set(rows.map((row) => row.parent_id).filter((id): id is string => Boolean(id)))];
  const languageCode = await getRequestLanguageCode();
  const [{ data: lists }, { data: systemStatuses }, { data: listStatuses }, { data: taskStatuses }, { data: parentLayouts }] =
    await Promise.all([
      admin.from("work_lists").select("id, name, kind, hidden_status_ids, status_order, status_group_overrides").eq("team_id", teamId).in("id", listIds),
      admin.from("task_statuses").select("id, label, labels, color, icon, sort_order, group_key").order("sort_order", { ascending: true }),
      admin.from("work_list_statuses").select("id, list_id, label, labels, color, icon, sort_order, group_key").in("list_id", listIds),
      parentIds.length
        ? admin.from("work_task_statuses").select("id, parent_task_id, list_id, label, labels, color, icon, sort_order, group_key").in("parent_task_id", parentIds)
        : Promise.resolve({ data: [] }),
      parentIds.length
        ? admin.from("work_tasks").select("id, hidden_status_ids, status_order, status_group_overrides").eq("team_id", teamId).in("id", parentIds)
        : Promise.resolve({ data: [] }),
    ]);
  const listById = new Map(
    ((lists ?? []) as Array<{ id: string; name: string; kind: string } & LayoutRow>).map((list) => [
      list.id,
      list,
    ]),
  );
  const system = ((systemStatuses ?? []) as Array<{
    id: string;
    label: string;
    labels: unknown;
    color: string;
    icon: string | null;
    sort_order: number;
    group_key: string;
  }>).map((row) => {
    const labels = parseStatusLabels(row.labels);
    const legacy = row.label?.trim() ?? "";
    if (!labels.lv && legacy) labels.lv = legacy;
    return {
      id: row.id,
      labels,
      label: primaryStatusLabel(labels, legacy),
      color: row.color,
      icon: row.icon?.trim() || null,
      sortOrder: row.sort_order,
      groupKey: row.group_key,
    };
  });
  const statusesByList = new Map<string, ReturnType<typeof mapListStatusRow>[]>();
  for (const row of (listStatuses ?? []) as Parameters<typeof mapListStatusRow>[0][]) {
    const mapped = mapListStatusRow(row);
    const bucket = statusesByList.get(mapped.listId) ?? [];
    bucket.push(mapped);
    statusesByList.set(mapped.listId, bucket);
  }
  const statusesByParent = new Map<string, ReturnType<typeof mapWorkTaskStatusRow>[]>();
  for (const row of (taskStatuses ?? []) as Parameters<typeof mapWorkTaskStatusRow>[0][]) {
    const mapped = mapWorkTaskStatusRow(row);
    const bucket = statusesByParent.get(mapped.parentTaskId) ?? [];
    bucket.push(mapped);
    statusesByParent.set(mapped.parentTaskId, bucket);
  }
  const parentLayoutById = new Map(
    ((parentLayouts ?? []) as LayoutRow[]).map((row) => [row.id, row]),
  );
  const catalogByKey = new Map<string, FactoryItemStatus[]>();
  function statusesFor(listId: string, parentId: string | null) {
    const key = `${listId}:${parentId ?? ""}`;
    const cached = catalogByKey.get(key);
    if (cached) return cached;
    const { visible } = resolveStatusCatalogs(system, statusesByList.get(listId) ?? [], {
      listId,
      parentTaskId: parentId,
      workTaskStatuses: parentId ? (statusesByParent.get(parentId) ?? []) : [],
      list: layoutOf(listById.get(listId)),
      parentTask: parentId ? layoutOf(parentLayoutById.get(parentId)) : null,
    });
    const options = visible.map((status) => ({
      id: status.id,
      label: resolveLocalizedValue(status.labels, languageCode) || status.label,
      color: status.color,
      groupKey: status.groupKey,
    }));
    catalogByKey.set(key, options);
    return options;
  }

  return rows
    .filter((row) => {
      const statusId = (row as { status?: string }).status ?? "";
      const catalog = statusesFor(row.list_id, row.parent_id);
      const match = catalog.find((status) => status.id === statusId);
      return match?.groupKey !== "closed";
    })
    .map((row) => {
      const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
      const list = listById.get(row.list_id);
      let folderName = list?.name ?? "";
      let taskName = parent?.title ?? row.title;
      let hasFolder = false;
      if (parent?.kind === "folder") {
        folderName = parent.title;
        taskName = row.title;
        hasFolder = true;
      } else if (parent?.parent_id) {
        const folder = byId.get(parent.parent_id);
        if (folder?.kind === "folder") {
          folderName = folder.title;
          hasFolder = true;
        }
      }
      return {
        id: row.id,
        folderName,
        hasFolder,
        taskName,
        subtaskTitle: row.title,
        checklists: parseTaskChecklists(row.checklists),
        statuses: statusesFor(row.list_id, row.parent_id),
      };
    })
    .sort((left, right) =>
      `${left.folderName}\0${left.taskName}\0${left.subtaskTitle}`.localeCompare(
        `${right.folderName}\0${right.taskName}\0${right.subtaskTitle}`,
      ),
    );
}

function keepForeignChecklistProgress(
  previous: TaskChecklist[],
  next: TaskChecklist[],
  userId: string,
) {
  const previousItems = new Map(
    previous.flatMap((list) => list.items.map((item) => [item.id, item] as const)),
  );
  return next.map((list) => ({
    ...list,
    items: list.items.map((item) => {
      const stored = previousItems.get(item.id);
      const ownerId = stored?.activeTimer?.actorId;
      const ownerKind = stored?.activeTimer?.actorKind;
      if (!ownerId || !ownerKind || (ownerKind === "factory" && ownerId === userId)) {
        return item;
      }
      return {
        ...item,
        done: stored.done,
        activeTimer: stored.activeTimer,
        timeLogs: stored.timeLogs,
      };
    }),
  }));
}

async function visibleStatusesFor(
  admin: ReturnType<typeof createAdminClient>,
  listId: string,
  parentId: string | null,
): Promise<FactoryItemStatus[]> {
  const languageCode = await getRequestLanguageCode();
  const [{ data: list }, { data: systemStatuses }, { data: listStatuses }, { data: taskStatuses }, { data: parent }] =
    await Promise.all([
      admin.from("work_lists").select("id, hidden_status_ids, status_order, status_group_overrides").eq("id", listId).maybeSingle(),
      admin.from("task_statuses").select("id, label, labels, color, icon, sort_order, group_key").order("sort_order", { ascending: true }),
      admin.from("work_list_statuses").select("id, list_id, label, labels, color, icon, sort_order, group_key").eq("list_id", listId),
      parentId
        ? admin.from("work_task_statuses").select("id, parent_task_id, list_id, label, labels, color, icon, sort_order, group_key").eq("parent_task_id", parentId)
        : Promise.resolve({ data: [] }),
      parentId
        ? admin.from("work_tasks").select("id, hidden_status_ids, status_order, status_group_overrides").eq("id", parentId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
  const system = ((systemStatuses ?? []) as Array<{
    id: string;
    label: string;
    labels: unknown;
    color: string;
    icon: string | null;
    sort_order: number;
    group_key: string;
  }>).map((row) => {
    const labels = parseStatusLabels(row.labels);
    const legacy = row.label?.trim() ?? "";
    if (!labels.lv && legacy) labels.lv = legacy;
    return {
      id: row.id,
      labels,
      label: primaryStatusLabel(labels, legacy),
      color: row.color,
      icon: row.icon?.trim() || null,
      sortOrder: row.sort_order,
      groupKey: row.group_key,
    };
  });
  const { visible } = resolveStatusCatalogs(
    system,
    ((listStatuses ?? []) as Parameters<typeof mapListStatusRow>[0][]).map(mapListStatusRow),
    {
      listId,
      parentTaskId: parentId,
      workTaskStatuses: ((taskStatuses ?? []) as Parameters<typeof mapWorkTaskStatusRow>[0][]).map(mapWorkTaskStatusRow),
      list: layoutOf((list ?? undefined) as LayoutRow | undefined),
      parentTask: layoutOf((parent ?? undefined) as LayoutRow | undefined),
    },
  );
  return visible.map((status) => ({
    id: status.id,
    label: resolveLocalizedValue(status.labels, languageCode) || status.label,
    color: status.color,
    groupKey: status.groupKey,
  }));
}

export async function updateFactorySharedChecklists(taskId: string, checklists: TaskChecklist[]) {
  const access = await requireFactoryTeamId();
  if (!access) return { ok: false as const, error: "errors.factory_forbidden" };
  const { data: existing } = await access.admin
    .from("work_tasks")
    .select("checklists, list_id, parent_id, status")
    .eq("id", taskId)
    .eq("team_id", access.teamId)
    .eq("kind", "subtask")
    .eq("factory_shared", true)
    .is("deleted_at", null)
    .maybeSingle();
  if (!existing) return { ok: false as const, error: "errors.factory_forbidden" };
  const normalized = keepForeignChecklistProgress(
    parseTaskChecklists(existing.checklists),
    normalizeTaskChecklists(checklists),
    access.userId,
  );
  const listId = existing.list_id as string;
  const parentId = (existing.parent_id as string | null) ?? null;
  const catalog = await visibleStatusesFor(access.admin, listId, parentId);
  const activeIds = new Set(
    catalog.filter((status) => status.groupKey === "active").map((status) => status.id),
  );
  const storedItems = new Map(
    parseTaskChecklists(existing.checklists).flatMap((list) =>
      list.items.map((item) => [item.id, item] as const),
    ),
  );
  const guarded = normalized.map((list) => ({
    ...list,
    items: list.items.map((item) => {
      const stored = storedItems.get(item.id);
      const started =
        Boolean(item.activeTimer?.actorId) || item.timeLogs.some((log) => log.actorId);
      const statusChanged = (item.statusId ?? null) !== (stored?.statusId ?? null);
      if (statusChanged && (item.done || !started)) {
        return { ...item, statusId: stored?.statusId ?? null };
      }
      if (!item.statusId || activeIds.has(item.statusId)) return item;
      return { ...item, statusId: stored?.statusId ?? null };
    }),
  }));
  const nextStatusId = highestStandingStatusId(
    guarded.flatMap((list) =>
      list.items.filter((item) => item.title.trim()).map((item) => item.statusId),
    ),
    catalog,
  );
  const statusPatch =
    nextStatusId && nextStatusId !== existing.status
      ? { status: nextStatusId, status_changed_at: new Date().toISOString() }
      : {};
  const { data, error } = await access.admin
    .from("work_tasks")
    .update({ checklists: guarded, ...statusPatch })
    .eq("id", taskId)
    .eq("team_id", access.teamId)
    .eq("kind", "subtask")
    .eq("factory_shared", true)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false as const, error: "errors.factory_save_failed" };
  const applied = nextStatusId ?? (existing.status as string);
  const removed = catalog.find((status) => status.id === applied)?.groupKey === "closed";
  return { ok: true as const, data: { checklists: guarded, removed } };
}
