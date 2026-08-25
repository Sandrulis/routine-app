import { formatEuro } from "@/app/lib/format/numbers";
export type { LocalizedValues } from "@/app/lib/i18n/localized-values";
export {
  emptyLocalizedValuesForCodes,
  normalizeLocalizedValues,
  parseLocalizedValues,
  resolveLocalizedValue,
} from "@/app/lib/i18n/localized-values";
import type { LocalizedValues } from "@/app/lib/i18n/localized-values";

export type PaymentPlanSummary = {
  id: string;
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
  isFree: boolean;
  maxMembers: number;
  priceMonth: number;
  priceQuarter: number;
  priceYear: number;
  earlyBirdPriceMonth: number;
  earlyBirdPriceQuarter: number;
  earlyBirdPriceYear: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PaymentPlanInput = {
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
  isFree: boolean;
  maxMembers: number | string;
  priceMonth: number | string;
  priceQuarter: number | string;
  priceYear: number | string;
  earlyBirdPriceMonth: number | string;
  earlyBirdPriceQuarter: number | string;
  earlyBirdPriceYear: number | string;
};

export type PaymentPlanBillingPeriod = "month" | "quarter" | "year";

export type EarlyBirdSettings = {
  limit: number;
};

export type EarlyBirdAvailability = EarlyBirdSettings & {
  claimed: number;
};

export type TrialSettings = {
  trialPlanId: string | null;
  trialDays: number;
};

export const MIN_TRIAL_DAYS = 1;
export const MAX_TRIAL_DAYS = 365;
export const DEFAULT_TRIAL_DAYS = 14;
export const MIN_PLAN_MEMBERS = 1;
export const MAX_PLAN_MEMBERS = 10_000;
export const DEFAULT_PLAN_MEMBERS = 5;

export function parsePaymentPlanMaxMembers(value: unknown): number | null {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }
  if (parsed < MIN_PLAN_MEMBERS || parsed > MAX_PLAN_MEMBERS) {
    return null;
  }
  return parsed;
}

export function parsePaymentPlanPrice(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value < 0) return null;
    return Math.round(value * 100) / 100;
  }

  const trimmed = String(value ?? "")
    .trim()
    .replace(/\s/g, "")
    .replace(",", ".");
  if (!trimmed) return null;

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export function formatPlanEuro(value: number): string {
  return formatEuro(value);
}

export function getPaymentPlanPriceForPeriod(
  plan: Pick<
    PaymentPlanSummary,
    | "priceMonth"
    | "priceQuarter"
    | "priceYear"
    | "earlyBirdPriceMonth"
    | "earlyBirdPriceQuarter"
    | "earlyBirdPriceYear"
  >,
  period: PaymentPlanBillingPeriod,
  options?: { earlyBird?: boolean },
): number {
  if (options?.earlyBird) {
    if (period === "quarter") return plan.earlyBirdPriceQuarter;
    if (period === "year") return plan.earlyBirdPriceYear;
    return plan.earlyBirdPriceMonth;
  }
  if (period === "quarter") return plan.priceQuarter;
  if (period === "year") return plan.priceYear;
  return plan.priceMonth;
}

const BILLING_PERIODS: PaymentPlanBillingPeriod[] = ["month", "quarter", "year"];

export function paymentPlanHasPriceForPeriod(
  plan: Pick<
    PaymentPlanSummary,
    | "priceMonth"
    | "priceQuarter"
    | "priceYear"
    | "earlyBirdPriceMonth"
    | "earlyBirdPriceQuarter"
    | "earlyBirdPriceYear"
  >,
  period: PaymentPlanBillingPeriod,
  options?: { earlyBird?: boolean },
): boolean {
  if (getPaymentPlanPriceForPeriod(plan, period) > 0) {
    return true;
  }
  if (options?.earlyBird) {
    return getPaymentPlanPriceForPeriod(plan, period, { earlyBird: true }) > 0;
  }
  return false;
}

export function listAvailablePaymentPlanBillingPeriods(
  plans: Array<
    Pick<
      PaymentPlanSummary,
      | "priceMonth"
      | "priceQuarter"
      | "priceYear"
      | "earlyBirdPriceMonth"
      | "earlyBirdPriceQuarter"
      | "earlyBirdPriceYear"
    >
  >,
  options?: { earlyBird?: boolean },
): PaymentPlanBillingPeriod[] {
  return BILLING_PERIODS.filter((period) =>
    plans.some((plan) => paymentPlanHasPriceForPeriod(plan, period, options)),
  );
}

export function isEarlyBirdOfferAvailable(
  availability: Pick<EarlyBirdAvailability, "limit" | "claimed">,
): boolean {
  return availability.limit > 0 && availability.claimed < availability.limit;
}

export function addDaysToTodayIso(days: number, todayIso?: string): string {
  const base = todayIso ?? new Date().toISOString().slice(0, 10);
  const date = new Date(`${base}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Math.trunc(days));
  return date.toISOString().slice(0, 10);
}

export function toDateInputValue(value: string | null | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}
