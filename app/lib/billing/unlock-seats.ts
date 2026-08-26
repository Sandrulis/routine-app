import { createNotificationId } from "@/app/lib/notifications";
import { sendTeamInviteEmail } from "@/app/lib/team/send-invite-email";
import { decryptSecret } from "@/app/lib/security/secret-box";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";
import {
  SEAT_STATUS_ACTIVE,
  SEAT_STATUS_PENDING_PAYMENT,
  resolveSeatCounts,
} from "@/app/lib/billing/seats";

type MemberRow = {
  id: string;
  email: string;
  name: string;
  user_id: string | null;
  seat_status: string | null;
  created_at: string;
};

type InvitationRow = {
  id: string;
  member_id: string;
  invited_user_id: string | null;
  invited_by_member_id: string;
  email: string;
  token: string | null;
  status: string;
};

export async function unlockPaidSeatsForTeam(teamId: string, paidSeatCount: number) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();

  const { data: memberRows, error: memberError } = await admin
    .from("team_members")
    .select("id, email, name, user_id, seat_status, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  if (memberError) {
    logError("unlockPaidSeatsForTeam members", memberError.message);
    return;
  }

  const members = (memberRows ?? []) as MemberRow[];
  const counts = resolveSeatCounts({
    paidSeatCount,
    members: members.map((row) => ({ seatStatus: row.seat_status })),
  });
  let remaining = counts.openSeatCount;
  if (remaining <= 0) return;

  const pending = members.filter(
    (row) => row.seat_status === SEAT_STATUS_PENDING_PAYMENT,
  );
  if (pending.length === 0) return;

  const { data: teamRow } = await admin
    .from("teams")
    .select("name")
    .eq("id", teamId)
    .maybeSingle();

  for (const member of pending) {
    if (remaining <= 0) break;

    const { error: updateError } = await admin
      .from("team_members")
      .update({ seat_status: SEAT_STATUS_ACTIVE })
      .eq("id", member.id)
      .eq("seat_status", SEAT_STATUS_PENDING_PAYMENT);

    if (updateError) {
      logError("unlockPaidSeatsForTeam update", updateError.message);
      continue;
    }
    remaining -= 1;

    const { data: invitation } = await admin
      .from("team_invitations")
      .select("id, member_id, invited_user_id, invited_by_member_id, email, token, status")
      .eq("member_id", member.id)
      .eq("status", "pending")
      .maybeSingle();

    const invite = invitation as InvitationRow | null;
    if (!invite) continue;

    const token = decryptSecret(invite.token ?? "") || invite.token || "";
    if (token) {
      await sendTeamInviteEmail({
        email: invite.email,
        token,
        teamName: teamRow?.name ?? "",
        inviterName: "",
        recipientName: member.name || undefined,
      });
    }

    if (invite.invited_user_id) {
      const { data: existing } = await admin
        .from("app_notifications")
        .select("id")
        .eq("invitation_id", invite.id)
        .maybeSingle();
      if (existing) {
        await admin
          .from("app_notifications")
          .update({ read_at: null })
          .eq("id", existing.id);
      } else {
        await admin.from("app_notifications").insert({
          id: createNotificationId(),
          team_id: teamId,
          kind: "team_invite",
          actor_id: invite.invited_by_member_id,
          recipient_id: member.id,
          target_user_id: invite.invited_user_id,
          invitation_id: invite.id,
          task_title: teamRow?.name ?? "",
          href: null,
          created_at: new Date().toISOString(),
          read_at: null,
        });
      }
    }
  }
}
