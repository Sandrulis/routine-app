"use client";

import { useMemo, type ReactNode } from "react";
import {
  FrontendModulesProvider,
  useFrontendModules,
} from "@/app/lib/frontend-modules/context";
import {
  buildPlanModuleKeysMap,
  resolveEffectiveFrontendModuleKeys,
} from "@/app/lib/payment-plans/team-plan";
import { useTeam } from "@/app/lib/team-store";

type PaymentPlanModuleSnapshot = {
  id: string;
  moduleKeys: string[];
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
  const { currentTeam } = useTeam();
  const planModuleKeysByPlanId = useMemo(
    () => buildPlanModuleKeysMap(plans),
    [plans],
  );

  const effectiveKeys = useMemo(
    () =>
      resolveEffectiveFrontendModuleKeys({
        globalEnabledKeys,
        paymentPlansEnabled,
        teamPlan: currentTeam?.paymentPlan,
        planModuleKeysByPlanId,
      }),
    [
      currentTeam?.paymentPlan,
      globalEnabledKeys,
      paymentPlansEnabled,
      planModuleKeysByPlanId,
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
