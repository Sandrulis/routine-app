"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { mapUserDisplay } from "@/app/lib/auth/map-user-display";
import { assertCanManageTeamBilling } from "@/app/lib/billing/access";
import {
  billableSeatCount,
  estimateProrataEuros,
  resolveSeatCounts,
} from "@/app/lib/billing/seats";
import {
  createSeatCheckoutSession,
  confirmCheckoutSessionForTeam,
  ensureStripeCustomer,
  invoiceAdditionalSeats,
  loadTeamBillingRow,
  loadTeamMembersForSeats,
  parsePeriod,
  reconcileTeamBillingFromStripe,
  remainingEarlyBirdForCheckout,
  cancelTeamSubscriptionAtPeriodEnd,
  resumeTeamSubscription,
  subscriptionPeriodEndMs,
} from "@/app/lib/billing/subscription";
import {
  getStripeClient,
  getStripeCredentials,
  stripeUnavailableError,
} from "@/app/lib/integrations/stripe/client";
import type { ActionResult } from "@/app/lib/actions/action-result";
import {
  formatPlanEuro,
  getPaymentPlanPriceForPeriod,
  remainingEarlyBirdSeats,
  type PaymentPlanBillingPeriod,
} from "@/app/lib/payment-plans/helpers";
import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
import {
  getEarlyBirdSettings,
  isPaymentPlansEnabled,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import { getPublicSiteUrl, isLocalPublicSite } from "@/app/lib/seo/site-url";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";

export type TeamBillingPlanPeriodPrices = {
  regular: number;
  earlyBird: number;
};

export type TeamBillingPlanOption = {
  id: string;
  name: string;
  isFree: boolean;
  periods: PaymentPlanBillingPeriod[];
  prices: Partial<Record<PaymentPlanBillingPeriod, TeamBillingPlanPeriodPrices>>;
};

export type TeamBillingSummary = {
  paymentPlansEnabled: boolean;
  stripeEnabled: boolean;
  canManage: boolean;
  isVip: boolean;
  hasSubscription: boolean;
  pastDue: boolean;
  planId: string | null;
  planName: string;
  isFreePlan: boolean;
  isTrial: boolean;
  period: PaymentPlanBillingPeriod;
  paidSeatCount: number;
  occupiedSeatCount: number;
  openSeatCount: number;
  pendingPaymentCount: number;
  billableSeatCount: number;
  pricePerSeat: number;
  pricePerSeatLabel: string;
  prorataEstimate: number;
  extraSeatProrataEstimate: number;
  nextBillingAt: string | null;
  cancelAtPeriodEnd: boolean;
  subscriptionEndsAt: string | null;
  pendingMembers: Array<{ id: string; email: string; name: string }>;
  paidPlans: TeamBillingPlanOption[];
  remainingEarlyBirdSeats: number;
};

function periodsForPlan(
  plan: {
    priceMonth: number;
    priceQuarter: number;
    priceYear: number;
    earlyBirdPriceMonth: number;
    earlyBirdPriceQuarter: number;
    earlyBirdPriceYear: number;
  },
  remainingEarlyBird: number,
): PaymentPlanBillingPeriod[] {
  const periods: PaymentPlanBillingPeriod[] = [];
  for (const period of ["month", "year"] as const) {
    const hasRegular = getPaymentPlanPriceForPeriod(plan, period) > 0;
    const hasEarlyBird =
      remainingEarlyBird > 0 &&
      getPaymentPlanPriceForPeriod(plan, period, { earlyBird: true }) > 0;
    if (hasRegular || hasEarlyBird) {
      periods.push(period);
    }
  }
  return periods;
}

async function extraSeatInvoiceContext(team: Awaited<ReturnType<typeof loadTeamBillingRow>>, userId: string) {
  if (!team) {
    return { ok: false as const, error: "errors.billing_forbidden" };
  }
  const [plans, earlyBird, profile] = await Promise.all([
    listPaymentPlans(),
    getEarlyBirdSettings(),
    (await createClient())
      .from("users")
      .select("language_code")
      .eq("id", userId)
      .maybeSingle()
      .then((result) => result.data),
  ]);
  const plan = plans.find((item) => item.id === team.payment_plan_id) ?? null;
  if (!plan || plan.isFree) {
    return { ok: false as const, error: "errors.billing_no_paid_plan" };
  }
  const languageCode = profile?.language_code?.trim() || DEFAULT_LANGUAGE;
  const remainingEarlyBird = remainingEarlyBirdForCheckout(
    remainingEarlyBirdSeats(earlyBird),
    plan,
    parsePeriod(team.billing_period),
    languageCode,
  );
  return { ok: true as const, plan, remainingEarlyBird, languageCode };
}

export async function getTeamBillingSummaryAction(
  teamId: string,
): Promise<ActionResult<TeamBillingSummary>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };

  const trimmed = teamId.trim();
  if (!trimmed) return { ok: false, error: "errors.billing_forbidden" };

  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const [plansEnabled, stripeCredentials, team, members, plans, earlyBird, profile] =
    await Promise.all([
      isPaymentPlansEnabled(),
      getStripeCredentials(),
      loadTeamBillingRow(trimmed),
      loadTeamMembersForSeats(trimmed),
      listPaymentPlans(),
      getEarlyBirdSettings(),
      (await createClient())
        .from("users")
        .select("language_code")
        .eq("id", user.id)
        .maybeSingle()
        .then((result) => result.data),
    ]);

  if (!team) return { ok: false, error: "errors.billing_forbidden" };

  const stripeEnabled = Boolean(stripeCredentials);
  const languageCode = profile?.language_code?.trim() || DEFAULT_LANGUAGE;
  const plan = plans.find((item) => item.id === team.payment_plan_id) ?? null;
  const period = parsePeriod(team.billing_period);
  const remainingEarlyBird = plan
    ? remainingEarlyBirdForCheckout(
        remainingEarlyBirdSeats(earlyBird),
        plan,
        period,
        languageCode,
      )
    : 0;
  const regularPrice = plan ? getPaymentPlanPriceForPeriod(plan, period) : 0;
  const earlyBirdPrice = plan
    ? getPaymentPlanPriceForPeriod(plan, period, { earlyBird: true })
    : 0;
  const teamEarlyBirdSeats = Math.max(0, team.early_bird_seat_count ?? 0);
  const pricePerSeat =
    teamEarlyBirdSeats > 0 && earlyBirdPrice > 0
      ? earlyBirdPrice
      : regularPrice;
  const extraSeatPrice =
    remainingEarlyBird > 0 && earlyBirdPrice > 0 ? earlyBirdPrice : regularPrice;
  const counts = resolveSeatCounts({
    paidSeatCount: team.paid_seat_count ?? 0,
    members: members.map((row) => ({ seatStatus: row.seat_status })),
  });

  let nextBillingAt: string | null = null;
  let pastDue = false;
  let periodEndMs: number | null = null;
  let cancelAtPeriodEnd = team.subscription_cancel_at_period_end === true;
  if (stripeEnabled && team.stripe_subscription_id) {
    const stripe = await getStripeClient();
    if (stripe) {
      try {
        const subscription = await stripe.subscriptions.retrieve(
          team.stripe_subscription_id,
        );
        pastDue = subscription.status === "past_due";
        periodEndMs = subscriptionPeriodEndMs(subscription);
        nextBillingAt = periodEndMs ? new Date(periodEndMs).toISOString() : null;
        cancelAtPeriodEnd = subscription.cancel_at_period_end === true;
      } catch {
        nextBillingAt = null;
      }
    }
  }

  const globalRemainingEarlyBird = remainingEarlyBirdSeats(earlyBird);
  const paidPlans: TeamBillingPlanOption[] = plans
    .filter((item) => !item.isFree)
    .map((item) => ({
      id: item.id,
      name: resolveLocalizedValue(item.nameValues, languageCode) || item.planKey,
      isFree: false,
      periods: periodsForPlan(item, globalRemainingEarlyBird),
      prices: {
        month: {
          regular: item.priceMonth,
          earlyBird: item.earlyBirdPriceMonth,
        },
        year: {
          regular: item.priceYear,
          earlyBird: item.earlyBirdPriceYear,
        },
      },
    }))
    .filter((item) => item.periods.length > 0);

  return {
    ok: true,
    data: {
      paymentPlansEnabled: plansEnabled,
      stripeEnabled,
      canManage: true,
      isVip: team.is_vip === true,
      hasSubscription: Boolean(team.stripe_subscription_id),
      pastDue,
      planId: team.payment_plan_id,
      planName: plan
        ? resolveLocalizedValue(plan.nameValues, languageCode) || plan.planKey
        : "",
      isFreePlan: plan?.isFree === true,
      isTrial: team.payment_plan_is_trial === true,
      period,
      paidSeatCount: counts.paidSeatCount,
      occupiedSeatCount: counts.occupiedSeatCount,
      openSeatCount: counts.openSeatCount,
      pendingPaymentCount: counts.pendingPaymentCount,
      billableSeatCount: billableSeatCount(
        counts.occupiedSeatCount + counts.pendingPaymentCount,
      ),
      pricePerSeat,
      pricePerSeatLabel: formatPlanEuro(pricePerSeat),
      prorataEstimate: estimateProrataEuros({
        pricePerSeat,
        seatCount: counts.pendingPaymentCount,
        periodEndMs,
      }),
      extraSeatProrataEstimate: estimateProrataEuros({
        pricePerSeat: extraSeatPrice,
        seatCount: 1,
        periodEndMs,
      }),
      nextBillingAt:
        nextBillingAt ??
        (typeof team.billing_period_end_at === "string" && team.billing_period_end_at.trim()
          ? team.billing_period_end_at
          : typeof team.billing_cycle_end === "string" && team.billing_cycle_end.trim()
            ? `${team.billing_cycle_end.trim()}T00:00:00.000Z`
            : null),
      cancelAtPeriodEnd: cancelAtPeriodEnd,
      subscriptionEndsAt:
        typeof team.billing_period_end_at === "string" && team.billing_period_end_at.trim()
          ? team.billing_period_end_at
          : nextBillingAt,
      pendingMembers: members
        .filter((row) => row.seat_status === "pending_payment")
        .map((row) => ({
          id: row.id,
          email: row.email,
          name: row.name,
        })),
      paidPlans,
      remainingEarlyBirdSeats: globalRemainingEarlyBird,
    },
  };
}

