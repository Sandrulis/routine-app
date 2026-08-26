"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { inviteRequiresPaidSeat } from "@/app/lib/billing/seats";
import {
  useFreePlanIds,
  usePaymentPlansEnabled,
} from "@/app/lib/payment-plans/context";
import { isTeamPaymentPlanActive } from "@/app/lib/payment-plans/team-plan";
import {
  canEditTeamSettings,
  canInviteTeamMembers,
} from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function useStartTeamInvite() {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const freePlanIds = useFreePlanIds();
  const { isAdmin } = useIsAdmin();
  const { currentTeam, members, currentUser, roles } = useTeam();
  const canInvite = canInviteTeamMembers(currentUser, roles, isAdmin);
  const canManageBilling = canEditTeamSettings(currentUser, roles, isAdmin);

  const requiresPayment = Boolean(
    currentTeam &&
      inviteRequiresPaidSeat({
        paymentPlansEnabled,
        isFreePlan: Boolean(
          currentTeam.paymentPlan.planId &&
            freePlanIds.includes(currentTeam.paymentPlan.planId),
        ),
        isTrialActive:
          currentTeam.paymentPlan.isTrial &&
          isTeamPaymentPlanActive(currentTeam.paymentPlan),
        paidSeatCount: currentTeam.paidSeatCount,
        members,
      }),
  );

  const startInvite = useCallback(
    (openModal: () => void) => {
      if (!canInvite) return;
      if (requiresPayment) {
        showFeedback({
          type: "info",
          text: t(
            "errors.team_invite_pay_first",
            "Vispirms samaksā par vietu, tad uzaicini lietotāju.",
          ),
        });
        if (canManageBilling) {
          router.push("/team/billing");
        }
        return;
      }
      openModal();
    },
    [canInvite, canManageBilling, requiresPayment, router, showFeedback, t],
  );

  const handleInviteError = useCallback(
    (error: string) => {
      if (error === "errors.team_invite_pay_first" && canManageBilling) {
        router.push("/team/billing");
      }
    },
    [canManageBilling, router],
  );

  return { canInvite, startInvite, handleInviteError };
}
