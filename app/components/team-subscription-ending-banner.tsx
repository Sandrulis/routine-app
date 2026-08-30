"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ResumeSubscriptionButton } from "@/app/components/resume-subscription-button";
import { useTranslations } from "@/app/components/translations-provider";
import { subscriptionCountdownParts } from "@/app/lib/billing/subscription-countdown";
import { resolveTeamBillingAccess } from "@/app/lib/billing/team-access-state";
import {
  useFreePlanIds,
  usePaymentPlansEnabled,
} from "@/app/lib/payment-plans/context";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

function countdownLabel(
  parts: ReturnType<typeof subscriptionCountdownParts>,
  t: (key: string, fallback: string, params?: Record<string, string>) => string,
) {
  if (parts.expired) {
    return t("team.billing.subscription_ending_expired", "Drīz beigsies");
  }
  return t(
    "team.billing.subscription_ending_countdown",
    "{months} m {days} d {hours} h {minutes} min",
    {
      months: String(parts.months),
      days: String(parts.days),
      hours: String(parts.hours),
      minutes: String(parts.minutes),
    },
  );
}

export function TeamSubscriptionEndingBanner() {
  const { t } = useTranslations();
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const freePlanIds = useFreePlanIds();
  const { isAdmin } = useIsAdmin();
  const { currentTeam, currentUser, roles, isReady } = useTeam();
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (!isReady || !currentTeam?.subscriptionCancelAtPeriodEnd) return null;
  if (currentTeam.isVip) return null;

  const access = resolveTeamBillingAccess({
    paymentPlansEnabled,
    freePlanIds,
    team: currentTeam,
    currentUser,
    roles,
    isAdmin,
  });

  if (!access.canManageBilling) return null;

  const parts = subscriptionCountdownParts(currentTeam.billingPeriodEndAt, nowMs);

  return (
    <div className="px-4 pt-4 pl-[var(--app-content-inset-left)] md:pr-6">
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        <p className="min-w-0 flex-1">
          {t(
            "team.billing.subscription_ending_banner",
            "Abonements beidzas pēc {countdown}. Pēc termiņa pārējie komandas lietotāji nevarēs lietot sistēmu.",
            { countdown: countdownLabel(parts, t) },
          )}
        </p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3">
          <ResumeSubscriptionButton />
          <Link
            href="/team/billing"
            className="font-semibold text-amber-950 underline decoration-amber-300 underline-offset-2 hover:decoration-amber-600"
          >
            {t("team.billing.members_blocked_banner_action", "Abonementi")}
          </Link>
        </div>
      </div>
    </div>
  );
}
