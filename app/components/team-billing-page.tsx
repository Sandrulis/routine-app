"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/app/components/loading-state";
import { SectionPage } from "@/app/components/section-page";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  buyExtraTeamSeatAction,
  getTeamBillingSummaryAction,
  payPendingTeamSeatsAction,
  startTeamBillingCheckoutAction,
  type TeamBillingSummary,
} from "@/app/lib/billing/actions";
import { formatEuro, formatInteger } from "@/app/lib/format/numbers";
import type { PaymentPlanBillingPeriod } from "@/app/lib/payment-plans/helpers";
import { canEditTeamSettings } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function TeamBillingPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { formatDate } = useDisplayPreferences();
  const { showFeedback } = useFeedbackToast();
  const { currentTeam, currentUser, roles, isReady } = useTeam();
  const { isAdmin } = useIsAdmin();
  const canManage = canEditTeamSettings(currentUser, roles, isAdmin);
  const [summary, setSummary] = useState<TeamBillingSummary | null>(null);
  const [planId, setPlanId] = useState("");
  const [period, setPeriod] = useState<PaymentPlanBillingPeriod>("month");
  const [pendingKind, setPendingKind] = useState<"pay" | "extra" | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!currentTeam?.id || !canManage) return;
    void getTeamBillingSummaryAction(currentTeam.id).then((result) => {
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setSummary(result.data);
      setPlanId(result.data.planId && !result.data.isFreePlan ? result.data.planId : result.data.paidPlans[0]?.id ?? "");
      const nextPeriod =
        result.data.paidPlans.find((plan) => plan.id === (result.data.planId || result.data.paidPlans[0]?.id))
          ?.periods[0] ?? result.data.period;
      setPeriod(nextPeriod);
    });
  }, [canManage, currentTeam?.id, showFeedback, t]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    if (!checkout) return;
    if (checkout === "success") {
      showFeedback({
        type: "success",
        text: t("team.billing.checkout_success", "Maksājums saņemts. Vietas tiks atvērtas pēc apstiprinājuma."),
      });
    } else if (checkout === "cancel") {
      showFeedback({
        type: "info",
        text: t("team.billing.checkout_cancel", "Maksājums atcelts."),
      });
    }
    router.replace("/team/billing");
  }, [router, searchParams, showFeedback, t]);

  function periodLabel(value: PaymentPlanBillingPeriod) {
    if (value === "year") return t("team.billing.period.year", "Gads");
    if (value === "quarter") return t("team.billing.period.quarter", "Ceturksnis");
    return t("team.billing.period.month", "Mēnesis");
  }

  function pay() {
    if (!currentTeam || isPending) return;
    startTransition(async () => {
      setPendingKind("pay");
      const result = summary?.hasSubscription
        ? await payPendingTeamSeatsAction(currentTeam.id)
        : await startTeamBillingCheckoutAction({
            teamId: currentTeam.id,
            planId,
            period,
          });
      setPendingKind(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  function buyExtra() {
    if (!currentTeam || isPending) return;
    startTransition(async () => {
      setPendingKind("extra");
      const result = await buyExtraTeamSeatAction(currentTeam.id);
      setPendingKind(null);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  if (!isReady) {
    return <LoadingState />;
  }

  if (!currentTeam) {
    return (
      <SectionPage
        title={t("team.billing.title", "Abonementi")}
        subtitle={t(
          "team.billing.subtitle",
          "Apmaksātās vietas komandai. Jaunais lietotājs piekļūst tikai pēc apmaksātas vietas.",
        )}
      >
        <p className="text-sm text-zinc-500">
          {t("teams.required.empty_members", "Vispirms izveido komandu.")}
        </p>
      </SectionPage>
    );
  }

  if (!canManage) {
    return (
      <SectionPage
        title={t("team.billing.title", "Abonementi")}
        subtitle={t(
          "team.billing.subtitle",
          "Apmaksātās vietas komandai. Jaunais lietotājs piekļūst tikai pēc apmaksātas vietas.",
        )}
      >
        <p className="text-sm text-zinc-500">
          {translateActionError(t, "errors.billing_forbidden")}
        </p>
      </SectionPage>
    );
  }

  if (!summary) {
    return (
      <SectionPage
        title={t("team.billing.title", "Abonementi")}
        subtitle={t(
          "team.billing.subtitle",
          "Apmaksātās vietas komandai. Jaunais lietotājs piekļūst tikai pēc apmaksātas vietas.",
        )}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  const selectedPlan = summary.paidPlans.find((plan) => plan.id === planId) ?? summary.paidPlans[0];
  const canPayPending = summary.stripeEnabled && summary.pendingPaymentCount > 0;
  const canSubscribe =
    summary.stripeEnabled &&
    !summary.hasSubscription &&
    summary.paidPlans.length > 0 &&
    Boolean(planId) &&
    summary.billableSeatCount > 0;
  const canBuyExtra =
    summary.stripeEnabled && (summary.hasSubscription || summary.billableSeatCount < 1);

  return (
    <SectionPage
      title={t("team.billing.title", "Abonementi")}
      subtitle={t(
        "team.billing.subtitle",
        "Apmaksātās vietas komandai. Jaunais lietotājs piekļūst tikai pēc apmaksātas vietas.",
      )}
    >
      <div className="grid gap-4">
        {!summary.paymentPlansEnabled ? (
          <p className="rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-600">
            {t("team.billing.plans_disabled", "Maksas plāni sistēmā nav ieslēgti.")}
          </p>
        ) : null}

        {summary.paymentPlansEnabled && !summary.stripeEnabled && !isAdmin ? (
          <p className="rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-600">
            {t("team.billing.stripe_disabled", "Stripe nav ieslēgts. Administrators to konfigurē Integrācijās.")}
          </p>
        ) : null}

        {summary.pastDue ? (
          <p className="rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            {t(
              "team.billing.past_due",
              "Pēdējais rēķins nav apmaksāts. Stripe mēģinās vēlreiz; pēc termiņa maksas plāns tiks deaktivizēts.",
            )}
          </p>
        ) : null}

        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("team.billing.seats_paid", "Apmaksātās vietas")}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-900">
                {formatInteger(summary.paidSeatCount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("team.billing.seats_occupied", "Aizņemtās vietas")}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-900">
                {formatInteger(summary.occupiedSeatCount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("team.billing.seats_open", "Atvērtās vietas")}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-900">
                {formatInteger(summary.openSeatCount)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {t("team.billing.seats_pending", "Gaida samaksu")}
              </dt>
              <dd className="mt-1 text-lg font-semibold text-zinc-900">
                {formatInteger(summary.pendingPaymentCount)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-zinc-600">
            {summary.planName
              ? `${summary.planName} - ${periodLabel(summary.period)} - ${summary.pricePerSeatLabel} / ${t("team.billing.per_seat", "lietotājs")}`
              : t("team.billing.choose_plan", "Izvēlies maksas plānu")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {t(
              "team.billing.free_owner_seat",
              "Komandas vadītāja vieta ir bez maksas. Maksā tikai par vietām virs 1.",
            )}
          </p>
          {summary.nextBillingAt ? (
            <p className="mt-1 text-sm text-zinc-500">
              {t("team.billing.next_invoice", "Nākamais rēķins")}: {formatDate(summary.nextBillingAt)}
            </p>
          ) : null}
          {summary.hasSubscription && summary.openSeatCount > 0 && summary.nextBillingAt ? (
            <p className="mt-3 text-sm text-zinc-500">
              {t(
                "team.billing.open_until_hint",
                "Brīvās vietas paliek līdz {until}. Ja tās neaizpilda, nākamajā rēķinā maksā tikai par aizņemtajām vietām.",
                { until: formatDate(summary.nextBillingAt) },
              )}
            </p>
          ) : null}
        </div>

        {summary.pendingMembers.length > 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("team.billing.pending_list", "Lietotāji, kas gaida samaksu")}
            </h2>
            <ul className="mt-3 space-y-2">
              {summary.pendingMembers.map((member) => (
                <li key={member.id} className="text-sm text-zinc-700">
                  <span className="font-medium">{member.name || member.email}</span>
                  {member.name ? (
                    <span className="text-zinc-500"> - {member.email}</span>
                  ) : null}
                </li>
              ))}
            </ul>
            {summary.prorataEstimate > 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                {t(
                  "team.billing.prorata_hint",
                  "Aptuveni {amount} līdz nākamajam ciklam, pēc tam viena ikmēneša iemaksa visām vietām.",
                  { amount: formatEuro(summary.prorataEstimate) },
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <p className="rounded-3xl border border-dashed border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-500">
            {t("team.billing.no_pending", "Nav vietu, kas gaida samaksu.")}
          </p>
        )}

        {!summary.hasSubscription && summary.paidPlans.length > 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700">
                {t("team.billing.choose_plan", "Izvēlies maksas plānu")}
                <select
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={planId}
                  onChange={(event) => {
                    setPlanId(event.target.value);
                    const next = summary.paidPlans.find((plan) => plan.id === event.target.value);
                    if (next?.periods[0]) setPeriod(next.periods[0]);
                  }}
                  disabled={isPending}
                >
                  {summary.paidPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-zinc-700">
                {t("team.billing.choose_period", "Periods")}
                <select
                  className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                  value={period}
                  onChange={(event) =>
                    setPeriod(event.target.value as PaymentPlanBillingPeriod)
                  }
                  disabled={isPending}
                >
                  {(selectedPlan?.periods ?? ["month"]).map((item) => (
                    <option key={item} value={item}>
                      {periodLabel(item)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        ) : null}

        {canBuyExtra ? (
          <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("team.billing.buy_extra", "Iegādāties 1 vietu")}
            </h2>
            {summary.extraSeatProrataEstimate > 0 ? (
              <p className="mt-2 text-sm text-zinc-500">
                {t(
                  "team.billing.extra_prorata",
                  "Aptuveni {amount} līdz nākamajam ciklam par vienu vietu.",
                  { amount: formatEuro(summary.extraSeatProrataEstimate) },
                )}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-zinc-500">
              {t(
                "team.billing.extra_renewal_hint",
                "Ja līdz cikla beigām vieta paliek tukša, nākamajā rēķinā tā vairs nav.",
              )}
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={isPending}
                onClick={buyExtra}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingKind === "extra" ? (
                  <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                ) : null}
                {t("team.billing.buy_extra", "Iegādāties 1 vietu")}
              </button>
            </div>
          </div>
        ) : null}

        {summary.stripeEnabled && (canPayPending || canSubscribe) ? (
          <div className="flex justify-end">
            <button
              type="button"
              disabled={isPending}
              onClick={pay}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKind === "pay" ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : null}
              {summary.hasSubscription
                ? t("team.billing.pay_pending", "Samaksāt {count} vietas", {
                    count: formatInteger(summary.pendingPaymentCount),
                  })
                : t("team.billing.pay_subscribe", "Sākt abonementu")}
            </button>
          </div>
        ) : null}
      </div>
    </SectionPage>
  );
}
