"use client";

import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { resolveSeatCounts } from "@/app/lib/billing/seats";
import { formatInteger } from "@/app/lib/format/numbers";
import { usePaymentPlansEnabled } from "@/app/lib/payment-plans/context";
import {
  canEditTeamSettings,
  canInviteTeamMembers,
  REQUEST_TEAM_INVITE_EVENT,
} from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function OpenPaidSeatBanner() {
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const { isAdmin } = useIsAdmin();
  const { currentTeam, members, currentUser, roles, isReady } = useTeam();

  if (!isReady || !paymentPlansEnabled || !currentTeam) return null;
  if (!canEditTeamSettings(currentUser, roles, isAdmin)) return null;
  if (!currentTeam.paymentPlan.paid) return null;
  const canInvite = canInviteTeamMembers(currentUser, roles, isAdmin);

  const counts = resolveSeatCounts({
    paidSeatCount: currentTeam.paidSeatCount,
    members,
  });
  if (counts.openSeatCount <= 0) return null;

  const until = currentTeam.billingCycleEnd
    ? formatDate(currentTeam.billingCycleEnd)
    : "";
  const count = formatInteger(counts.openSeatCount);
  const message = until
    ? t(
        "team.billing.open_seat_banner_until",
        "Komandā ir {count} brīva apmaksāta vieta līdz {until}. Tās vietā var uzaicināt citu lietotāju.",
        { count, until },
      )
    : t(
        "team.billing.open_seat_banner",
        "Komandā ir {count} brīva apmaksāta vieta. Tās vietā var uzaicināt citu lietotāju.",
        { count },
      );

  return (
    <div className="px-4 pt-4 pl-[var(--app-content-inset-left)] md:pr-6">
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
      >
        <p className="min-w-0 flex-1">{message}</p>
        {canInvite ? (
          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new Event(REQUEST_TEAM_INVITE_EVENT));
            }}
            className="shrink-0 font-medium text-amber-950 underline decoration-amber-300 underline-offset-2 hover:decoration-amber-500"
          >
            {t("team.billing.open_seat_invite", "Uzaicināt")}
          </button>
        ) : null}
      </div>
    </div>
  );
}
