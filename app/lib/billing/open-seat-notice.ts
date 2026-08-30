import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";
import { resolveSeatCounts } from "@/app/lib/billing/seats";
import {
  createNotificationId,
  type AppNotification,
} from "@/app/lib/notifications";
import { OWNER_TEAM_ROLE } from "@/app/lib/team";
import { normalizeTeamPermissionSet } from "@/app/lib/team-permissions";

type ManagerRow = {
  id: string;
  user_id: string | null;
  role: string;
  team_roles?: { permissions: unknown } | { permissions: unknown }[] | null;
};

export function isTeamManager(row: ManagerRow) {
  if (row.role === OWNER_TEAM_ROLE) return true;
  const roleRow = Array.isArray(row.team_roles)
    ? row.team_roles[0]
    : row.team_roles;
  const permissions = normalizeTeamPermissionSet(roleRow?.permissions);
  return permissions.actions["team.settings.edit"] === true;
}

export async function notifyOpenPaidSeats(teamId: string) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();

  const [{ data: team, error: teamError }, { data: members, error: memberError }] =
    await Promise.all([
      admin
        .from("teams")
        .select("paid_seat_count, billing_cycle_end, payment_plan_paid, is_vip")
        .eq("id", teamId)
        .maybeSingle(),
      admin
        .from("team_members")
        .select("id, user_id, role, role_id, seat_status, team_roles ( permissions )")
        .eq("team_id", teamId),
    ]);

  if (teamError) {
    logError("notifyOpenPaidSeats.team", teamError.message);
    return;
  }
  if (memberError) {
    logError("notifyOpenPaidSeats.members", memberError.message);
    return;
  }
  if (!team || team.payment_plan_paid !== true || team.is_vip === true) return;

  const counts = resolveSeatCounts({
    paidSeatCount: team.paid_seat_count ?? 0,
    members: (members ?? []).map((row) => ({ seatStatus: row.seat_status })),
  });
  if (counts.openSeatCount <= 0) return;

  const until =
    typeof team.billing_cycle_end === "string"
      ? team.billing_cycle_end.slice(0, 10)
      : "";
  const now = new Date().toISOString();
  const managers = ((members ?? []) as ManagerRow[]).filter(
    (row) => row.user_id && isTeamManager(row),
  );
  if (managers.length === 0) return;

  const userIds = [
    ...new Set(managers.map((row) => row.user_id).filter((id): id is string => Boolean(id))),
  ];
  const { data: prefRows, error: prefError } = await admin
    .from("user_notification_preferences")
    .select("user_id, kind, enabled")
    .eq("kind", "seat_open")
    .in("user_id", userIds);
  if (prefError) {
    logError("notifyOpenPaidSeats.prefs", prefError.message);
  }
  const disabled = new Set(
    (prefRows ?? [])
      .filter((row) => row.enabled === false)
      .map((row) => row.user_id as string),
  );

  const items: AppNotification[] = managers.flatMap((row) => {
    const userId = row.user_id;
    if (!userId || disabled.has(userId)) return [];
    return [
      {
        id: createNotificationId(),
        kind: "seat_open" as const,
        actorId: null,
        recipientId: row.id,
        targetUserId: userId,
        invitationId: null,
        taskTitle: until,
        href: "/team/billing",
        createdAt: now,
        readAt: null,
      },
    ];
  });
  if (items.length === 0) return;

  const { error: insertError } = await admin.from("app_notifications").insert(
    items.map((item) => ({
      id: item.id,
      team_id: teamId,
      kind: item.kind,
      actor_id: item.actorId,
      recipient_id: item.recipientId,
      target_user_id: item.targetUserId,
      invitation_id: item.invitationId,
      task_title: item.taskTitle,
      href: item.href,
      created_at: item.createdAt,
      read_at: item.readAt,
    })),
  );
  if (insertError) {
    logError("notifyOpenPaidSeats.insert", insertError.message);
  }
}
