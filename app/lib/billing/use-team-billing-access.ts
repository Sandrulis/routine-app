"use client";

import { useMemo } from "react";
import {
  resolveTeamBillingAccess,
  type TeamBillingAccessState,
} from "@/app/lib/billing/team-access-state";
import {
  useFreePlanIds,
  usePaymentPlansEnabled,
} from "@/app/lib/payment-plans/context";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function useTeamBillingAccess(): TeamBillingAccessState & {
  isReady: boolean;
} {
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const freePlanIds = useFreePlanIds();
  const { isAdmin } = useIsAdmin();
  const { currentTeam, currentUser, roles, isReady } = useTeam();

  const access = useMemo(
    () =>
      resolveTeamBillingAccess({
        paymentPlansEnabled,
        freePlanIds,
        team: currentTeam,
        currentUser,
        roles,
        isAdmin,
      }),
    [currentTeam, currentUser, freePlanIds, isAdmin, paymentPlansEnabled, roles],
  );

  return { ...access, isReady };
}
