import type { PaymentPlanBillingPeriod } from "@/app/lib/payment-plans/helpers";
import { splitEarlyBirdPurchase } from "@/app/lib/payment-plans/helpers";

export type CheckoutPeriodPrices = {
  regular: number;
  earlyBird: number;
};

export function remainingEarlyBirdForPeriodPrices(
  prices: CheckoutPeriodPrices,
  remainingEarlyBirdSeats: number,
): number {
  if (prices.earlyBird <= 0) return 0;
  return Math.max(0, Math.trunc(remainingEarlyBirdSeats));
}

export function estimateSubscriptionCheckoutTotal(input: {
  quantity: number;
  prices: CheckoutPeriodPrices;
  remainingEarlyBirdSeats: number;
}) {
  const quantity = Math.max(0, Math.trunc(input.quantity));
  const remaining = remainingEarlyBirdForPeriodPrices(
    input.prices,
    input.remainingEarlyBirdSeats,
  );
  const split = splitEarlyBirdPurchase(quantity, remaining);
  const total =
    split.earlyBird * input.prices.earlyBird + split.regular * input.prices.regular;

  return {
    quantity,
    earlyBirdCount: split.earlyBird,
    regularCount: split.regular,
    earlyBirdPrice: input.prices.earlyBird,
    regularPrice: input.prices.regular,
    total,
    hasMixedPricing: split.earlyBird > 0 && split.regular > 0,
  };
}

export function checkoutPricesForPeriod(
  plan: { prices: Partial<Record<PaymentPlanBillingPeriod, CheckoutPeriodPrices>> },
  period: PaymentPlanBillingPeriod,
): CheckoutPeriodPrices | null {
  const prices = plan.prices[period];
  if (!prices) return null;
  const regular = prices.regular;
  const earlyBird = prices.earlyBird;
  if (regular <= 0 && earlyBird <= 0) return null;
  return {
    regular: regular > 0 ? regular : earlyBird,
    earlyBird: earlyBird > 0 ? earlyBird : regular,
  };
}
