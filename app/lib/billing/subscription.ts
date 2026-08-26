import type Stripe from "stripe";
import { unlockPaidSeatsForTeam } from "@/app/lib/billing/unlock-seats";
import {
  billableSeatCount,
  countOccupiedSeats,
  eurosToCents,
  renewalSeatQuantity,
  resolveSeatCounts,
  type SeatStatus,
} from "@/app/lib/billing/seats";
import { getStripeClient, stripeUnavailableError } from "@/app/lib/integrations/stripe/client";
import { stripeClientErrorKey } from "@/app/lib/integrations/stripe/keys";
import { revalidatePath } from "next/cache";
import {
  getPaymentPlanPriceForPeriod,
  keptEarlyBirdSeatsAfterRenewal,
  splitEarlyBirdPurchase,
  type PaymentPlanBillingPeriod,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";
import { claimEarlyBirdSeats, listPaymentPlans } from "@/app/lib/payment-plans/repository";
import { resolveLocalizedValue } from "@/app/lib/i18n/localized-values";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
import { getPublicSiteUrl } from "@/app/lib/seo/site-url";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";
import { logError } from "@/app/lib/security/log-error";

export type TeamBillingRow = {
  id: string;
  name: string;
  payment_plan_id: string | null;
  payment_plan_until: string | null;
  payment_plan_paid: boolean | null;
  payment_plan_is_trial: boolean | null;
  payment_plan_is_early_bird: boolean | null;
  early_bird_seat_count: number | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  paid_seat_count: number | null;
  billing_period: string | null;
  billing_cycle_end: string | null;
};

function parsePeriod(value: string | null | undefined): PaymentPlanBillingPeriod {
  if (value === "quarter" || value === "year") return value;
  return "month";
}

type SeatKind = "early_bird" | "regular";

type ClassifiedSeats = {
  earlyBird: number;
  regular: number;
  total: number;
  earlyBirdItemId: string | null;
  regularItemId: string | null;
};

function productSeatKind(product: Stripe.Price["product"] | undefined): SeatKind | null {
  if (!product || typeof product === "string") return null;
  if ("deleted" in product && product.deleted) return null;
  const kind = product.metadata?.seatKind;
  if (kind === "early_bird" || kind === "regular") return kind;
  return null;
}

function classifySubscriptionSeats(
  subscription: Stripe.Subscription,
  plan?: PaymentPlanSummary | null,
  period?: PaymentPlanBillingPeriod,
): ClassifiedSeats {
  const billingPeriod = period ?? parsePeriod(subscription.metadata.period);
  const ebCents = plan
    ? eurosToCents(getPaymentPlanPriceForPeriod(plan, billingPeriod, { earlyBird: true }))
    : null;
  const regCents = plan
    ? eurosToCents(getPaymentPlanPriceForPeriod(plan, billingPeriod))
    : null;
  const items = subscription.items.data;
  const legacySingle = items.length === 1 && !productSeatKind(items[0]?.price?.product);

  let earlyBird = 0;
  let regular = 0;
  let earlyBirdItemId: string | null = null;
  let regularItemId: string | null = null;

  for (const item of items) {
    const qty = item.quantity ?? 0;
    if (qty <= 0) continue;
    let kind = productSeatKind(item.price?.product);
    if (!kind && legacySingle) {
      kind = subscription.metadata.earlyBird === "1" ? "early_bird" : "regular";
    }
    if (!kind && ebCents != null && item.price?.unit_amount === ebCents && ebCents !== regCents) {
      kind = "early_bird";
    }
    if (!kind) kind = "regular";
    if (kind === "early_bird") {
      earlyBird += qty;
      earlyBirdItemId = item.id;
    } else {
      regular += qty;
      regularItemId = item.id;
    }
  }

  return {
    earlyBird,
    regular,
    total: earlyBird + regular,
    earlyBirdItemId,
    regularItemId,
  };
}

async function retrieveExpandedSubscription(subscriptionId: string) {
  const stripe = await getStripeClient();
  if (!stripe) return null;
  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price.product"],
    });
  } catch (error) {
    logError("retrieveExpandedSubscription", stripeClientErrorKey(error));
    return null;
  }
}

function subscriptionPeriodEndMs(subscription: Stripe.Subscription): number | null {
  const item = subscription.items.data[0] as
    | { current_period_end?: number }
    | undefined;
  const fromItem = item?.current_period_end;
  const fromSub = (subscription as { current_period_end?: number }).current_period_end;
  const unix = fromItem ?? fromSub;
  return typeof unix === "number" && unix > 0 ? unix * 1000 : null;
}

