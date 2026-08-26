"use client";

import { useMemo, type ReactNode } from "react";
import {
  FrontendModulesProvider,
  useFrontendModules,
} from "@/app/lib/frontend-modules/context";
import { resolveTeamBillingAccess } from "@/app/lib/billing/team-access-state";
import {
  buildFreePlanIds,
  buildPlanModuleKeysMap,
  resolveEffectiveFrontendModuleKeys,
} from "@/app/lib/payment-plans/team-plan";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

type PaymentPlanModuleSnapshot = {
  id: string;
  moduleKeys: string[];
  isFree?: boolean;
};

export function TeamScopedFrontendModules({
  globalEnabledKeys,
  paymentPlansEnabled,
  plans,
  children,
}: {
  globalEnabledKeys: string[];
  paymentPlansEnabled: boolean;
  plans: PaymentPlanModuleSnapshot[];
  children: ReactNode;
}) {
  const { currentTeam, currentUser, roles } = useTeam();
  const { isAdmin } = useIsAdmin();
  const planModuleKeysByPlanId = useMemo(
    () => buildPlanModuleKeysMap(plans),
    [plans],
  );
  const freePlanIds = useMemo(() => buildFreePlanIds(plans), [plans]);
  const freePlanIdList = useMemo(() => [...freePlanIds], [freePlanIds]);

  const teamPlanForModules = useMemo(() => {
    if (!currentTeam) return null;
    const access = resolveTeamBillingAccess({
      paymentPlansEnabled,
      freePlanIds: freePlanIdList,
      team: currentTeam,
      currentUser,
      roles,
      isAdmin,
    });
    if (access.canUseAppDespiteUnpaid && access.subscriptionRequired) {
      return { ...currentTeam.paymentPlan, paid: true };
    }
    return currentTeam.paymentPlan;
  }, [
    currentTeam,
    currentUser,
    freePlanIdList,
    isAdmin,
    paymentPlansEnabled,
    roles,
  ]);

  const effectiveKeys = useMemo(
    () =>
      resolveEffectiveFrontendModuleKeys({
        globalEnabledKeys,
        paymentPlansEnabled,
        teamPlan: teamPlanForModules,
        planModuleKeysByPlanId,
        freePlanIds,
      }),
    [
      teamPlanForModules,
      globalEnabledKeys,
      paymentPlansEnabled,
      planModuleKeysByPlanId,
      freePlanIds,
    ],
  );

  return (
    <FrontendModulesProvider enabledKeys={effectiveKeys}>
      {children}
    </FrontendModulesProvider>
  );
}

/** Reads global module keys from the outer provider (marketing layout). */
export function MarketingTeamScopedFrontendModules({
  paymentPlansEnabled,
  plans,
  children,
}: {
  paymentPlansEnabled: boolean;
  plans: PaymentPlanModuleSnapshot[];
  children: ReactNode;
}) {
  const { enabledKeys } = useFrontendModules();
  return (
    <TeamScopedFrontendModules
      globalEnabledKeys={[...enabledKeys]}
      paymentPlansEnabled={paymentPlansEnabled}
      plans={plans}
    >
      {children}
    </TeamScopedFrontendModules>
  );
}
