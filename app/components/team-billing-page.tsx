"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingState } from "@/app/components/loading-state";
import { SectionPage } from "@/app/components/section-page";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  buyExtraTeamSeatAction,
  confirmTeamBillingCheckoutAction,
  getTeamBillingSummaryAction,
  payPendingTeamSeatsAction,
  reconcileTeamBillingAfterCheckoutAction,
  startTeamBillingCheckoutAction,
  type TeamBillingPlanOption,
  type TeamBillingSummary,
} from "@/app/lib/billing/actions";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import {
  checkoutPricesForPeriod,
  estimateSubscriptionCheckoutTotal,
} from "@/app/lib/billing/checkout-estimate";
import { formatEuro, formatInteger } from "@/app/lib/format/numbers";
import type { PaymentPlanBillingPeriod } from "@/app/lib/payment-plans/helpers";
import { formatPlanEuro } from "@/app/lib/payment-plans/helpers";
import { canEditTeamSettings } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

function BillingPeriodToggle({
  value,
  disabled,
  monthLabel,
  yearLabel,
  ariaLabel,
  onChange,
}: {
  value: PaymentPlanBillingPeriod;
  disabled?: boolean;
  monthLabel: string;
  yearLabel: string;
  ariaLabel: string;
  onChange: (next: PaymentPlanBillingPeriod) => void;
}) {
  const isYear = value === "year";
  return (
    <div className="flex items-center justify-center gap-3 sm:justify-start">
      <span
        className={`text-sm font-medium transition ${
          isYear ? "text-zinc-400" : "text-zinc-900"
        }`}
      >
        {monthLabel}
      </span>
      <ToggleSwitch
        checked={isYear}
        disabled={disabled}
        label={ariaLabel}
        onChange={(checked) => onChange(checked ? "year" : "month")}
      />
      <span
        className={`text-sm font-medium transition ${
          isYear ? "text-zinc-900" : "text-zinc-400"
        }`}
      >
        {yearLabel}
      </span>
    </div>
  );
}

