import {
  billableSeatCount,
  countOccupiedSeats,
} from "@/app/lib/billing/seats";
import { isTeamManager } from "@/app/lib/billing/open-seat-notice";
import {
  loadTeamMembersForSeats,
} from "@/app/lib/billing/subscription";
import {
  createNotificationId,
  type AppNotification,
} from "@/app/lib/notifications";
import {
  claimEarlyBirdSeats,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import { isTeamPaymentPlanActive } from "@/app/lib/payment-plans/team-plan";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

type TeamRow = {
  id: string;
  payment_plan_id: string | null;
  payment_plan_until: string | null;
  payment_plan_paid: boolean | null;
  payment_plan_is_trial: boolean | null;
  payment_plan_is_early_bird: boolean | null;
  early_bird_seat_count: number | null;
  stripe_subscription_id: string | null;
  billing_cycle_end: string | null;
  is_vip?: boolean | null;
};

export function endOfCurrentUtcMonthIso(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10);
}

export async function notifyTeamsPaymentPlansEnabled() {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  const plans = await listPaymentPlans();
  const freePlanIds = new Set(plans.filter((plan) => plan.isFree).map((plan) => plan.id));
  const until = endOfCurrentUtcMonthIso();

  const { data: teams, error: teamsError } = await admin
    .from("teams")
    .select(
      "id, payment_plan_id, payment_plan_until, payment_plan_paid, payment_plan_is_trial, payment_plan_is_early_bird, early_bird_seat_count, stripe_subscription_id, billing_cycle_end, is_vip",
    );
  if (teamsError) {
    logError("notifyTeamsPaymentPlansEnabled.teams", teamsError.message);
    return;
  }

  for (const team of (teams ?? []) as TeamRow[]) {
    await prepareTeamForPaidPlans(admin, team, freePlanIds, until);
  }
}

async function prepareTeamForPaidPlans(
  admin: ReturnType<typeof createAdminClient>,
  team: TeamRow,
  freePlanIds: Set<string>,
  until: string,
) {
  if (team.stripe_subscription_id) return;
  if (team.is_vip === true) return;
  if (team.payment_plan_id && freePlanIds.has(team.payment_plan_id)) return;
  if (
    team.payment_plan_is_trial === true &&
    isTeamPaymentPlanActive({
      planId: team.payment_plan_id,
      until: team.payment_plan_until,
      paid: team.payment_plan_paid === true,
      isTrial: true,
      isEarlyBird: team.payment_plan_is_early_bird === true,
    })
  ) {
    return;
  }

  const members = await loadTeamMembersForSeats(team.id);
  const occupied = countOccupiedSeats(
    members.map((row) => ({ seatStatus: row.seat_status })),
  );
  if (occupied <= 1) return;

  const billable = billableSeatCount(occupied);
  const alreadyEarlyBird = Math.max(0, team.early_bird_seat_count ?? 0);
  const need = Math.max(0, billable - alreadyEarlyBird);
  const claimed = need > 0 ? await claimEarlyBirdSeats(need) : 0;
  const nextEarlyBird = alreadyEarlyBird + claimed;
  const cycleEnd =
    typeof team.billing_cycle_end === "string" && team.billing_cycle_end.trim()
      ? team.billing_cycle_end.trim().slice(0, 10)
      : until;

  const { error: updateError } = await admin
    .from("teams")
    .update({
      early_bird_seat_count: nextEarlyBird,
      payment_plan_is_early_bird: nextEarlyBird > 0,
      billing_cycle_end: cycleEnd,
    })
    .eq("id", team.id);
  if (updateError) {
    logError("notifyTeamsPaymentPlansEnabled.update", updateError.message);
  }

  await notifyTeamBillingDue(admin, team.id, cycleEnd);
}

async function notifyTeamBillingDue(
  admin: ReturnType<typeof createAdminClient>,
  teamId: string,
  until: string,
) {
  const { data: members, error: memberError } = await admin
    .from("team_members")
    .select("id, user_id, role, team_roles ( permissions )")
    .eq("team_id", teamId);
  if (memberError) {
    logError("notifyTeamsPaymentPlansEnabled.members", memberError.message);
    return;
  }

  type ManagerRow = {
    id: string;
    user_id: string | null;
    role: string;
    team_roles?: { permissions: unknown } | { permissions: unknown }[] | null;
  };
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
    .eq("kind", "billing_due")
    .in("user_id", userIds);
  if (prefError) {
    logError("notifyTeamsPaymentPlansEnabled.prefs", prefError.message);
  }
  const disabled = new Set(
    (prefRows ?? [])
      .filter((row) => row.enabled === false)
      .map((row) => row.user_id as string),
  );

  const now = new Date().toISOString();
  const items: AppNotification[] = managers.flatMap((row) => {
    const userId = row.user_id;
    if (!userId || disabled.has(userId)) return [];
    return [
      {
        id: createNotificationId(),
        kind: "billing_due" as const,
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
    logError("notifyTeamsPaymentPlansEnabled.insert", insertError.message);
  }
}
