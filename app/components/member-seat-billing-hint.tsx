"use client";

import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  resolveMemberSeatBillingHint,
  type MemberSeatBillingHint,
} from "@/app/lib/billing/member-seat-billing-hint";
import { formatInteger } from "@/app/lib/format/numbers";
import {
  isTeamOwner,
  type TeamMember,
  type TeamRole,
  type WorkTeam,
} from "@/app/lib/team";

function hintLabel(
  hint: MemberSeatBillingHint,
  t: (key: string, fallback: string, params?: Record<string, string>) => string,
  formatDate: (value: string) => string,
): string {
  switch (hint.kind) {
    case "free_owner":
      return t("team.seat.free_owner", "Bezmaksas vieta (vadītājs)");
    case "awaiting_payment":
      return t("team.seat.awaiting_payment", "Gaida vietas samaksu");
    case "awaiting_accept":
      return t("team.seat.awaiting_accept", "Gaida apstiprinājumu");
    case "trial_until":
      return t("team.seat.trial_until", "Izmēģinājums līdz {until}", {
        until: formatDate(hint.until),
      });
    case "subscribed_until":
      if (hint.period === "year") {
        return t(
          "team.seat.subscribed_until_year",
          "Abonēts līdz {until} (gads)",
          { until: formatDate(hint.until) },
        );
      }
      if (hint.period === "month") {
        return t(
          "team.seat.subscribed_until_month",
          "Abonēts līdz {until} (mēnesis)",
          { until: formatDate(hint.until) },
        );
      }
      return t("team.seat.subscribed_until", "Abonēts līdz {until}", {
        until: formatDate(hint.until),
      });
  }
}

export function MemberSeatBillingHintLine({
  member,
  roles,
  team,
  isFreePlan,
  paymentPlansEnabled,
  viewer,
}: {
  member: TeamMember;
  roles: TeamRole[];
  team: WorkTeam;
  isFreePlan: boolean;
  paymentPlansEnabled: boolean;
  viewer: TeamMember;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();

  if (!paymentPlansEnabled || !isTeamOwner(viewer, roles)) {
    return null;
  }

  const hint = resolveMemberSeatBillingHint({
    member,
    roles,
    team,
    isFreePlan,
    paymentPlansEnabled,
  });
  if (!hint) return null;

  return (
    <p className="mt-0.5 text-xs text-zinc-500">{hintLabel(hint, t, formatDate)}</p>
  );
}

export function TeamOpenSeatsBillingHint({
  team,
  roles,
  viewer,
  isFreePlan,
  paymentPlansEnabled,
  openSeatCount,
}: {
  team: WorkTeam;
  roles: TeamRole[];
  viewer: TeamMember;
  isFreePlan: boolean;
  paymentPlansEnabled: boolean;
  openSeatCount: number;
}) {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();

  if (
    !paymentPlansEnabled ||
    isFreePlan ||
    !isTeamOwner(viewer, roles) ||
    !team.paymentPlan.paid ||
    openSeatCount <= 0
  ) {
    return null;
  }

  const until = team.billingCycleEnd?.trim() || "";
  const count = formatInteger(openSeatCount);
  const label =
    openSeatCount === 1
      ? until
        ? t(
            "team.seat.open_one_until",
            "1 brīva apmaksāta vieta līdz {until}",
            { until: formatDate(until) },
          )
        : t("team.seat.open_one", "1 brīva apmaksāta vieta")
      : until
        ? t(
            "team.seat.open_many_until",
            "{count} brīvas apmaksātas vietas līdz {until}",
            { count, until: formatDate(until) },
          )
        : t(
            "team.seat.open_many",
            "{count} brīvas apmaksātas vietas",
            { count },
          );

  return (
    <div className="rounded-2xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-xs text-amber-950">
      {label}
    </div>
  );
}