function BillingCheckoutPreview({
  summary,
  selectedPlan,
  period,
  t,
}: {
  summary: TeamBillingSummary;
  selectedPlan: TeamBillingPlanOption | undefined;
  period: PaymentPlanBillingPeriod;
  t: (key: string, fallback: string, params?: Record<string, string>) => string;
}) {
  const seatCount = summary.billableSeatCount;
  if (seatCount < 1 || !selectedPlan) return null;

  const prices = checkoutPricesForPeriod(selectedPlan, period);
  if (!prices) return null;

  const estimate = estimateSubscriptionCheckoutTotal({
    quantity: seatCount,
    prices,
    remainingEarlyBirdSeats: summary.remainingEarlyBirdSeats,
  });

  const periodSuffix =
    period === "year"
      ? t("team.billing.checkout_period_year", "/gads")
      : period === "quarter"
        ? t("team.billing.checkout_period_quarter", "/cet.")
        : t("team.billing.checkout_period_month", "/mēn");

  const vatNote = t("team.billing.plus_vat", "+ PVN");
  const unitPrice =
    estimate.earlyBirdCount > 0 && estimate.regularCount === 0
      ? estimate.earlyBirdPrice
      : estimate.regularPrice;

  const calcLine = estimate.hasMixedPricing
    ? t(
        "team.billing.checkout_preview_split",
        "{earlyCount} × {earlyPrice} + {regularCount} × {regularPrice} = {total}{period} {vat}",
        {
          earlyCount: formatInteger(estimate.earlyBirdCount),
          earlyPrice: formatPlanEuro(estimate.earlyBirdPrice),
          regularCount: formatInteger(estimate.regularCount),
          regularPrice: formatPlanEuro(estimate.regularPrice),
          total: formatEuro(estimate.total),
          period: periodSuffix,
          vat: vatNote,
        },
      )
    : t(
        "team.billing.checkout_preview",
        "{count} × {price} = {total}{period} {vat}",
        {
          count: formatInteger(seatCount),
          price: formatPlanEuro(unitPrice),
          total: formatEuro(estimate.total),
          period: periodSuffix,
          vat: vatNote,
        },
      );

  return (
    <div className="min-w-0 sm:text-right">
      <p className="text-sm font-medium text-zinc-900">
        {t("team.billing.checkout_seats", "{count} maksas lietotāji", {
          count: formatInteger(seatCount),
        })}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{calcLine}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {t(
          "team.billing.checkout_vat_hint",
          "PVN tiek aprēķināts atbilstoši tavai valstij Stripe apmaksā.",
        )}
      </p>
      <p className="mt-1 text-xs text-zinc-500">
        {t(
          "team.billing.free_owner_seat",
          "Komandas vadītāja vieta ir bez maksas. Maksā tikai par vietām virs 1.",
        )}
      </p>
    </div>
  );
}

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
  const mountedRef = useRef(false);
  const checkoutHandledRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!currentTeam?.id || !canManage) return;
    let cancelled = false;
    void (async () => {
      // Recover seats if Checkout succeeded but webhook did not update yet.
      await reconcileTeamBillingAfterCheckoutAction(currentTeam.id);
      if (cancelled || !mountedRef.current) return;
      const result = await getTeamBillingSummaryAction(currentTeam.id);
      if (cancelled || !mountedRef.current) return;
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setSummary(result.data);
      setPlanId(
        result.data.planId && !result.data.isFreePlan
          ? result.data.planId
          : (result.data.paidPlans[0]?.id ?? ""),
      );
      const nextPeriod =
        result.data.paidPlans.find(
          (plan) => plan.id === (result.data.planId || result.data.paidPlans[0]?.id),
        )?.periods[0] ?? result.data.period;
      setPeriod(nextPeriod);
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage, currentTeam?.id, showFeedback, t]);

  useEffect(() => {
    const checkout = searchParams.get("checkout");
    const sessionId = searchParams.get("session_id");
    if (!checkout || !currentTeam?.id || !canManage) return;

    const handleKey = `${checkout}:${sessionId ?? ""}`;
    if (checkoutHandledRef.current === handleKey) return;
    checkoutHandledRef.current = handleKey;

    if (checkout === "cancel") {
      queueMicrotask(() => {
        if (!mountedRef.current) return;
        showFeedback({
          type: "info",
          text: t("team.billing.checkout_cancel", "Maksājums atcelts."),
        });
        router.replace("/team/billing");
      });
      return;
    }

    if (checkout !== "success") return;

    let cancelled = false;
    void (async () => {
      const confirm = await confirmTeamBillingCheckoutAction(
        currentTeam.id,
        sessionId,
      );
      if (cancelled || !mountedRef.current) return;
      if (!confirm.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, confirm.error),
        });
        router.replace("/team/billing");
        return;
      }
      if (!confirm.data.confirmed) {
        // Production without Stripe session_id — ignore forged success links.
        router.replace("/team/billing");
        return;
      }
      const result = await getTeamBillingSummaryAction(currentTeam.id);
      if (cancelled || !mountedRef.current) return;
      if (result.ok) {
        setSummary(result.data);
        setPlanId(
          result.data.planId && !result.data.isFreePlan
            ? result.data.planId
            : (result.data.paidPlans[0]?.id ?? ""),
        );
      }
      showFeedback({
        type: "success",
        text: t(
          "team.billing.checkout_success",
          "Maksājums saņemts. Vietas tiks atvērtas pēc apstiprinājuma.",
        ),
      });
      router.replace("/team/billing");
    })();

    return () => {
      cancelled = true;
    };
  }, [canManage, currentTeam?.id, router, searchParams, showFeedback, t]);

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
          {summary.hasSubscription ? (
            <div
              role="note"
              className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950"
            >
              <p className="font-semibold">
                {t(
                  "team.billing.new_user_prorata_title",
                  "Jauni lietotāji bez brīvas vietas",
                )}
              </p>
              <p className="mt-1 leading-relaxed text-sky-900/90">
                {summary.nextBillingAt
                  ? t(
                      "team.billing.new_user_prorata_notice",
                      "Ja uzaicini jaunu lietotāju, kam nav brīvas apmaksātas vietas, viņam tiks piestādīts rēķins par atlikušo periodu līdz {until} – līdz visas komandas abonementa perioda beigām. Pēc tam visi lietotāji tiek iekļauti vienā komandas rēķinā.",
                      { until: formatDate(summary.nextBillingAt) },
                    )
                  : t(
                      "team.billing.new_user_prorata_notice_no_date",
                      "Ja uzaicini jaunu lietotāju, kam nav brīvas apmaksātas vietas, viņam tiks piestādīts rēķins par atlikušo periodu līdz komandas abonementa perioda beigām. Pēc tam visi lietotāji tiek iekļauti vienā komandas rēķinā.",
                    )}
              </p>
            </div>
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

        {!summary.hasSubscription && summary.paidPlans.length > 0
          ? (() => {
              const available = selectedPlan?.periods ?? ["month"];
              const hasMonth = available.includes("month");
              const hasYear = available.includes("year");
              const onlyMonthYear =
                hasMonth &&
                hasYear &&
                available.every((item) => item === "month" || item === "year");
              const showPlanSelect = summary.paidPlans.length > 1;
              const showPeriodToggle = onlyMonthYear;
              const showPeriodSelect = !onlyMonthYear && available.length > 1;
              const showCheckoutPreview = summary.billableSeatCount > 0 && Boolean(selectedPlan);
              const hasControls = showPlanSelect || showPeriodToggle || showPeriodSelect;
              if (!hasControls && !showCheckoutPreview) {
                return null;
              }

              return (
                <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-5 shadow-sm">
                  <div
                    className={
                      showPlanSelect
                        ? "grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
                        : showPeriodToggle && showCheckoutPreview
                          ? "flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"
                          : "flex flex-col gap-3"
                    }
                  >
                    {showPlanSelect ? (
                      <label className="block min-w-0 text-sm font-medium text-zinc-700">
                        {t("team.billing.choose_plan", "Izvēlies maksas plānu")}
                        <select
                          className="mt-1.5 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                          value={planId}
                          onChange={(event) => {
                            setPlanId(event.target.value);
                            const next = summary.paidPlans.find(
                              (plan) => plan.id === event.target.value,
                            );
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
                    ) : null}

                    {showPeriodToggle ? (
                      <div className={showPlanSelect ? "pb-1" : "min-w-0 shrink-0"}>
                        {showPlanSelect ? (
                          <p className="mb-2 text-sm font-medium text-zinc-700">
                            {t("team.billing.choose_period", "Periods")}
                          </p>
                        ) : null}
                        <BillingPeriodToggle
                          value={period === "year" ? "year" : "month"}
                          disabled={isPending}
                          monthLabel={t("team.billing.period.month", "Mēnesis")}
                          yearLabel={t("team.billing.period.year", "Gads")}
                          ariaLabel={t(
                            "team.billing.period_toggle",
                            "Pārslēgt mēnesi un gadu",
                          )}
                          onChange={setPeriod}
                        />
                      </div>
                    ) : null}

                    {showPeriodSelect ? (
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
                          {available.map((item) => (
                            <option key={item} value={item}>
                              {periodLabel(item)}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {showCheckoutPreview && showPeriodToggle && !showPlanSelect ? (
                      <BillingCheckoutPreview
                        summary={summary}
                        selectedPlan={selectedPlan}
                        period={period}
                        t={t}
                      />
                    ) : null}
                  </div>

                  {showCheckoutPreview && (showPlanSelect || !showPeriodToggle) ? (
                    <div
                      className={
                        hasControls ? "mt-5 border-t border-zinc-100 pt-5" : undefined
                      }
                    >
                      <BillingCheckoutPreview
                        summary={summary}
                        selectedPlan={selectedPlan}
                        period={period}
                        t={t}
                      />
                    </div>
                  ) : null}
                </div>
              );
            })()
          : null}

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
