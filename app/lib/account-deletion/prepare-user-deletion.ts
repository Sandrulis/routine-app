import type { SupabaseClient } from "@supabase/supabase-js";
import { OWNER_TEAM_ROLE } from "@/app/lib/team";

type TeamMemberRow = {
  user_id: string | null;
  role: string;
};

export async function prepareUserForAccountDeletion(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("created_by", userId);

  if (teamsError) {
    throw teamsError;
  }

  for (const team of teams ?? []) {
    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select("user_id, role")
      .eq("team_id", team.id)
      .not("user_id", "is", null)
      .neq("user_id", userId);

    if (membersError) {
      throw membersError;
    }

    const successorUserId = pickTeamSuccessorUserId(members ?? []);
    if (successorUserId) {
      const { error: transferError } = await supabase
        .from("teams")
        .update({ created_by: successorUserId })
        .eq("id", team.id);
      if (transferError) {
        throw transferError;
      }
      continue;
    }

    const { error: deleteError } = await supabase
      .from("teams")
      .delete()
      .eq("id", team.id);
    if (deleteError) {
      throw deleteError;
    }
  }
}

function pickTeamSuccessorUserId(members: TeamMemberRow[]): string | null {
  const linked = members.filter(
    (member): member is TeamMemberRow & { user_id: string } =>
      typeof member.user_id === "string" && member.user_id.length > 0,
  );
  if (linked.length === 0) {
    return null;
  }

  const owner = linked.find((member) => member.role === OWNER_TEAM_ROLE);
  return (owner ?? linked[0]).user_id;
}
