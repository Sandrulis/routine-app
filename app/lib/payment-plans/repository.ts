import { cache } from "react";
import {
  DEFAULT_TRIAL_DAYS,
  MAX_TRIAL_DAYS,
  MIN_TRIAL_DAYS,
  normalizeLocalizedValues,
  parseLocalizedValues,
  parsePaymentPlanPrice,
  type EarlyBirdAvailability,
  type EarlyBirdSettings,
  type PaymentPlanInput,
  type PaymentPlanSummary,
  type TrialSettings,
} from "@/app/lib/payment-plans/helpers";
import { createClient as createUserServerClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import type { ActionResult } from "@/app/lib/actions/action-result";

export type {
  EarlyBirdAvailability,
  EarlyBirdSettings,
  LocalizedValues,
  PaymentPlanBillingPeriod,
  PaymentPlanInput,
  PaymentPlanSummary,
  TrialSettings,
} from "@/app/lib/payment-plans/helpers";
export {
  DEFAULT_TRIAL_DAYS,
  MAX_TRIAL_DAYS,
  MIN_TRIAL_DAYS,
  addDaysToTodayIso,
  formatPlanEuro,
  getPaymentPlanPriceForPeriod,
  isEarlyBirdOfferAvailable,
  listAvailablePaymentPlanBillingPeriods,
  parsePaymentPlanPrice,
  resolveLocalizedValue,
  toDateInputValue,
} from "@/app/lib/payment-plans/helpers";

type PaymentPlanRow = {
  id: string;
  plan_key: string;
  name_values: unknown;
  description_values: unknown;
  price_month: number | string | null;
  price_quarter: number | string | null;
  price_year: number | string | null;
  early_bird_price_month: number | string | null;
  early_bird_price_quarter: number | string | null;
  early_bird_price_year: number | string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type PlanModuleRow = {
  plan_id: string;
  module_key: string;
};

const PLAN_KEY_PATTERN = /^[a-z0-9._:-]+$/;

const PLAN_SELECT =
  "id, plan_key, name_values, description_values, price_month, price_quarter, price_year, early_bird_price_month, early_bird_price_quarter, early_bird_price_year, sort_order, created_at, updated_at";

function normalizePlanKey(value: string): string {
  return value.trim().toLowerCase();
}

function validatePlanKey(planKey: string): string | null {
  if (!planKey) {
    return "errors.payment_plan_key_required";
  }
  if (planKey.length > 64 || !PLAN_KEY_PATTERN.test(planKey)) {
    return "errors.payment_plan_key_invalid";
  }
  return null;
}

function mapPaymentPlanRow(
  row: PaymentPlanRow,
  moduleKeys: string[],
): PaymentPlanSummary {
  return {
    id: row.id,
    planKey: row.plan_key,
    nameValues: parseLocalizedValues(row.name_values),
    descriptionValues: parseLocalizedValues(row.description_values),
    moduleKeys,
    priceMonth: parsePaymentPlanPrice(row.price_month) ?? 0,
    priceQuarter: parsePaymentPlanPrice(row.price_quarter) ?? 0,
    priceYear: parsePaymentPlanPrice(row.price_year) ?? 0,
    earlyBirdPriceMonth: parsePaymentPlanPrice(row.early_bird_price_month) ?? 0,
    earlyBirdPriceQuarter:
      parsePaymentPlanPrice(row.early_bird_price_quarter) ?? 0,
    earlyBirdPriceYear: parsePaymentPlanPrice(row.early_bird_price_year) ?? 0,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizePlanPrices(input: PaymentPlanInput):
  | {
      ok: true;
      prices: {
        price_month: number;
        price_quarter: number;
        price_year: number;
        early_bird_price_month: number;
        early_bird_price_quarter: number;
        early_bird_price_year: number;
      };
    }
  | { ok: false; error: string } {
  const parseOptional = (value: number | string): number | null => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return 0;
    return parsePaymentPlanPrice(value);
  };

  const priceMonth = parseOptional(input.priceMonth);
  const priceQuarter = parseOptional(input.priceQuarter);
  const priceYear = parseOptional(input.priceYear);
  const earlyBirdPriceMonth = parseOptional(input.earlyBirdPriceMonth);
  const earlyBirdPriceQuarter = parseOptional(input.earlyBirdPriceQuarter);
  const earlyBirdPriceYear = parseOptional(input.earlyBirdPriceYear);

  if (
    priceMonth === null ||
    priceQuarter === null ||
    priceYear === null ||
    earlyBirdPriceMonth === null ||
    earlyBirdPriceQuarter === null ||
    earlyBirdPriceYear === null
  ) {
    return { ok: false, error: "errors.payment_plan_price_invalid" };
  }

  if (priceMonth <= 0 && priceQuarter <= 0 && priceYear <= 0) {
    return { ok: false, error: "errors.payment_plan_price_period_required" };
  }

  return {
    ok: true,
    prices: {
      price_month: priceMonth,
      price_quarter: priceQuarter,
      price_year: priceYear,
      early_bird_price_month: earlyBirdPriceMonth,
      early_bird_price_quarter: earlyBirdPriceQuarter,
      early_bird_price_year: earlyBirdPriceYear,
    },
  };
}

function normalizeTrialDays(value: unknown): number {
  const parsed =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) {
    return DEFAULT_TRIAL_DAYS;
  }
  return Math.min(MAX_TRIAL_DAYS, Math.max(MIN_TRIAL_DAYS, Math.trunc(parsed)));
}

export async function isPaymentPlansEnabled(): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }
  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("payment_plans_enabled")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) {
    return false;
  }
  return data.payment_plans_enabled === true;
}

