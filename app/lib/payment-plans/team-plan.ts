import type { TeamPaymentPlanState } from "@/app/lib/team";

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isTeamPaymentPlanActive(
  plan: TeamPaymentPlanState | null | undefined,
  todayIso: string = todayIsoDate(),
  options?: { isFree?: boolean },
): boolean {
  if (!plan?.planId) {
    return false;
  }
  if (options?.isFree) {
    return true;
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
  freePlanIds?: ReadonlySet<string>;
  todayIso?: string;
  isVip?: boolean;
}): string[] {
  const globalKeys = [...input.globalEnabledKeys];

  if (!input.paymentPlansEnabled || input.isVip === true) {
    return globalKeys;
  }

  const isFree = Boolean(
    input.teamPlan?.planId && input.freePlanIds?.has(input.teamPlan.planId),
  );
  if (!isTeamPaymentPlanActive(input.teamPlan, input.todayIso, { isFree })) {
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

export function buildFreePlanIds(
  plans: Array<{ id: string; isFree?: boolean }>,
): Set<string> {
  return new Set(
    plans.filter((plan) => plan.isFree === true).map((plan) => plan.id),
  );
}