export async function startTeamBillingCheckoutAction(input: {
  teamId: string;
  planId?: string;
  period?: PaymentPlanBillingPeriod;
  extraSeats?: number;
}): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await isPaymentPlansEnabled())) {
    return { ok: false, error: "errors.billing_not_configured" };
  }
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const teamId = input.teamId.trim();
  const access = await assertCanManageTeamBilling(teamId, user.id);
  if (!access.ok) return access;

  const [team, members, plans, earlyBird, profile] = await Promise.all([
    loadTeamBillingRow(teamId),
    loadTeamMembersForSeats(teamId),
    listPaymentPlans(),
    getEarlyBirdSettings(),
    (await createClient())
      .from("users")
      .select("language_code")
      .eq("id", user.id)
      .maybeSingle()
      .then((result) => result.data),
  ]);
  if (!team) return { ok: false, error: "errors.billing_forbidden" };
  if (team.is_vip === true) {
    return { ok: false, error: "errors.billing_vip_no_payment" };
  }
  if (team.stripe_subscription_id) {
    return payPendingTeamSeatsAction(teamId);
  }

  const plan =
    plans.find((item) => item.id === (input.planId || team.payment_plan_id)) ??
    plans.find((item) => !item.isFree) ??
    null;
  if (!plan || plan.isFree) {
    return { ok: false, error: "errors.billing_no_paid_plan" };
  }

  const period = parsePeriod(input.period || team.billing_period);
  if (period === "quarter") {
    return { ok: false, error: "errors.billing_no_paid_plan" };
  }
  const languageCode = profile?.language_code?.trim() || DEFAULT_LANGUAGE;
  const remainingEarlyBird = remainingEarlyBirdForCheckout(
    remainingEarlyBirdSeats(earlyBird) + Math.max(0, team.early_bird_seat_count ?? 0),
    plan,
    period,
    languageCode,
  );

  const counts = resolveSeatCounts({
    paidSeatCount: team.paid_seat_count ?? 0,
    members: members.map((row) => ({ seatStatus: row.seat_status })),
  });
  const extraSeats = Math.max(0, Math.trunc(input.extraSeats ?? 0));
  const quantity = billableSeatCount(
    counts.occupiedSeatCount + counts.pendingPaymentCount + extraSeats,
  );
  if (quantity < 1) {
    return { ok: false, error: "errors.billing_only_free_seat" };
  }

  const display = mapUserDisplay(user);
  const customerId = await ensureStripeCustomer({
    team,
    email: user.email ?? "",
    name: display.name || team.name,
  });
  if (!customerId) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const checkout = await createSeatCheckoutSession({
    team,
    plan,
    period,
    quantity,
    customerId,
    remainingEarlyBird,
    languageCode,
  });
  if (!checkout.ok) return checkout;
  revalidatePath("/team/billing");
  return { ok: true, data: { url: checkout.url } };
}