export const getPaymentPlansEnabledCached = cache(isPaymentPlansEnabled);

export async function setPaymentPlansEnabled(
  enabled: boolean,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  const supabase = await createUserServerClient();
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, payment_plans_enabled: enabled === true },
    { onConflict: "id" },
  );
  if (error) {
    console.error("setPaymentPlansEnabled failed:", error.message);
    return { ok: false, error: "errors.payment_plans_enable_save_failed" };
  }
  return { ok: true };
}

export const getTrialSettings = cache(async (): Promise<TrialSettings> => {
  if (!isSupabaseConfigured()) {
    return { trialPlanId: null, trialDays: DEFAULT_TRIAL_DAYS };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("trial_plan_id, trial_days")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    return { trialPlanId: null, trialDays: DEFAULT_TRIAL_DAYS };
  }

  return {
    trialPlanId:
      typeof data.trial_plan_id === "string" && data.trial_plan_id.trim()
        ? data.trial_plan_id
        : null,
    trialDays: normalizeTrialDays(data.trial_days),
  };
});

export async function saveTrialSettings(
  input: TrialSettings,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const planId = input.trialPlanId?.trim() || null;
  const rawDays =
    typeof input.trialDays === "number"
      ? input.trialDays
      : Number.parseInt(String(input.trialDays ?? ""), 10);

  const daysInvalid =
    !Number.isFinite(rawDays) ||
    !Number.isInteger(rawDays) ||
    rawDays < MIN_TRIAL_DAYS ||
    rawDays > MAX_TRIAL_DAYS;

  if (planId && daysInvalid) {
    return { ok: false, error: "errors.trial_days_invalid" };
  }

  const days = daysInvalid ? normalizeTrialDays(rawDays) : rawDays;

  if (planId) {
    const plans = await listPaymentPlans();
    if (!plans.some((plan) => plan.id === planId)) {
      return { ok: false, error: "errors.payment_plan_not_found" };
    }
  }

  const supabase = await createUserServerClient();
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, trial_plan_id: planId, trial_days: days },
    { onConflict: "id" },
  );

  if (error) {
    console.error("saveTrialSettings failed:", error.message);
    return { ok: false, error: "errors.trial_settings_save_failed" };
  }

  return { ok: true };
}