function isSubscriptionPaid(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing" || status === "past_due";
}

export async function loadTeamBillingRow(teamId: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("teams")
    .select(
      "id, name, payment_plan_id, payment_plan_until, payment_plan_paid, payment_plan_is_trial, payment_plan_is_early_bird, early_bird_seat_count, stripe_customer_id, stripe_subscription_id, paid_seat_count, billing_period, billing_cycle_end",
    )
    .eq("id", teamId)
    .maybeSingle();
  if (error) {
    logError("loadTeamBillingRow", error.message);
    return null;
  }
  return data as TeamBillingRow | null;
}

export async function loadTeamMembersForSeats(teamId: string) {
  if (!isSupabaseAdminConfigured()) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("team_members")
    .select("id, email, name, user_id, seat_status, created_at")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });
  if (error) {
    logError("loadTeamMembersForSeats", error.message);
    return [];
  }
  return (data ?? []) as Array<{
    id: string;
    email: string;
    name: string;
    user_id: string | null;
    seat_status: string | null;
    created_at: string;
  }>;
}

export function recurringPriceData(
  plan: PaymentPlanSummary,
  period: PaymentPlanBillingPeriod,
  options: { earlyBird: boolean; languageCode?: string },
) {
  const euros = getPaymentPlanPriceForPeriod(plan, period, {
    earlyBird: options.earlyBird,
  });
  if (euros <= 0) return null;
  const name = resolveLocalizedValue(
    plan.nameValues,
    options.languageCode ?? DEFAULT_LANGUAGE,
  );
  const seatKind = options.earlyBird ? "early_bird" : "regular";
  return {
    currency: "eur" as const,
    unit_amount: eurosToCents(euros),
    product_data: {
      name: name
        ? options.earlyBird
          ? `${name} Early Bird`
          : name
        : plan.planKey,
      metadata: { seatKind },
    },
    recurring:
      period === "year"
        ? { interval: "year" as const, interval_count: 1 }
        : period === "quarter"
          ? { interval: "month" as const, interval_count: 3 }
          : { interval: "month" as const, interval_count: 1 },
  };
}

export function remainingEarlyBirdForCheckout(
  remaining: number,
  plan: PaymentPlanSummary,
  period: PaymentPlanBillingPeriod,
  languageCode?: string,
) {
  if (remaining < 1) return 0;
  return recurringPriceData(plan, period, {
    earlyBird: true,
    languageCode,
  })
    ? remaining
    : 0;
}

async function createRecurringPriceId(
  stripe: Stripe,
  plan: PaymentPlanSummary,
  period: PaymentPlanBillingPeriod,
  options: { earlyBird: boolean; languageCode?: string },
) {
  const data = recurringPriceData(plan, period, options);
  if (!data) return null;
  try {
    const price = await stripe.prices.create({
      currency: data.currency,
      unit_amount: data.unit_amount,
      product_data: data.product_data,
      recurring: data.recurring,
    });
    return price.id;
  } catch (error) {
    logError("createRecurringPriceId", stripeClientErrorKey(error));
    return null;
  }
}