export async function payPendingTeamSeatsAction(
  teamId: string,
): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const trimmed = teamId.trim();
  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const [team, members] = await Promise.all([
    loadTeamBillingRow(trimmed),
    loadTeamMembersForSeats(trimmed),
  ]);
  if (!team) return { ok: false, error: "errors.billing_forbidden" };
  if (team.is_vip === true) {
    return { ok: false, error: "errors.billing_vip_no_payment" };
  }

  const counts = resolveSeatCounts({
    paidSeatCount: team.paid_seat_count ?? 0,
    members: members.map((row) => ({ seatStatus: row.seat_status })),
  });
  if (!team.stripe_subscription_id) {
    return startTeamBillingCheckoutAction({ teamId: trimmed });
  }

  const extra = await extraSeatInvoiceContext(team, user.id);
  if (!extra.ok) return extra;

  const result = await invoiceAdditionalSeats({
    team,
    extraSeatCount: counts.pendingPaymentCount,
    plan: extra.plan,
    remainingEarlyBird: extra.remainingEarlyBird,
    languageCode: extra.languageCode,
  });
  if (!result.ok) return result;
  revalidatePath("/team/billing");
  revalidatePath("/team");
  return { ok: true, data: { url: result.url } };
}

export async function buyExtraTeamSeatAction(
  teamId: string,
): Promise<ActionResult<{ url: string }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const trimmed = teamId.trim();
  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const team = await loadTeamBillingRow(trimmed);
  if (!team) return { ok: false, error: "errors.billing_forbidden" };
  if (team.is_vip === true) {
    return { ok: false, error: "errors.billing_vip_no_payment" };
  }

  const members = await loadTeamMembersForSeats(trimmed);
  const seats = resolveSeatCounts({
    paidSeatCount: team.paid_seat_count ?? 0,
    members: members.map((row) => ({ seatStatus: row.seat_status })),
  });
  if (seats.openSeatCount > 0) {
    return { ok: false, error: "errors.billing_open_seat_available" };
  }

  if (!team.stripe_subscription_id) {
    return startTeamBillingCheckoutAction({ teamId: trimmed, extraSeats: 1 });
  }

  const extra = await extraSeatInvoiceContext(team, user.id);
  if (!extra.ok) return extra;

  const result = await invoiceAdditionalSeats({
    team,
    extraSeatCount: 1,
    plan: extra.plan,
    remainingEarlyBird: extra.remainingEarlyBird,
    languageCode: extra.languageCode,
  });
  if (!result.ok) return result;
  revalidatePath("/team/billing");
  revalidatePath("/team");
  return { ok: true, data: { url: result.url } };
}