export async function countEarlyBirdTeams(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }
  const supabase = await createUserServerClient();
  const { count, error } = await supabase
    .from("teams")
    .select("id", { count: "exact", head: true })
    .eq("payment_plan_is_early_bird", true);
  if (error || count == null) {
    return 0;
  }
  return count;
}

export const getEarlyBirdSettings = cache(
  async (): Promise<EarlyBirdAvailability> => {
    if (!isSupabaseConfigured()) {
      return { limit: 0, claimed: 0 };
    }

    const supabase = await createUserServerClient();
    const [{ data, error }, claimed] = await Promise.all([
      supabase
        .from("site_settings")
        .select("early_bird_limit")
        .eq("id", 1)
        .maybeSingle(),
      countEarlyBirdTeams(),
    ]);

    if (error || !data) {
      return { limit: 0, claimed };
    }

    const raw = data.early_bird_limit;
    const parsed =
      typeof raw === "number" ? raw : Number.parseInt(String(raw ?? ""), 10);
    const limit =
      Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;

    return { limit, claimed };
  },
);

export async function saveEarlyBirdSettings(
  input: EarlyBirdSettings,
): Promise<ActionResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const raw =
    typeof input.limit === "number"
      ? input.limit
      : Number.parseInt(String(input.limit ?? ""), 10);

  if (!Number.isFinite(raw) || !Number.isInteger(raw) || raw < 0) {
    return { ok: false, error: "errors.early_bird_limit_invalid" };
  }

  const supabase = await createUserServerClient();
  const { error } = await supabase.from("site_settings").upsert(
    { id: 1, early_bird_limit: raw },
    { onConflict: "id" },
  );

  if (error) {
    console.error("saveEarlyBirdSettings failed:", error.message);
    return { ok: false, error: "errors.early_bird_save_failed" };
  }

  return { ok: true };
}

async function listPlanModuleRows(): Promise<PlanModuleRow[]> {
  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_payment_plan_modules")
    .select("plan_id, module_key");
  if (error || !data) {
    return [];
  }
  return data as PlanModuleRow[];
}

export async function listPaymentPlans(): Promise<PaymentPlanSummary[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = await createUserServerClient();
  const [{ data, error }, moduleRows] = await Promise.all([
    supabase
      .from("site_payment_plans")
      .select(PLAN_SELECT)
      .order("sort_order", { ascending: true })
      .order("plan_key", { ascending: true }),
    listPlanModuleRows(),
  ]);

  if (error || !data) {
    if (error) {
      console.error("listPaymentPlans failed:", error.message);
    }
    return [];
  }

  const modulesByPlan = new Map<string, string[]>();
  for (const row of moduleRows) {
    const list = modulesByPlan.get(row.plan_id) ?? [];
    list.push(row.module_key);
    modulesByPlan.set(row.plan_id, list);
  }

  return (data as PaymentPlanRow[]).map((row) =>
    mapPaymentPlanRow(row, (modulesByPlan.get(row.id) ?? []).sort()),
  );
}

async function replacePlanModules(
  planId: string,
  moduleKeys: string[],
): Promise<ActionResult> {
  const supabase = await createUserServerClient();
  const { error: deleteError } = await supabase
    .from("site_payment_plan_modules")
    .delete()
    .eq("plan_id", planId);
  if (deleteError) {
    console.error("replacePlanModules delete failed:", deleteError.message);
    return { ok: false, error: "errors.payment_plan_modules_save_failed" };
  }

  const uniqueKeys = [
    ...new Set(moduleKeys.map((key) => key.trim()).filter(Boolean)),
  ];
  if (uniqueKeys.length === 0) {
    return { ok: true };
  }

  const { error: insertError } = await supabase
    .from("site_payment_plan_modules")
    .insert(
      uniqueKeys.map((module_key) => ({
        plan_id: planId,
        module_key,
      })),
    );
  if (insertError) {
    console.error("replacePlanModules insert failed:", insertError.message);
    return { ok: false, error: "errors.payment_plan_modules_save_failed" };
  }
  return { ok: true };
}