export async function applySubscriptionToTeam(input: {
  teamId: string;
  subscription: Stripe.Subscription;
  planId?: string | null;
  period?: PaymentPlanBillingPeriod | null;
  isEarlyBird?: boolean;
}) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  const previous = await loadTeamBillingRow(input.teamId);
  const period = input.period ?? parsePeriod(input.subscription.metadata.period);
  const planId = input.planId || previous?.payment_plan_id || input.subscription.metadata.planId || null;
  const plans = await listPaymentPlans();
  const plan = plans.find((item) => item.id === planId) ?? null;
  const seats = classifySubscriptionSeats(input.subscription, plan, period);
  const quantity = seats.total;
  const paid = isSubscriptionPaid(input.subscription.status);
  const periodEndMs = subscriptionPeriodEndMs(input.subscription);
  const until =
    paid && input.subscription.status !== "past_due"
      ? null
      : periodEndMs
        ? new Date(periodEndMs).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);

  const patch: Record<string, unknown> = {
    stripe_customer_id:
      typeof input.subscription.customer === "string"
        ? input.subscription.customer
        : input.subscription.customer?.id ?? null,
    stripe_subscription_id: input.subscription.id,
    paid_seat_count: quantity,
    early_bird_seat_count: seats.earlyBird,
    payment_plan_is_early_bird: seats.earlyBird > 0,
    billing_cycle_end: periodEndMs
      ? new Date(periodEndMs).toISOString().slice(0, 10)
      : null,
    payment_plan_paid: paid,
    payment_plan_is_trial: input.subscription.status === "trialing",
    updated_at: new Date().toISOString(),
  };
  if (planId) {
    patch.payment_plan_id = planId;
  }
  if (input.period) {
    patch.billing_period = input.period;
  }
  if (!paid) {
    patch.payment_plan_until = until;
    if (
      input.subscription.status === "canceled" ||
      input.subscription.status === "unpaid" ||
      input.subscription.status === "incomplete_expired"
    ) {
      patch.stripe_subscription_id = null;
    }
  } else if (input.subscription.status !== "past_due") {
    patch.payment_plan_until = null;
  }

  const { error } = await admin.from("teams").update(patch).eq("id", input.teamId);
  if (error) {
    logError("applySubscriptionToTeam", error.message);
    return;
  }

  const previousEarlyBird = previous?.early_bird_seat_count ?? 0;
  if (seats.earlyBird > previousEarlyBird) {
    await claimEarlyBirdSeats(seats.earlyBird - previousEarlyBird);
    revalidatePath("/");
  }

  if (paid && quantity > 0) {
    await unlockPaidSeatsForTeam(input.teamId, quantity);
  }
}

export async function syncSubscriptionById(subscriptionId: string, teamIdHint?: string) {
  const subscription = await retrieveExpandedSubscription(subscriptionId);
  if (!subscription) return;
  const teamId =
    teamIdHint ||
    subscription.metadata.teamId ||
    (await findTeamIdBySubscription(subscriptionId));
  if (!teamId) return;
  await applySubscriptionToTeam({
    teamId,
    subscription,
    planId: subscription.metadata.planId || null,
    period: parsePeriod(subscription.metadata.period),
  });
}

async function findTeamIdBySubscription(subscriptionId: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId)
    .maybeSingle();
  return typeof data?.id === "string" ? data.id : null;
}

export async function findTeamIdByCustomer(customerId: string) {
  if (!isSupabaseAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("teams")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return typeof data?.id === "string" ? data.id : null;
}

export async function markTeamUnpaid(teamId: string) {
  if (!isSupabaseAdminConfigured()) return;
  const admin = createAdminClient();
  await admin
    .from("teams")
    .update({
      payment_plan_paid: false,
      payment_plan_until: new Date().toISOString().slice(0, 10),
      updated_at: new Date().toISOString(),
    })
    .eq("id", teamId);
}

export async function ensureStripeCustomer(input: {
  team: TeamBillingRow;
  email: string;
  name: string;
}) {
  const stripe = await getStripeClient();
  if (!stripe) return null;

  if (input.team.stripe_customer_id) {
    try {
      const existing = await stripe.customers.retrieve(input.team.stripe_customer_id);
      if (!("deleted" in existing && existing.deleted)) {
        return input.team.stripe_customer_id;
      }
    } catch (error) {
      // Stale id after test/live key switch — recreate below.
      logError("ensureStripeCustomer.retrieve", error);
    }
  }

  try {
    const customer = await stripe.customers.create({
      email: input.email,
      name: input.name,
      metadata: { teamId: input.team.id },
    });
    if (!isSupabaseAdminConfigured()) return customer.id;
    const admin = createAdminClient();
    await admin
      .from("teams")
      .update({
        stripe_customer_id: customer.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.team.id);
    return customer.id;
  } catch (error) {
    logError("ensureStripeCustomer", error);
    return null;
  }
}

export async function createSeatCheckoutSession(input: {
  team: TeamBillingRow;
  plan: PaymentPlanSummary;
  period: PaymentPlanBillingPeriod;
  quantity: number;
  customerId: string;
  remainingEarlyBird: number;
  languageCode?: string;
}) {
  const stripe = await getStripeClient();
  if (!stripe) {
    return { ok: false as const, error: await stripeUnavailableError() };
  }
  if (input.quantity < 1) {
    return { ok: false as const, error: "errors.billing_only_free_seat" };
  }
  const split = splitEarlyBirdPurchase(input.quantity, input.remainingEarlyBird);
  const lineItems: Array<{
    price_data: NonNullable<ReturnType<typeof recurringPriceData>>;
    quantity: number;
  }> = [];
  if (split.earlyBird > 0) {
    const price = recurringPriceData(input.plan, input.period, {
      earlyBird: true,
      languageCode: input.languageCode,
    });
    if (!price) {
      return { ok: false as const, error: "errors.billing_no_paid_plan" };
    }
    lineItems.push({ price_data: price, quantity: split.earlyBird });
  }
  if (split.regular > 0) {
    const price = recurringPriceData(input.plan, input.period, {
      earlyBird: false,
      languageCode: input.languageCode,
    });
    if (!price) {
      return { ok: false as const, error: "errors.billing_no_paid_plan" };
    }
    lineItems.push({ price_data: price, quantity: split.regular });
  }
  if (lineItems.length === 0) {
    return { ok: false as const, error: "errors.billing_only_free_seat" };
  }

  const origin = getPublicSiteUrl();
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: input.customerId,
      client_reference_id: input.team.id,
      success_url: `${origin}/team/billing?checkout=success`,
      cancel_url: `${origin}/team/billing?checkout=cancel`,
      line_items: lineItems,
      metadata: {
        teamId: input.team.id,
        planId: input.plan.id,
        period: input.period,
        earlyBird: split.earlyBird > 0 ? "1" : "0",
        earlyBirdQty: String(split.earlyBird),
        purpose: "subscribe",
      },
      subscription_data: {
        metadata: {
          teamId: input.team.id,
          planId: input.plan.id,
          period: input.period,
          earlyBird: split.earlyBird > 0 ? "1" : "0",
          earlyBirdQty: String(split.earlyBird),
        },
      },
    });

    if (!session.url) {
      return { ok: false as const, error: "errors.integrations_stripe_checkout_failed" };
    }
    return { ok: true as const, url: session.url };
  } catch (error) {
    logError("createSeatCheckoutSession", error);
    return { ok: false as const, error: stripeClientErrorKey(error) };
  }
}

