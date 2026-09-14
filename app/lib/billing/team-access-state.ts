import { INCLUDED_FREE_SEATS } from "@/app/lib/billing/seats";
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
  /** Komandas vadītājs — redz saturu bez paywall (viena bezmaksas vieta). */
  canUseAppDespiteUnpaid: boolean;
  /** Var redzēt vadītāja brīdinājumu un iet uz /team/billing. */
  canManageBilling: boolean;
  /** Parastam komandas lietotājam — blur + bloķējošs modālis. */
  memberBlocked: boolean;
  /** Vadītājam — sarkanais globālais baneris. */
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
  /** Apstiprinātie komandas lietotāji (ar userId), ieskaitot pending_payment vietas. */
  members?: ReadonlyArray<Pick<TeamMember, "userId">>;
}): TeamBillingAccessState {
  const canManageBilling = canEditTeamSettings(
    input.currentUser,
    input.roles,
    input.isAdmin,
  );
  const isLeader = isTeamOwner(input.currentUser, input.roles);
  const canUseAppDespiteUnpaid = isLeader;

  if (input.team?.isVip === true) {
    return {
      subscriptionRequired: false,
      canUseAppDespiteUnpaid,
      canManageBilling,
      memberBlocked: false,
      showManagerBlockedBanner: false,
    };
  }

  if (!input.paymentPlansEnabled || !input.team) {
    return {
      subscriptionRequired: false,
      canUseAppDespiteUnpaid,
      canManageBilling,
      memberBlocked: false,
      showManagerBlockedBanner: false,
    };
  }

  const isFreePlan = Boolean(
    input.team.paymentPlan.planId &&
      input.freePlanIds.includes(input.team.paymentPlan.planId),
  );
  if (isFreePlan) {
    return {
      subscriptionRequired: false,
      canUseAppDespiteUnpaid,
      canManageBilling,
      memberBlocked: false,
      showManagerBlockedBanner: false,
    };
  }

  const planActive = isTeamPaymentPlanActive(
    input.team.paymentPlan,
    input.todayIso,
    { isFree: false },
  );
  const confirmedCount = (input.members ?? []).filter((member) =>
    Boolean(member.userId?.trim()),
  ).length;
  const hasExtraUsers = confirmedCount > INCLUDED_FREE_SEATS;
  const subscriptionRequired =
    !planActive && (hasExtraUsers || !canUseAppDespiteUnpaid);
  const memberBlocked = subscriptionRequired && !canUseAppDespiteUnpaid;
  const showManagerBlockedBanner = subscriptionRequired && isLeader;

  return {
    subscriptionRequired,
    canUseAppDespiteUnpaid,
    canManageBilling,
    memberBlocked,
    showManagerBlockedBanner,
  };
}
