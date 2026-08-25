import type { PaymentPlanSummary } from "@/app/lib/payment-plans/helpers";

export type LandingPricingData = {
  plans: PaymentPlanSummary[];
  earlyBirdAvailable: boolean;
  trialPlanId: string | null;
  trialDays: number;
};

export function shouldShowLandingPricing(
  paymentPlansEnabled: boolean,
  plans: readonly PaymentPlanSummary[],
): boolean {
  return paymentPlansEnabled && plans.length > 0;
}
