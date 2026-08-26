import { isTeamPaymentPlanActive } from "@/app/lib/payment-plans/team-plan";
import {
  canEditTeamSettings,
  isTeamOwner,
  type TeamMember,
  type TeamRole,
  type WorkTeam,
} from "@/app/lib/team";

export type TeamBillingAccessState = {
  /** Maksas plāni ieslēgti un komandai nav aktīva maksas/trial piekļuve (nav bezmaksas plāns). */
  subscriptionRequired: boolean;
  /** Īpašnieks vai sistēmas admins — redz saturu bez paywall. */
  canUseAppDespiteUnpaid: boolean;
  /** Var redzēt vadītāja brīdinājumu un iet uz /team/billing. */
  canManageBilling: boolean;
  /** Parastam komandas lietotājam — blur + bloķējošs modālis. */
  memberBlocked: boolean;
  /** Vadītājam/adminam — sarkanais globālais baneris. */
  showManagerBlockedBanner: boolean;
};

export function resolveTeamBillingAccess(input: {
  paymentPlansEnabled: boolean;
  freePlanIds: readonly string[];
  team: WorkTeam | null;
  currentUser: TeamMember;
  roles: TeamRole[];
  isAdmin: boolean;
  todayIso?: string;
}): TeamBillingAccessState {
  const canManageBilling = canEditTeamSettings(
    input.currentUser,
    input.roles,
    input.isAdmin,
  );
  const canUseAppDespiteUnpaid =
    input.isAdmin ||
    isTeamOwner(input.currentUser, input.roles) ||
    canManageBilling;

  if (!input.paymentPlansEnabled || !input.team?.paymentPlan.planId) {
    return {
      subscriptionRequired: false,
      canUseAppDespiteUnpaid,
      canManageBilling,
      memberBlocked: false,
      showManagerBlockedBanner: false,
    };
  }

  const isFreePlan = input.freePlanIds.includes(input.team.paymentPlan.planId);
  const planActive = isTeamPaymentPlanActive(input.team.paymentPlan, input.todayIso, {
    isFree: isFreePlan,
  });
  const subscriptionRequired = !isFreePlan && !planActive;
  const memberBlocked = subscriptionRequired && !canUseAppDespiteUnpaid;
  const showManagerBlockedBanner =
    subscriptionRequired &&
    (isTeamOwner(input.currentUser, input.roles) || canManageBilling);

  return {
    subscriptionRequired,
    canUseAppDespiteUnpaid,
    canManageBilling,
    memberBlocked,
    showManagerBlockedBanner,
  };
}
