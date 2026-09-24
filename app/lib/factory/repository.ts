import type { SupabaseClient } from "@supabase/supabase-js";
import { isPasswordStrongEnough } from "@/app/lib/auth/password-strength";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { encryptSecret } from "@/app/lib/security/secret-box";
import { assertTeamActionPermission } from "@/app/lib/team/assert-team-action";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FactoryUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
};

type FactoryUserRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
};

function mapRow(row: FactoryUserRow): FactoryUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    createdAt: row.created_at,
  };
}

async function assertFactoryAccess(
  admin: SupabaseClient,
  teamId: string,
  userId: string,
) {
  const allowed = await assertTeamActionPermission(
    admin,
    teamId,
    userId,
    "team.options",
    "errors.factory_forbidden",
  );
  if (!allowed.ok) return allowed;

  const { data: team, error } = await admin
    .from("teams")
    .select("payment_plan_paid, payment_plan_id, is_vip")
    .eq("id", teamId)
    .maybeSingle();
  const isVip = team?.is_vip === true;
  if (error || !team || (team.payment_plan_paid !== true && !isVip)) {
    return { ok: false as const, error: "errors.factory_not_paid" };
  }
  const planId = team.payment_plan_id as string | null;
  if (planId && !isVip) {
    const { data: plan } = await admin
      .from("site_payment_plans")
      .select("is_free")
      .eq("id", planId)
      .maybeSingle();
    if (plan?.is_free === true) {
      return { ok: false as const, error: "errors.factory_not_paid" };
    }
  }
  return { ok: true as const };
}

export async function listFactoryUsers(teamId: string, userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const access = await assertFactoryAccess(admin, teamId, userId);
  if (!access.ok) return access;
  const { data, error } = await admin
    .from("team_factory_users")
    .select("id, first_name, last_name, email, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  if (error) {
    return { ok: false as const, error: "errors.factory_save_failed" };
  }
  return {
    ok: true as const,
    data: ((data ?? []) as FactoryUserRow[]).map(mapRow),
  };
}

export async function createFactoryUser(
  teamId: string,
  userId: string,
  input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  },
) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  if (!firstName || !lastName || firstName.length > 80 || lastName.length > 80) {
    return { ok: false as const, error: "errors.factory_name_required" };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false as const, error: "errors.factory_email_invalid" };
  }
  if (password.length < 8) {
    return { ok: false as const, error: "auth.signup.password_short" };
  }
  if (!isPasswordStrongEnough(password)) {
    return { ok: false as const, error: "auth.signup.password_too_weak" };
  }

  const admin = createAdminClient();
  const access = await assertFactoryAccess(admin, teamId, userId);
  if (!access.ok) return access;

  const id = `factory-${crypto.randomUUID()}`;
  const { data, error } = await admin
    .from("team_factory_users")
    .insert({
      id,
      team_id: teamId,
      first_name: firstName,
      last_name: lastName,
      email,
      password_secret: encryptSecret(password),
    })
    .select("id, first_name, last_name, email, created_at")
    .single();
  if (error) {
    if (error.code === "23505") {
      return { ok: false as const, error: "errors.factory_email_taken" };
    }
    return { ok: false as const, error: "errors.factory_save_failed" };
  }
  return { ok: true as const, data: mapRow(data as FactoryUserRow) };
}

export async function deleteFactoryUser(
  teamId: string,
  userId: string,
  factoryUserId: string,
) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const access = await assertFactoryAccess(admin, teamId, userId);
  if (!access.ok) return access;
  const { error } = await admin
    .from("team_factory_users")
    .delete()
    .eq("team_id", teamId)
    .eq("id", factoryUserId);
  if (error) {
    return { ok: false as const, error: "errors.factory_delete_failed" };
  }
  return { ok: true as const };
}

export type FactoryPresence = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  lastOnlineAt: string | null;
};

export async function listFactoryPresence(teamId: string, userId: string) {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false as const, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  const { data: adminRow } = await admin
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .maybeSingle();
  if (adminRow?.is_admin !== true) {
    const { data: member } = await admin
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) return { ok: false as const, error: "errors.factory_forbidden" };
  }
  const { data, error } = await admin
    .from("team_factory_users")
    .select("id, first_name, last_name, email, last_online_at")
    .eq("team_id", teamId)
    .order("first_name", { ascending: true });
  if (error) return { ok: false as const, error: "errors.factory_save_failed" };
  return {
    ok: true as const,
    data: ((data ?? []) as Array<{
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      last_online_at: string | null;
    }>).map((row) => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      lastOnlineAt: row.last_online_at,
    })),
  };
}

export async function touchFactoryUserOnline(factoryUserId: string) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  await admin
    .from("team_factory_users")
    .update({ last_online_at: new Date().toISOString() })
    .eq("id", factoryUserId);
}