export async function invoiceAdditionalSeats(input: {
  team: TeamBillingRow;
  extraSeatCount: number;
  plan: PaymentPlanSummary;
  remainingEarlyBird: number;
  languageCode?: string;
}) {
  const stripe = await getStripeClient();
  if (!stripe) {
    return { ok: false as const, error: await stripeUnavailableError() };
  }
  if (!input.team.stripe_subscription_id) {
    return { ok: false as const, error: "errors.billing_no_subscription" };
  }
  if (input.extraSeatCount < 1) {
    return { ok: false as const, error: "errors.billing_no_pending_seats" };
  }

  const subscription = await retrieveExpandedSubscription(
    input.team.stripe_subscription_id,
  );
  if (!subscription) {
    return { ok: false as const, error: await stripeUnavailableError() };
  }
  const period = parsePeriod(input.team.billing_period);
  const seats = classifySubscriptionSeats(subscription, input.plan, period);
  const split = splitEarlyBirdPurchase(input.extraSeatCount, input.remainingEarlyBird);
  const items: Stripe.SubscriptionUpdateParams.Item[] = [];

  const nextEb = seats.earlyBird + split.earlyBird;
  const nextReg = seats.regular + split.regular;

  if (split.earlyBird > 0) {
    if (seats.earlyBirdItemId) {
      items.push({ id: seats.earlyBirdItemId, quantity: nextEb });
    } else {
      const priceId = await createRecurringPriceId(stripe, input.plan, period, {
        earlyBird: true,
        languageCode: input.languageCode,
      });
      if (!priceId) {
        return { ok: false as const, error: "errors.billing_no_paid_plan" };
      }
      items.push({ price: priceId, quantity: split.earlyBird });
    }
  }
  if (split.regular > 0) {
    if (seats.regularItemId) {
      items.push({ id: seats.regularItemId, quantity: nextReg });
    } else {
      const priceId = await createRecurringPriceId(stripe, input.plan, period, {
        earlyBird: false,
        languageCode: input.languageCode,
      });
      if (!priceId) {
        return { ok: false as const, error: "errors.billing_no_paid_plan" };
      }
      items.push({ price: priceId, quantity: split.regular });
    }
  }
  if (items.length === 0) {
    return { ok: false as const, error: "errors.billing_no_pending_seats" };
  }

  try {
    const updated = await stripe.subscriptions.update(subscription.id, {
      items,
      proration_behavior: "always_invoice",
      metadata: {
        ...subscription.metadata,
        teamId: input.team.id,
        earlyBird: nextEb > 0 ? "1" : "0",
        earlyBirdQty: String(nextEb),
      },
      expand: ["items.data.price.product"],
    });

    const invoiceId =
      typeof updated.latest_invoice === "string"
        ? updated.latest_invoice
        : updated.latest_invoice?.id;
    if (invoiceId) {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      if (invoice.status === "open" && invoice.hosted_invoice_url) {
        return { ok: true as const, url: invoice.hosted_invoice_url };
      }
      if (invoice.status === "paid" || invoice.status === "void") {
        await applySubscriptionToTeam({
          teamId: input.team.id,
          subscription: updated,
          planId: updated.metadata.planId || input.team.payment_plan_id,
          period: parsePeriod(updated.metadata.period || input.team.billing_period),
        });
        return { ok: true as const, url: `${getPublicSiteUrl()}/team/billing?checkout=success` };
      }
    }
  } catch (error) {
    logError("invoiceAdditionalSeats", stripeClientErrorKey(error));
    return { ok: false as const, error: stripeClientErrorKey(error) };
  }

  return { ok: false as const, error: "errors.integrations_stripe_checkout_failed" };
}

