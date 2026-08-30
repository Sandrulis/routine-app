import {
  isAwaitingPaymentSeat,
  isMemberTeamOwner,
  isPendingTeamMember,
  type TeamMember,
  type TeamRole,
  type WorkTeam,
} from "@/app/lib/team";

export type MemberSeatBillingHint =
  | { kind: "free_owner" }
  | { kind: "awaiting_payment" }
  | { kind: "awaiting_accept" }
  | { kind: "trial_until"; until: string }
  | {
      kind: "subscribed_until";
      until: string;
      period: "month" | "year" | "quarter" | null;
    };

function parseBillingPeriod(value: unknown): "month" | "year" | "quarter" | null {
  if (value === "year" || value === "quarter" || value === "month") {
    return value;
  }
  return null;
}

export function resolveMemberSeatBillingHint(input: {
  member: TeamMember;
  roles: TeamRole[];
  team: WorkTeam;
  isFreePlan: boolean;
  paymentPlansEnabled: boolean;
}): MemberSeatBillingHint | null {
  if (!input.paymentPlansEnabled || input.isFreePlan || input.team.isVip) return null;
  if (!input.team.paymentPlan.planId) return null;

  if (isAwaitingPaymentSeat(input.member)) {
    return { kind: "awaiting_payment" };
  }
  if (isPendingTeamMember(input.member)) {
    return { kind: "awaiting_accept" };
  }
  if (isMemberTeamOwner(input.member, input.roles)) {
    return { kind: "free_owner" };
  }

  const plan = input.team.paymentPlan;
  if (plan.isTrial) {
    const until = plan.until?.trim() || input.team.billingCycleEnd?.trim() || "";
    if (until) {
      return { kind: "trial_until", until };
    }
    return null;
  }

  if (!plan.paid) return null;

  const until = input.team.billingCycleEnd?.trim() || plan.until?.trim() || "";
  if (!until) return null;

  return {
    kind: "subscribed_until",
    until,
    period: parseBillingPeriod(input.team.billingPeriod),
  };
}