export async function reconcileTeamBillingAfterCheckoutAction(
  teamId: string,
): Promise<ActionResult<{ synced: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const trimmed = teamId.trim();
  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const synced = await reconcileTeamBillingFromStripe(trimmed);
  if (synced) {
    revalidatePath("/team/billing");
    revalidatePath("/team");
  }
  return { ok: true, data: { synced } };
}

/**
 * Success-URL handler. Requires Stripe `session_id` (except localhost test bypass).
 * Inventing `?checkout=success` alone does not confirm payment in production.
 */
export async function confirmTeamBillingCheckoutAction(
  teamId: string,
  sessionId?: string | null,
): Promise<ActionResult<{ synced: boolean; confirmed: boolean }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const trimmed = teamId.trim();
  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const trimmedSession = sessionId?.trim() || "";
  if (trimmedSession) {
    const confirmed = await confirmCheckoutSessionForTeam(trimmed, trimmedSession);
    if (!confirmed.ok) return confirmed;
    revalidatePath("/team/billing");
    revalidatePath("/team");
    return { ok: true, data: { synced: confirmed.synced, confirmed: true } };
  }

  if (!isLocalPublicSite()) {
    return { ok: true, data: { synced: false, confirmed: false } };
  }

  const synced = await reconcileTeamBillingFromStripe(trimmed);
  if (synced) {
    revalidatePath("/team/billing");
    revalidatePath("/team");
  }
  return { ok: true, data: { synced, confirmed: synced } };
}

export async function cancelTeamSubscriptionAction(
  teamId: string,
): Promise<ActionResult<{ cancelled: true }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const trimmed = teamId.trim();
  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const result = await cancelTeamSubscriptionAtPeriodEnd(trimmed);
  if (!result.ok) return result;
  revalidatePath("/team/billing");
  revalidatePath("/team");
  return { ok: true, data: { cancelled: true } };
}

export async function resumeTeamSubscriptionAction(
  teamId: string,
): Promise<ActionResult<{ resumed: true }>> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "errors.auth_required" };
  if (!isSupabaseConfigured()) return { ok: false, error: "errors.db_not_configured" };
  if (!(await getStripeCredentials())) {
    return { ok: false, error: await stripeUnavailableError() };
  }

  const trimmed = teamId.trim();
  const access = await assertCanManageTeamBilling(trimmed, user.id);
  if (!access.ok) return access;

  const result = await resumeTeamSubscription(trimmed);
  if (!result.ok) return result;
  revalidatePath("/team/billing");
  revalidatePath("/team");
  return { ok: true, data: { resumed: true } };
}
