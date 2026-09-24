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

export type FactorySharedJob = {
  id: string;
  folderName: string;
  taskName: string;
  subtaskTitle: string;
  checklists: TaskChecklist[];
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

export async function listFactorySharedJobs(): Promise<FactorySharedJob[]> {
  const access = await requireFactoryTeamId();
  if (!access) return [];
  const { admin, teamId } = access;
  const { data: shared } = await admin
    .from("work_tasks")
    .select("id, title, kind, parent_id, list_id, checklists")
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
  const { data: lists } = await admin
    .from("work_lists")
    .select("id, name, kind")
    .eq("team_id", teamId)
    .in("id", listIds);
  const listById = new Map(
    ((lists ?? []) as Array<{ id: string; name: string; kind: string }>).map((list) => [
      list.id,
      list,
    ]),
  );

  return rows
    .map((row) => {
      const parent = row.parent_id ? byId.get(row.parent_id) : undefined;
      const list = listById.get(row.list_id);
      let folderName = list?.name ?? "";
      let taskName = parent?.title ?? row.title;
      if (parent?.kind === "folder") {
        folderName = parent.title;
        taskName = row.title;
      } else if (parent?.parent_id) {
        const folder = byId.get(parent.parent_id);
        if (folder?.kind === "folder") folderName = folder.title;
      }
      return {
        id: row.id,
        folderName,
        taskName,
        subtaskTitle: row.title,
        checklists: parseTaskChecklists(row.checklists),
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

export async function updateFactorySharedChecklists(taskId: string, checklists: TaskChecklist[]) {
  const access = await requireFactoryTeamId();
  if (!access) return { ok: false as const, error: "errors.factory_forbidden" };
  const { data: existing } = await access.admin
    .from("work_tasks")
    .select("checklists")
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
  const { data, error } = await access.admin
    .from("work_tasks")
    .update({ checklists: normalized })
    .eq("id", taskId)
    .eq("team_id", access.teamId)
    .eq("kind", "subtask")
    .eq("factory_shared", true)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();
  if (error || !data) return { ok: false as const, error: "errors.factory_save_failed" };
  return { ok: true as const, data: normalized };
}
