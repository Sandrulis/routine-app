import type { SupabaseClient } from "@supabase/supabase-js";
import { OWNER_TEAM_ROLE } from "@/app/lib/team";
import {
  normalizeTeamPermissionSet,
  type TeamActionPermissionKey,
} from "@/app/lib/team-permissions";

/** Server-side check: owner / system admin / role action. */
export async function assertTeamActionPermission(
  supabase: SupabaseClient,
  teamId: string,
  userId: string,
  action: TeamActionPermissionKey,
  forbiddenError: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const [{ data: member, error }, { data: adminRow }] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, role, role_id, team_roles ( permissions )")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("users").select("is_admin").eq("id", userId).maybeSingle(),
  ]);

  if (error || !member) {
    return { ok: false, error: forbiddenError };
  }
  if (adminRow?.is_admin === true || member.role === OWNER_TEAM_ROLE) {
    return { ok: true };
  }

  const roleRow = Array.isArray(member.team_roles)
    ? member.team_roles[0]
    : member.team_roles;
  const permissions = normalizeTeamPermissionSet(
    (roleRow as { permissions?: unknown } | null)?.permissions,
  );
  if (!permissions.actions[action]) {
    return { ok: false, error: forbiddenError };
  }
  return { ok: true };
}
