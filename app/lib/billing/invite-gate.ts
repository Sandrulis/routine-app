import {
  nextInviteSeatStatus,
  resolveSeatCounts,
  type SeatStatus,
} from "@/app/lib/billing/seats";
import { loadTeamBillingRow, loadTeamMembersForSeats } from "@/app/lib/billing/subscription";
import { isStripeEnabled } from "@/app/lib/integrations/stripe/client";
import {
  isPaymentPlansEnabled,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import { isTeamPaymentPlanActive } from "@/app/lib/payment-plans/team-plan";

export async function resolveInviteSeatDecision(teamId: string): Promise<
  | { ok: true; seatStatus: SeatStatus }
  | { ok: false; error: string }
> {
  const plansEnabled = await isPaymentPlansEnabled();
  if (!plansEnabled) {
    return { ok: true, seatStatus: "active" };
  }

  const [team, members, plans, stripeEnabled] = await Promise.all([
    loadTeamBillingRow(teamId),
    loadTeamMembersForSeats(teamId),
    listPaymentPlans(),
    isStripeEnabled(),
  ]);

  if (!team) {
    return { ok: false, error: "errors.team_invite_failed" };
  }

  const plan = plans.find((item) => item.id === team.payment_plan_id) ?? null;
  const counts = resolveSeatCounts({
    paidSeatCount: team.paid_seat_count ?? 0,
    members: members.map((row) => ({ seatStatus: row.seat_status })),
  });

  if (plan?.isFree) {
    const maxMembers = plan.maxMembers ?? 0;
    if (maxMembers > 0 && counts.occupiedSeatCount >= maxMembers) {
      return { ok: false, error: "errors.team_invite_seat_limit" };
    }
    return { ok: true, seatStatus: "active" };
  }

  if (team.payment_plan_is_trial === true && isTeamPaymentPlanActive({
    planId: team.payment_plan_id,
    until: team.payment_plan_until,
    paid: team.payment_plan_paid === true,
    isTrial: true,
    isEarlyBird: team.payment_plan_is_early_bird === true,
  })) {
    return { ok: true, seatStatus: "active" };
  }

  if (!stripeEnabled) {
    return { ok: true, seatStatus: "active" };
  }

  if (nextInviteSeatStatus(counts) === "pending_payment") {
    return { ok: false, error: "errors.team_invite_pay_first" };
  }

  return { ok: true, seatStatus: "active" };
}
