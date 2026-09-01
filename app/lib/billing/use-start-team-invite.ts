"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { buyExtraTeamSeatAction } from "@/app/lib/billing/actions";
import { inviteRequiresPaidSeat } from "@/app/lib/billing/seats";
import { translateActionError } from "@/app/lib/i18n/action-errors";
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

function isInAppBillingReturn(url: string) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.pathname === "/team/billing" || parsed.pathname.startsWith("/team/billing/");
  } catch {
    return false;
  }
}

export function useStartTeamInvite() {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const freePlanIds = useFreePlanIds();
  const { isAdmin } = useIsAdmin();
  const { currentTeam, members, currentUser, roles, refreshTeams } = useTeam();
  const canInvite = canInviteTeamMembers(currentUser, roles, isAdmin);
  const canManageBilling = canEditTeamSettings(currentUser, roles, isAdmin);
  const [isPurchasingSeat, setIsPurchasingSeat] = useState(false);
  const [seatPurchasedOpen, setSeatPurchasedOpen] = useState(false);
  const pendingOpenModalRef = useRef<(() => void) | null>(null);
  const purchaseLockRef = useRef(false);

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
        isVip: currentTeam.isVip === true,
        paidSeatCount: currentTeam.paidSeatCount,
        members,
      }),
  );

  const startInvite = useCallback(
    (openModal: () => void) => {
      if (!canInvite || !currentTeam) return;
      if (purchaseLockRef.current || isPurchasingSeat) return;

      if (!requiresPayment) {
        openModal();
        return;
      }

      if (!canManageBilling) {
        showFeedback({
          type: "info",
          text: t(
            "errors.team_invite_pay_first",
            "Vispirms samaksā par vietu, tad uzaicini lietotāju.",
          ),
        });
        return;
      }

      purchaseLockRef.current = true;
      setIsPurchasingSeat(true);
      pendingOpenModalRef.current = openModal;

      void (async () => {
        try {
          const result = await buyExtraTeamSeatAction(currentTeam.id);
          if (!result.ok) {
            if (result.error === "errors.billing_open_seat_available") {
              await refreshTeams();
              openModal();
              return;
            }
            showFeedback({
              type: "error",
              text: translateActionError(t, result.error),
            });
            if (result.error === "errors.billing_no_subscription") {
              router.push("/team/billing");
            }
            return;
          }

          if (!isInAppBillingReturn(result.data.url)) {
            window.location.assign(result.data.url);
            return;
          }

          await refreshTeams();
          setSeatPurchasedOpen(true);
        } catch {
          showFeedback({
            type: "error",
            text: translateActionError(t, "errors.integrations_stripe_checkout_failed"),
          });
        } finally {
          purchaseLockRef.current = false;
          setIsPurchasingSeat(false);
        }
      })();
    },
    [
      canInvite,
      canManageBilling,
      currentTeam,
      isPurchasingSeat,
      refreshTeams,
      requiresPayment,
      router,
      showFeedback,
      t,
    ],
  );

  const confirmSeatPurchased = useCallback(() => {
    setSeatPurchasedOpen(false);
    const openModal = pendingOpenModalRef.current;
    pendingOpenModalRef.current = null;
    openModal?.();
  }, []);

  const onSeatPurchasedOpenChange = useCallback((open: boolean) => {
    setSeatPurchasedOpen(open);
    if (!open) {
      pendingOpenModalRef.current = null;
    }
  }, []);

  const handleInviteError = useCallback(
    (error: string) => {
      if (error === "errors.team_invite_pay_first" && canManageBilling) {
        router.push("/team/billing");
      }
    },
    [canManageBilling, router],
  );

  return {
    canInvite,
    startInvite,
    handleInviteError,
    isPurchasingSeat,
    seatPurchasedOpen,
    setSeatPurchasedOpen: onSeatPurchasedOpenChange,
    confirmSeatPurchased,
  };
}
