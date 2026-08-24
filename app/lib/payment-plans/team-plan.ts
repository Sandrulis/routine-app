import type { TeamPaymentPlanState } from "@/app/lib/team";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isTeamPaymentPlanActive(
  plan: TeamPaymentPlanState | null | undefined,
  todayIso: string = todayIsoDate(),
): boolean {
  if (!plan?.planId) {
    return false;
  }
  if (!plan.isTrial && !plan.paid) {
    return false;
  }
  const until = plan.until?.trim() ?? "";
  if (until && until < todayIso) {
    return false;
  }
  return true;
}

export function resolveEffectiveFrontendModuleKeys(input: {
  globalEnabledKeys: Iterable<string>;
  paymentPlansEnabled: boolean;
  teamPlan: TeamPaymentPlanState | null | undefined;
  planModuleKeysByPlanId: ReadonlyMap<string, readonly string[]>;
  todayIso?: string;
}): string[] {
  const globalKeys = [...input.globalEnabledKeys];

  if (!input.paymentPlansEnabled) {
    return globalKeys;
  }

  if (!isTeamPaymentPlanActive(input.teamPlan, input.todayIso)) {
    return [];
  }

  const planId = input.teamPlan?.planId;
  if (!planId) {
    return [];
  }

  const planModules = new Set(input.planModuleKeysByPlanId.get(planId) ?? []);
  return globalKeys.filter((key) => planModules.has(key));
}

export function buildPlanModuleKeysMap(
  plans: Array<{ id: string; moduleKeys: string[] }>,
): Map<string, string[]> {
  return new Map(plans.map((plan) => [plan.id, [...plan.moduleKeys]]));
}
