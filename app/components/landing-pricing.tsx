"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "@/app/components/translations-provider";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { formatInteger } from "@/app/lib/format/numbers";
import {
  planIncludesLandingFeature,
  resolveLandingPageContent,
} from "@/app/lib/landing/features";
import type { LandingPricingData } from "@/app/lib/landing/pricing";
import {
  formatPlanEuro,
  getPaymentPlanPriceForPeriod,
  listAvailablePaymentPlanBillingPeriods,
  resolveLocalizedValue,
  type PaymentPlanBillingPeriod,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";

const PERIOD_LABEL: Record<PaymentPlanBillingPeriod, { key: string; fallback: string }> = {
  month: { key: "site_payment_plans.form.price_month", fallback: "Mēnesis" },
  quarter: { key: "site_payment_plans.form.price_quarter", fallback: "Ceturksnis" },
  year: { key: "site_payment_plans.form.price_year", fallback: "Gads" },
};

const PERIOD_SHORT: Record<PaymentPlanBillingPeriod, { key: string; fallback: string }> = {
  month: { key: "site_payment_plans.period.month_short", fallback: "/ mēn." },
  quarter: { key: "site_payment_plans.period.quarter_short", fallback: "/ cet." },
  year: { key: "site_payment_plans.period.year_short", fallback: "/ gadā" },
};

function membersLabel(
  plan: PaymentPlanSummary,
  t: (key: string, fallback: string, params?: Record<string, string | number>) => string,
): string {
  if (plan.isFree && plan.maxMembers != null) {
    return formatInteger(plan.maxMembers);
  }
  return t("landing.pricing.members_unlimited", "Bez limita");
}

function CheckCell({ included }: { included: boolean }) {
  const { t } = useTranslations();
  return included ? (
    <i
      className="fas fa-circle-check text-emerald-500"
      aria-label={t("landing.pricing.included", "Iekļauts")}
    />
  ) : (
    <i
      className="fas fa-minus text-zinc-300"
      aria-label={t("landing.pricing.not_included", "Nav iekļauts")}
    />
  );
}

export function LandingPricing({
  pricing,
  signupHref,
}: {
  pricing: LandingPricingData;
  signupHref: string;
}) {
  const { t, languageCode } = useTranslations();
  const { isEnabled } = useFrontendModules();
  const content = useMemo(
    () => resolveLandingPageContent(isEnabled),
    [isEnabled],
  );
  const { plans, earlyBirdAvailable, earlyBirdRemaining, earlyBirdLimit, trialPlanId, trialDays } = pricing;
  const availablePeriods = useMemo(
    () =>
      listAvailablePaymentPlanBillingPeriods(plans, {
        earlyBird: earlyBirdAvailable,
      }),
    [plans, earlyBirdAvailable],
  );
  const [period, setPeriod] = useState<PaymentPlanBillingPeriod>(
    () => availablePeriods[0] ?? "month",
  );
  const selectedPeriod = availablePeriods.includes(period)
    ? period
    : (availablePeriods[0] ?? "month");
  const recommendedPlanId = plans.find((plan) => !plan.isFree)?.id ?? null;

  return (
    <section
      className="scroll-mt-20 border-t border-zinc-200/80 bg-white"
      id="pricing"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl">
          {t("landing.pricing.title", "Plāni un cenas")}
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          {t(
            "landing.pricing.subtitle",
            "Bezmaksas plānam ir ierobežojumi. Maksas plāns ir cena par lietotāju, bez limita.",
          )}
        </p>
        {earlyBirdLimit > 0 ? (
          <p className="mt-3 text-sm font-medium text-emerald-800">
            {t(
              "landing.pricing.early_bird_left",
              "Early Bird: {remaining} / {limit}",
              {
                remaining: formatInteger(earlyBirdRemaining),
                limit: formatInteger(earlyBirdLimit),
              },
            )}
          </p>
        ) : null}

        {availablePeriods.length > 1 ? (
          <div
            className="mt-8 inline-flex rounded-2xl border border-zinc-200 bg-zinc-50 p-1"
            role="group"
            aria-label={t("landing.pricing.title", "Plāni un cenas")}
          >
            {availablePeriods.map((item) => {
              const active = item === selectedPeriod;
              return (
                <button
                  key={item}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPeriod(item)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-white text-zinc-900 shadow-sm"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {t(PERIOD_LABEL[item].key, PERIOD_LABEL[item].fallback)}
                </button>
              );
            })}
          </div>
        ) : null}

        <div
          className={`mt-10 grid items-stretch gap-4 ${
            plans.length === 1
              ? "md:max-w-md"
              : plans.length === 2
                ? "md:grid-cols-2"
                : "md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {plans.map((plan) => {
            const isRecommended = plan.id === recommendedPlanId;
            const name = resolveLocalizedValue(plan.nameValues, languageCode);
            const description = resolveLocalizedValue(
              plan.descriptionValues,
              languageCode,
            );
            const regular = getPaymentPlanPriceForPeriod(plan, selectedPeriod);
            const early = earlyBirdAvailable
              ? getPaymentPlanPriceForPeriod(plan, selectedPeriod, {
                  earlyBird: true,
                })
              : 0;
            const showEarly = !plan.isFree && early > 0 && early < regular;
            const displayPrice = showEarly ? early : regular;
            const isTrialPlan =
              trialPlanId === plan.id && trialDays > 0 && !plan.isFree;

            const periodHint = t(
              PERIOD_SHORT[selectedPeriod].key,
              PERIOD_SHORT[selectedPeriod].fallback,
            );

            return (
              <article
                key={plan.id}
                className={`flex h-full flex-col rounded-4xl border p-6 shadow-sm transition duration-200 ${
                  isRecommended
                    ? "border-emerald-300/80 bg-gradient-to-br from-emerald-50/80 to-white ring-1 ring-emerald-500/15 hover:shadow-lg hover:shadow-emerald-600/10"
                    : "border-zinc-200/70 bg-zinc-50/50 hover:border-zinc-300 hover:bg-white hover:shadow-lg"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-zinc-900">{name}</h3>
                  {isRecommended ? (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                      {t("landing.pricing.recommended", "Ieteicamais")}
                    </span>
                  ) : null}
                  {showEarly ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-emerald-800 uppercase">
                      {t("site_payment_plans.early_bird.section", "Early Bird")}
                    </span>
                  ) : null}
                  {isTrialPlan ? (
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      {t("landing.pricing.trial", "{days} dienu izmēģinājums", {
                        days: formatInteger(trialDays),
                      })}
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-600">
                  {description || "\u00a0"}
                </p>

                <div className="mt-5">
                  <p
                    className={`text-sm ${
                      showEarly ? "text-zinc-400 line-through" : "invisible"
                    }`}
                  >
                    {showEarly ? formatPlanEuro(regular) : "\u00a0"}
                  </p>
                  {plan.isFree ? (
                    <p className="text-3xl font-bold tracking-tight text-zinc-900">
                      {formatPlanEuro(0)}
                      <span className="ml-1 text-base font-semibold text-zinc-500">
                        {periodHint}
                      </span>
                    </p>
                  ) : displayPrice > 0 ? (
                    <p className="text-3xl font-bold tracking-tight text-zinc-900">
                      {formatPlanEuro(displayPrice)}
                      <span className="ml-1 text-base font-semibold text-zinc-500">
                        {periodHint}{" "}
                        {t("site_payment_plans.period.per_user", "/ lietotājs")}
                      </span>
                    </p>
                  ) : (
                    <p className="text-3xl font-bold tracking-tight text-zinc-900">—</p>
                  )}
                </div>

                <p className="mt-3 text-sm text-zinc-600">
                  {t("landing.pricing.compare.members", "Komandas lietotāji")}
                  {": "}
                  <span className="font-medium text-zinc-800">
                    {membersLabel(plan, t)}
                  </span>
                </p>

                <div className="mt-auto pt-6">
                  <Link
                    href={signupHref}
                    className={`inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-5 text-sm font-semibold transition ${
                      isRecommended
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-500"
                        : "border border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 hover:shadow-sm"
                    }`}
                  >
                    {t("landing.hero.cta_signup", "Sākt bez maksas")}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {plans.length > 1 ? (
          <div className="mt-16">
            <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
              {t("landing.pricing.compare.title", "Salīdzinājums")}
            </h3>
            <div className="mt-6 overflow-x-auto rounded-4xl border border-zinc-200/70">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/80">
                    <th className="px-5 py-3.5 font-semibold text-zinc-500 sm:px-6" />
                    {plans.map((plan) => (
                      <th
                        key={plan.id}
                        className="px-5 py-3.5 font-semibold text-zinc-900 sm:px-6"
                      >
                        {resolveLocalizedValue(plan.nameValues, languageCode)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <th className="px-5 py-3.5 font-medium text-zinc-700 sm:px-6">
                      {t("landing.pricing.compare.members", "Komandas lietotāji")}
                    </th>
                    {plans.map((plan) => (
                      <td key={plan.id} className="px-5 py-3.5 text-zinc-600 sm:px-6">
                        {membersLabel(plan, t)}
                      </td>
                    ))}
                  </tr>
                  {content.features.map((feature) => (
                    <tr
                      key={feature.id}
                      className="border-b border-zinc-100 last:border-b-0"
                    >
                      <th className="px-5 py-3.5 font-medium text-zinc-700 sm:px-6">
                        {t(feature.titleKey, feature.titleFallback)}
                      </th>
                      {plans.map((plan) => (
                        <td key={plan.id} className="px-5 py-3.5 sm:px-6">
                          <CheckCell
                            included={planIncludesLandingFeature(
                              plan.moduleKeys,
                              feature.id,
                            )}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