export async function dropUnusedSeatsAtRenewal(input: {
  teamId: string;
  subscription: Stripe.Subscription;
}) {
  const stripe = await getStripeClient();
  if (!stripe) return;
  const team = await loadTeamBillingRow(input.teamId);
  const plans = await listPaymentPlans();
  const period = parsePeriod(team?.billing_period || input.subscription.metadata.period);
  const plan = plans.find((item) => item.id === (team?.payment_plan_id || input.subscription.metadata.planId)) ?? null;
  const expanded =
    input.subscription.items.data.some((item) => typeof item.price?.product !== "object")
      ? await retrieveExpandedSubscription(input.subscription.id)
      : input.subscription;
  if (!expanded) return;

  const seats = classifySubscriptionSeats(expanded, plan, period);
  const members = await loadTeamMembersForSeats(input.teamId);
  const occupied = countOccupiedSeats(
    members.map((row) => ({ seatStatus: row.seat_status })),
  );
  const nextQuantity = renewalSeatQuantity(occupied, seats.total);
  if (nextQuantity >= seats.total) return;

  if (nextQuantity < 1) {
    try {
      await stripe.subscriptions.cancel(expanded.id);
    } catch (error) {
      logError("dropUnusedSeatsAtRenewal.cancel", stripeClientErrorKey(error));
    }
    return;
  }

  const nextEb = keptEarlyBirdSeatsAfterRenewal({
    occupiedSeatCount: nextQuantity,
    earlyBirdSeatCount: seats.earlyBird,
  });
  const nextReg = Math.max(0, nextQuantity - nextEb);
  const items: Stripe.SubscriptionUpdateParams.Item[] = [];
  if (seats.earlyBirdItemId) {
    if (nextEb > 0) {
      items.push({ id: seats.earlyBirdItemId, quantity: nextEb });
    } else {
      items.push({ id: seats.earlyBirdItemId, deleted: true });
    }
  } else if (nextEb > 0 && plan) {
    const priceId = await createRecurringPriceId(stripe, plan, period, {
      earlyBird: true,
    });
    if (priceId) items.push({ price: priceId, quantity: nextEb });
  }
  if (nextReg > 0) {
    if (seats.regularItemId) {
      items.push({ id: seats.regularItemId, quantity: nextReg });
    } else if (plan) {
      const priceId = await createRecurringPriceId(stripe, plan, period, {
        earlyBird: false,
      });
      if (priceId) items.push({ price: priceId, quantity: nextReg });
    }
  } else if (seats.regularItemId) {
    items.push({ id: seats.regularItemId, deleted: true });
  }
  if (items.length === 0) return;

  try {
    await stripe.subscriptions.update(expanded.id, {
      items,
      proration_behavior: "none",
      metadata: {
        ...expanded.metadata,
        teamId: input.teamId,
        earlyBird: nextEb > 0 ? "1" : "0",
        earlyBirdQty: String(nextEb),
      },
    });
  } catch (error) {
    logError("dropUnusedSeatsAtRenewal", stripeClientErrorKey(error));
  }
}

export function seatStatusFromRow(value: string | null): SeatStatus {
  return value === "pending_payment" ? "pending_payment" : "active";
}

export { parsePeriod, resolveSeatCounts, subscriptionPeriodEndMs };
