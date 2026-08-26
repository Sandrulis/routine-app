"use client";

import Link from "next/link";
import { useTranslations } from "@/app/components/translations-provider";
import { resolveTeamBillingAccess } from "@/app/lib/billing/team-access-state";
import {
  useFreePlanIds,
  usePaymentPlansEnabled,
} from "@/app/lib/payment-plans/context";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function TeamPlanInactiveBanner() {
  const { t } = useTranslations();
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const freePlanIds = useFreePlanIds();
  const { isAdmin } = useIsAdmin();
  const { currentTeam, currentUser, roles, isReady } = useTeam();

  if (!isReady || !currentTeam) return null;

  const access = resolveTeamBillingAccess({
    paymentPlansEnabled,
    freePlanIds,
    team: currentTeam,
    currentUser,
    roles,
    isAdmin,
  });

  if (!access.showManagerBlockedBanner) return null;

  return (
    <div className="px-4 pt-4 pl-[var(--app-content-inset-left)] md:pr-6">
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-950"
      >
        <p className="min-w-0 flex-1">
          {t(
            "team.billing.members_blocked_banner",
            "Pārējie komandas lietotāji nevar lietot sistēmu, jo nav apmaksāts abonements.",
          )}
        </p>
        <Link
          href="/team/billing"
          className="shrink-0 font-semibold text-red-950 underline decoration-red-300 underline-offset-2 hover:decoration-red-500"
        >
          {t("team.billing.members_blocked_banner_action", "Abonementi")}
        </Link>
      </div>
    </div>
  );
}