export async function createPaymentPlan(
  input: PaymentPlanInput,
): Promise<{ ok: true; plan: PaymentPlanSummary } | { ok: false; error: string }> {
  const planKey = normalizePlanKey(input.planKey);
  const keyError = validatePlanKey(planKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  const nameValues = normalizeLocalizedValues(input.nameValues);
  if (!Object.values(nameValues).some((value) => value.trim())) {
    return { ok: false, error: "errors.payment_plan_name_required" };
  }

  const pricesResult = normalizePlanPrices(input);
  if (!pricesResult.ok) {
    return pricesResult;
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const existing = await listPaymentPlans();
  const nextSortOrder =
    Math.max(0, ...existing.map((plan) => plan.sortOrder)) + 10;

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_payment_plans")
    .insert({
      plan_key: planKey,
      name_values: nameValues,
      description_values: normalizeLocalizedValues(input.descriptionValues),
      sort_order: nextSortOrder,
      ...pricesResult.prices,
    })
    .select(PLAN_SELECT)
    .single();

  if (error || !data) {
    console.error("createPaymentPlan failed:", error?.message, error?.code);
    if (error?.code === "23505") {
      return { ok: false, error: "errors.payment_plan_key_exists" };
    }
    return { ok: false, error: "errors.payment_plan_create_failed" };
  }

  const modulesResult = await replacePlanModules(data.id, input.moduleKeys);
  if (!modulesResult.ok) {
    await supabase.from("site_payment_plans").delete().eq("id", data.id);
    return modulesResult;
  }

  const plan = (await listPaymentPlans()).find((item) => item.id === data.id);
  if (!plan) {
    return { ok: false, error: "errors.payment_plan_create_failed" };
  }
  return { ok: true, plan };
}

export async function updatePaymentPlan(
  planId: string,
  input: PaymentPlanInput,
): Promise<{ ok: true; plan: PaymentPlanSummary } | { ok: false; error: string }> {
  const trimmedId = planId.trim();
  if (!trimmedId) {
    return { ok: false, error: "errors.payment_plan_id_required" };
  }

  const planKey = normalizePlanKey(input.planKey);
  const keyError = validatePlanKey(planKey);
  if (keyError) {
    return { ok: false, error: keyError };
  }

  const nameValues = normalizeLocalizedValues(input.nameValues);
  if (!Object.values(nameValues).some((value) => value.trim())) {
    return { ok: false, error: "errors.payment_plan_name_required" };
  }

  const pricesResult = normalizePlanPrices(input);
  if (!pricesResult.ok) {
    return pricesResult;
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { error } = await supabase
    .from("site_payment_plans")
    .update({
      plan_key: planKey,
      name_values: nameValues,
      description_values: normalizeLocalizedValues(input.descriptionValues),
      ...pricesResult.prices,
    })
    .eq("id", trimmedId);

  if (error) {
    console.error("updatePaymentPlan failed:", error.message, error.code);
    if (error.code === "23505") {
      return { ok: false, error: "errors.payment_plan_key_exists" };
    }
    return { ok: false, error: "errors.payment_plan_save_failed" };
  }

  const modulesResult = await replacePlanModules(trimmedId, input.moduleKeys);
  if (!modulesResult.ok) {
    return modulesResult;
  }

  const plan = (await listPaymentPlans()).find((item) => item.id === trimmedId);
  if (!plan) {
    return { ok: false, error: "errors.payment_plan_save_failed" };
  }
  return { ok: true, plan };
}

export async function deletePaymentPlan(
  planId: string,
): Promise<ActionResult> {
  const trimmedId = planId.trim();
  if (!trimmedId) {
    return { ok: false, error: "errors.payment_plan_id_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const supabase = await createUserServerClient();
  const { data, error } = await supabase
    .from("site_payment_plans")
    .delete()
    .eq("id", trimmedId)
    .select("id");

  if (error) {
    console.error("deletePaymentPlan failed:", error.message);
    return { ok: false, error: "errors.payment_plan_delete_failed" };
  }
  if (!data || data.length === 0) {
    return { ok: false, error: "errors.payment_plan_not_found" };
  }
  return { ok: true };
}
