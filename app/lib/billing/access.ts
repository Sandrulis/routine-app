import { createClient } from "@/app/lib/supabase/server";
import { OWNER_TEAM_ROLE } from "@/app/lib/team";
import { normalizeTeamPermissionSet } from "@/app/lib/team-permissions";

export async function assertCanManageTeamBilling(teamId: string, userId: string) {
  const supabase = await createClient();
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
    return { ok: false as const, error: "errors.billing_forbidden" };
  }
  if (adminRow?.is_admin === true || member.role === OWNER_TEAM_ROLE) {
    return { ok: true as const };
  }

  const roleRow = Array.isArray(member.team_roles)
    ? member.team_roles[0]
    : member.team_roles;
  const permissions = normalizeTeamPermissionSet(roleRow?.permissions);
  if (permissions.actions["team.settings.edit"]) {
    return { ok: true as const };
  }
  return { ok: false as const, error: "errors.billing_forbidden" };
}
