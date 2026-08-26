"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  createPaymentPlanAction,
  deletePaymentPlanAction,
  saveEarlyBirdSettingsAction,
  saveTrialSettingsAction,
  setPaymentPlansEnabledAction,
  updatePaymentPlanAction,
} from "@/app/(app)/admin/actions";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import { knownFrontendModuleLabel } from "@/app/lib/frontend-modules/keys";
import type { FrontendModuleSummary } from "@/app/lib/frontend-modules/types";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  formatPlanEuro,
  MAX_TRIAL_DAYS,
  MIN_TRIAL_DAYS,
  MAX_PLAN_MEMBERS,
  MIN_PLAN_MEMBERS,
  DEFAULT_PLAN_MEMBERS,
  resolveLocalizedValue,
  type EarlyBirdAvailability,
  type LocalizedValues,
  type PaymentPlanSummary,
  type TrialSettings,
} from "@/app/lib/payment-plans/helpers";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/types";

const fieldBaseClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const fieldClassName = `mt-1.5 ${fieldBaseClassName}`;
const selectClassName = `${fieldBaseClassName} appearance-none pr-10`;

function priceToInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return (Math.round(value * 100) / 100).toFixed(2);
}

function emptyValues(languages: SiteLanguageSummary[]): LocalizedValues {
  return Object.fromEntries(languages.map((language) => [language.code, ""]));
}

function mergeValues(
  languages: SiteLanguageSummary[],
  values: LocalizedValues,
): LocalizedValues {
  const next = emptyValues(languages);
  for (const [code, value] of Object.entries(values)) {
    next[code] = value;
  }
  return next;
}

function valuesEqual(left: LocalizedValues, right: LocalizedValues): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  for (const key of keys) {
    if ((left[key] ?? "").trim() !== (right[key] ?? "").trim()) {
      return false;
    }
  }
  return true;
}

function moduleKeysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every((key) => rightSet.has(key));
}

type PlanDraft = {
  planKey: string;
  nameValues: LocalizedValues;
  descriptionValues: LocalizedValues;
  moduleKeys: string[];
  isFree: boolean;
  maxMembers: string;
  priceMonth: string;
  priceQuarter: string;
  priceYear: string;
  earlyBirdPriceMonth: string;
  earlyBirdPriceQuarter: string;
  earlyBirdPriceYear: string;
};

function draftFromPlan(
  plan: PaymentPlanSummary | null,
  languages: SiteLanguageSummary[],
): PlanDraft {
  if (!plan) {
    return {
      planKey: "",
      nameValues: emptyValues(languages),
      descriptionValues: emptyValues(languages),
      moduleKeys: [],
      isFree: false,
      maxMembers: "",
      priceMonth: "",
      priceQuarter: "",
      priceYear: "",
      earlyBirdPriceMonth: "",
      earlyBirdPriceQuarter: "",
      earlyBirdPriceYear: "",
    };
  }
  return {
    planKey: plan.planKey,
    nameValues: mergeValues(languages, plan.nameValues),
    descriptionValues: mergeValues(languages, plan.descriptionValues),
    moduleKeys: [...plan.moduleKeys],
    isFree: plan.isFree,
    maxMembers: plan.maxMembers == null ? "" : String(plan.maxMembers),
    priceMonth: priceToInput(plan.priceMonth),
    priceQuarter: priceToInput(plan.priceQuarter),
    priceYear: priceToInput(plan.priceYear),
    earlyBirdPriceMonth: priceToInput(plan.earlyBirdPriceMonth),
    earlyBirdPriceQuarter: priceToInput(plan.earlyBirdPriceQuarter),
    earlyBirdPriceYear: priceToInput(plan.earlyBirdPriceYear),
  };
}

function draftsEqual(left: PlanDraft, right: PlanDraft): boolean {
  return (
    left.planKey.trim() === right.planKey.trim() &&
    valuesEqual(left.nameValues, right.nameValues) &&
    valuesEqual(left.descriptionValues, right.descriptionValues) &&
    moduleKeysEqual(left.moduleKeys, right.moduleKeys) &&
    left.isFree === right.isFree &&
    left.maxMembers.trim() === right.maxMembers.trim() &&
    left.priceMonth.trim() === right.priceMonth.trim() &&
    left.priceQuarter.trim() === right.priceQuarter.trim() &&
    left.priceYear.trim() === right.priceYear.trim() &&
    left.earlyBirdPriceMonth.trim() === right.earlyBirdPriceMonth.trim() &&
    left.earlyBirdPriceQuarter.trim() === right.earlyBirdPriceQuarter.trim() &&
    left.earlyBirdPriceYear.trim() === right.earlyBirdPriceYear.trim()
  );
}

function moduleLabel(
  moduleKey: string,
  t: ReturnType<typeof useTranslations>["t"],
): string {
  const known = knownFrontendModuleLabel(moduleKey);
  if (known) return t(known.key, known.fallback);
  const translated = t(`frontend_modules.label.${moduleKey}`, "").trim();
  return translated || moduleKey;
}

function pricePeriodLabel(
  t: ReturnType<typeof useTranslations>["t"],
  periodKey: string,
  periodFallback: string,
): string {
  return `${t(periodKey, periodFallback)} ${t(
    "site_payment_plans.period.per_user",
    "/ lietotājs",
  )}`;
}

export function AdminPaymentPlansForm({
  initialEnabled,
  stripeEnabled = false,
  initialPlans,
  initialTrial,
  initialEarlyBird,
  modules,
  languages,
}: {
  initialEnabled: boolean;
  stripeEnabled?: boolean;
  initialPlans: PaymentPlanSummary[];
  initialTrial: TrialSettings;
  initialEarlyBird: EarlyBirdAvailability;
  modules: FrontendModuleSummary[];
  languages: SiteLanguageSummary[];
}) {
  const { t, languageCode } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [plans, setPlans] = useState(initialPlans);
  const { trialPlanId: initialTrialPlanId, trialDays: initialTrialDays } =
    initialTrial;
  const [trialPlanId, setTrialPlanId] = useState<string | null>(
    initialTrialPlanId,
  );
  const [trialDaysText, setTrialDaysText] = useState(String(initialTrialDays));
  const [savedTrial, setSavedTrial] = useState<TrialSettings>({
    trialPlanId: initialTrialPlanId,
    trialDays: initialTrialDays,
  });
  const [earlyBirdLimitText, setEarlyBirdLimitText] = useState(
    String(initialEarlyBird.limit),
  );
  const [savedEarlyBirdLimit, setSavedEarlyBirdLimit] = useState(
    initialEarlyBird.limit,
  );
  const [earlyBirdClaimed, setEarlyBirdClaimed] = useState(
    initialEarlyBird.claimed,
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PaymentPlanSummary | null>(
    null,
  );
  const [draft, setDraft] = useState<PlanDraft>(() =>
    draftFromPlan(null, languages),
  );
  const [savedDraft, setSavedDraft] = useState<PlanDraft>(() =>
    draftFromPlan(null, languages),
  );
  const [editLang, setEditLang] = useState(
    () =>
      languages.find((language) => language.isDefault)?.code ??
      languages[0]?.code ??
      "lv",
  );
  const [deleteTarget, setDeleteTarget] = useState<PaymentPlanSummary | null>(
    null,
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;

  useEffect(() => {
    setEnabled(initialEnabled);
  }, [initialEnabled]);

  useEffect(() => {
    setPlans(initialPlans);
  }, [initialPlans]);

  useEffect(() => {
    setTrialPlanId(initialTrialPlanId);
    setTrialDaysText(String(initialTrialDays));
    setSavedTrial({
      trialPlanId: initialTrialPlanId,
      trialDays: initialTrialDays,
    });
  }, [initialTrialPlanId, initialTrialDays]);

  useEffect(() => {
    setEarlyBirdLimitText(String(initialEarlyBird.limit));
    setSavedEarlyBirdLimit(initialEarlyBird.limit);
    setEarlyBirdClaimed(initialEarlyBird.claimed);
  }, [initialEarlyBird.limit, initialEarlyBird.claimed]);

  const globallyEnabledModules = useMemo(
    () => modules.filter((module) => module.isEnabled),
    [modules],
  );

  const dirty = !draftsEqual(draft, savedDraft);
  const trialDirty =
    trialPlanId !== savedTrial.trialPlanId ||
    trialDaysText.trim() !== String(savedTrial.trialDays);
  const earlyBirdDirty =
    earlyBirdLimitText.trim() !== String(savedEarlyBirdLimit);

  function openCreate() {
    clearFeedback();
    const next = draftFromPlan(null, languages);
    setEditingPlan(null);
    setDraft(next);
    setSavedDraft(next);
    setEditLang(
      languages.find((language) => language.isDefault)?.code ??
        languages[0]?.code ??
        "lv",
    );
    setEditorOpen(true);
  }

  function openEdit(plan: PaymentPlanSummary) {
    clearFeedback();
    const next = draftFromPlan(plan, languages);
    setEditingPlan(plan);
    setDraft(next);
    setSavedDraft(next);
    setEditLang(
      languages.find((language) => language.isDefault)?.code ??
        languages[0]?.code ??
        "lv",
    );
    setEditorOpen(true);
  }

  function closeEditor() {
    if (isBusy) return;
    setEditorOpen(false);
    setEditingPlan(null);
  }

  function handleEnabledToggle(nextEnabled: boolean) {
    clearFeedback();
    if (nextEnabled && !stripeEnabled) {
      showFeedback({
        type: "error",
        text: translateActionError(t, "errors.payment_plans_stripe_required"),
      });
      return;
    }
    const previous = enabled;
    setEnabled(nextEnabled);

    startTransition(async () => {
      setPendingKey("enabled");
      const result = await setPaymentPlansEnabledAction(nextEnabled);
      setPendingKey(null);

      if (!result.ok) {
        setEnabled(previous);
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      showFeedback({
        type: "success",
        text: t(
          "site_payment_plans.enable.saved",
          "Maksas plānu iestatījums saglabāts.",
        ),
      });
    });
  }

  function handleSaveTrial(event: React.FormEvent) {
    event.preventDefault();
    if (!trialDirty || isBusy) return;
    clearFeedback();

    startTransition(async () => {
      setPendingKey("trial");
      const parsedDays = Number.parseInt(trialDaysText.trim(), 10);
      const result = await saveTrialSettingsAction({
        trialPlanId,
        trialDays: parsedDays,
      });
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setSavedTrial({ trialPlanId, trialDays: parsedDays });
      setTrialDaysText(String(parsedDays));
      showFeedback({
        type: "success",
        text: t(
          "site_payment_plans.trial.saved",
          "Izmēģinājuma iestatījumi saglabāti.",
        ),
      });
    });
  }

  function handleSaveEarlyBird(event: React.FormEvent) {
    event.preventDefault();
    if (!earlyBirdDirty || isBusy) return;
    clearFeedback();

    startTransition(async () => {
      setPendingKey("early-bird");
      const parsedLimit = Number.parseInt(earlyBirdLimitText.trim(), 10);
      const result = await saveEarlyBirdSettingsAction({ limit: parsedLimit });
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setSavedEarlyBirdLimit(parsedLimit);
      setEarlyBirdLimitText(String(parsedLimit));
      showFeedback({
        type: "success",
        text: t(
          "site_payment_plans.early_bird.saved",
          "Early Bird limīts saglabāts.",
        ),
      });
    });
  }

  function handleSavePlan(event: React.FormEvent) {
    event.preventDefault();
    if (!dirty || isBusy) return;
    clearFeedback();

    const priceFields = [
      draft.priceMonth,
      draft.priceYear,
      draft.earlyBirdPriceMonth,
      draft.earlyBirdPriceYear,
    ];
    for (const field of priceFields) {
      const trimmed = field.trim();
      if (!trimmed) continue;
      const parsed = Number(trimmed.replace(/\s/g, "").replace(",", "."));
      if (!Number.isFinite(parsed) || parsed < 0) {
        showFeedback({
          type: "error",
          text: t(
            "errors.payment_plan_price_invalid",
            "Ievadi derīgu cenu (0 vai vairāk) aizpildītajiem periodiem.",
          ),
        });
        return;
      }
    }

    let parsedMaxMembers: number | null = null;
    if (draft.isFree) {
      parsedMaxMembers = Number.parseInt(draft.maxMembers.trim(), 10);
      if (
        !Number.isFinite(parsedMaxMembers) ||
        parsedMaxMembers < MIN_PLAN_MEMBERS ||
        parsedMaxMembers > MAX_PLAN_MEMBERS
      ) {
        showFeedback({
          type: "error",
          text: t(
            "errors.payment_plan_max_members_invalid",
            "Norādi derīgu lietotāju skaitu (no 1 līdz 10 000).",
          ),
        });
        return;
      }
    }

    startTransition(async () => {
      setPendingKey(editingPlan ? `save:${editingPlan.id}` : "create");
      const input = {
        planKey: draft.planKey,
        nameValues: draft.nameValues,
        descriptionValues: draft.descriptionValues,
        moduleKeys: draft.moduleKeys,
        isFree: draft.isFree,
        maxMembers: parsedMaxMembers,
        priceMonth: draft.priceMonth,
        priceQuarter: "0",
        priceYear: draft.priceYear,
        earlyBirdPriceMonth: draft.earlyBirdPriceMonth,
        earlyBirdPriceQuarter: "0",
        earlyBirdPriceYear: draft.earlyBirdPriceYear,
      };
      const result = editingPlan
        ? await updatePaymentPlanAction(editingPlan.id, input)
        : await createPaymentPlanAction(input);
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setPlans((current) => {
        if (editingPlan) {
          return current.map((plan) =>
            plan.id === result.plan.id ? result.plan : plan,
          );
        }
        return [...current, result.plan].sort((left, right) => {
          if (left.sortOrder !== right.sortOrder) {
            return left.sortOrder - right.sortOrder;
          }
          return left.planKey.localeCompare(right.planKey);
        });
      });
      setEditorOpen(false);
      setEditingPlan(null);
      showFeedback({
        type: "success",
        text: editingPlan
          ? t("site_payment_plans.feedback.saved", "Maksas plāns saglabāts.")
          : t(
              "site_payment_plans.feedback.created",
              "Maksas plāns izveidots.",
            ),
      });
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    const planId = deleteTarget.id;

    startTransition(async () => {
      setPendingKey(`delete:${planId}`);
      const result = await deletePaymentPlanAction(planId);
      setPendingKey(null);

      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setPlans((current) => current.filter((plan) => plan.id !== planId));
      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("site_payment_plans.feedback.deleted", "Maksas plāns dzēsts."),
      });
    });
  }

  function toggleModule(moduleKey: string, checked: boolean) {
    setDraft((current) => {
      const nextKeys = checked
        ? [...new Set([...current.moduleKeys, moduleKey])]
        : current.moduleKeys.filter((key) => key !== moduleKey);
      return { ...current, moduleKeys: nextKeys };
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("site_payment_plans.enable.section", "Maksas plāni")}
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_payment_plans.enable.hint",
                "Kad ieslēgts, komandas redz tikai tās moduļus, kas iekļauti aktīvajā maksas plānā. Kad izslēgts, visi globāli ieslēgtie moduļi ir pieejami visām komandām.",
              )}
            </p>
            {!stripeEnabled ? (
              <p className="mt-2 text-xs text-amber-800">
                {t(
                  "site_payment_plans.enable.stripe_required",
                  "Maksas plānus var ieslēgt tikai tad, ja Stripe integrācija ir nokonfigurēta un ieslēgta.",
                )}{" "}
                <Link
                  href="/admin/integrations"
                  className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
                >
                  {t("admin.nav.integrations", "Integrācijas")}
                </Link>
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-700">
              {t("site_payment_plans.enable.label", "Ieslēgt maksas plānus")}
            </span>
            <ToggleSwitch
              checked={enabled}
              disabled={isBusy || (!stripeEnabled && !enabled)}
              label={t(
                "site_payment_plans.enable.label",
                "Ieslēgt maksas plānus",
              )}
              onChange={handleEnabledToggle}
            />
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSaveTrial}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("site_payment_plans.trial.section", "Izmēģinājuma periods")}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {t(
            "site_payment_plans.trial.hint",
            "Jauna komanda pēc reģistrācijas saņem šo plānu uz norādīto dienu skaitu. Bez izmēģinājuma plāna jaunai komandai nav pieejas, kamēr plānu nepiešķir manuāli.",
          )}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t(
                "site_payment_plans.trial.field_plan",
                "Plāns jaunām komandām",
              )}
            </span>
            <div className="relative mt-1.5">
              <select
                value={trialPlanId ?? ""}
                onChange={(event) => setTrialPlanId(event.target.value || null)}
                disabled={isBusy}
                className={`${selectClassName} disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <option value="">
                  {t("site_payment_plans.trial.plan_none", "Bez izmēģinājuma")}
                </option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {resolveLocalizedValue(plan.nameValues, languageCode) ||
                      plan.planKey}
                  </option>
                ))}
              </select>
              <i
                className="fas fa-chevron-down pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
                aria-hidden="true"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.trial.field_days", "Izmēģinājuma dienas")}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={MIN_TRIAL_DAYS}
              max={MAX_TRIAL_DAYS}
              step={1}
              value={trialDaysText}
              onChange={(event) => setTrialDaysText(event.target.value)}
              disabled={isBusy || trialPlanId === null}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            <span className="mt-1 block text-xs text-zinc-500">
              {t("site_payment_plans.trial.days_hint", "No 1 līdz 365 dienām.")}
            </span>
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isBusy || !trialDirty}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === "trial" ? (
              <i
                className="fas fa-circle-notch fa-spin text-xs"
                aria-hidden="true"
              />
            ) : null}
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>

      <form
        onSubmit={handleSaveEarlyBird}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("site_payment_plans.early_bird.section", "Early Bird")}
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          {t(
            "site_payment_plans.early_bird.hint",
            "Kopīgs limīts Early Bird vietām (ne komandām). Vieta kļūst Early Bird pirkuma brīdī, ja poolā vēl ir vietas. Ja lietotāju noņem un līdz cikla beigām vietu neaizpilda, Early Bird vieta pazūd un neatgriežas poolā. 0 - Early Bird izslēgts.",
          )}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t(
                "site_payment_plans.early_bird.field_limit",
                "Vietu skaits",
              )}
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={earlyBirdLimitText}
              onChange={(event) => setEarlyBirdLimitText(event.target.value)}
              disabled={isBusy}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            />
          </label>
          <div className="flex items-end">
            <p className="pb-2.5 text-sm text-zinc-600">
              {savedEarlyBirdLimit > 0
                ? t(
                    "site_payment_plans.early_bird.claimed",
                    "Izmantotas vietas: {claimed} / {limit}",
                    {
                      claimed: earlyBirdClaimed,
                      limit: savedEarlyBirdLimit,
                    },
                  )
                : t(
                    "site_payment_plans.early_bird.claimed_off",
                    "Izmantotas vietas: {claimed} (izslēgts)",
                    { claimed: earlyBirdClaimed },
                  )}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isBusy || !earlyBirdDirty}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === "early-bird" ? (
              <i
                className="fas fa-circle-notch fa-spin text-xs"
                aria-hidden="true"
              />
            ) : null}
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {t("site_payment_plans.list.title", "Plāni")}
          </h2>
          <button
            type="button"
            onClick={openCreate}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("site_payment_plans.actions.add", "Pievienot plānu")}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">
                  {t("site_payment_plans.form.name", "Nosaukums")}
                </th>
                <th className="px-5 py-3">
                  {t("site_payment_plans.list.members", "Lietotāji")}
                </th>
                <th className="px-5 py-3">
                  {t("site_payment_plans.list.prices", "Cenas")}
                </th>
                <th className="px-5 py-3">
                  {t("site_payment_plans.form.modules", "Moduļi šajā plānā")}
                </th>
                <th className="px-5 py-3 text-right">
                  {t("common.actions", "Darbības")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {plans.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-zinc-500"
                  >
                    {t(
                      "site_payment_plans.list.empty",
                      "Vēl nav izveidots neviens maksas plāns.",
                    )}
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const name =
                    resolveLocalizedValue(plan.nameValues, languageCode) ||
                    plan.planKey;
                  return (
                    <tr key={plan.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-zinc-900">{name}</p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-400">
                          {plan.planKey}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-zinc-600 tabular-nums">
                        {plan.isFree
                          ? (plan.maxMembers ?? "—")
                          : t(
                              "site_payment_plans.list.per_user",
                              "par lietotāju",
                            )}
                      </td>
                      <td className="px-5 py-4 text-xs tabular-nums text-zinc-600">
                        {plan.isFree ? (
                          <p>
                            {t("site_payment_plans.list.free", "Bezmaksas")}
                          </p>
                        ) : null}
                        {!plan.isFree && plan.priceMonth > 0 ? (
                          <p>
                            {formatPlanEuro(plan.priceMonth)}{" "}
                            {pricePeriodLabel(
                              t,
                              "site_payment_plans.period.month_short",
                              "/ mēn.",
                            )}
                          </p>
                        ) : null}
                        {!plan.isFree && plan.priceYear > 0 ? (
                          <p
                            className={
                              plan.priceMonth > 0 ? "mt-0.5" : undefined
                            }
                          >
                            {formatPlanEuro(plan.priceYear)}{" "}
                            {pricePeriodLabel(
                              t,
                              "site_payment_plans.period.year_short",
                              "/ gadā",
                            )}
                          </p>
                        ) : null}
                        {!plan.isFree &&
                        (plan.earlyBirdPriceMonth > 0 ||
                        plan.earlyBirdPriceYear > 0) ? (
                          <>
                            <p className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                              {t(
                                "site_payment_plans.list.early_bird_prices",
                                "Early Bird",
                              )}
                            </p>
                            {plan.earlyBirdPriceMonth > 0 ? (
                              <p className="mt-0.5">
                                {formatPlanEuro(plan.earlyBirdPriceMonth)}{" "}
                                {pricePeriodLabel(
                                  t,
                                  "site_payment_plans.period.month_short",
                                  "/ mēn.",
                                )}
                              </p>
                            ) : null}
                            {plan.earlyBirdPriceYear > 0 ? (
                              <p className="mt-0.5">
                                {formatPlanEuro(plan.earlyBirdPriceYear)}{" "}
                                {pricePeriodLabel(
                                  t,
                                  "site_payment_plans.period.year_short",
                                  "/ gadā",
                                )}
                              </p>
                            ) : null}
                          </>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-xs text-zinc-600">
                        {plan.moduleKeys.length === 0
                          ? "—"
                          : plan.moduleKeys
                              .map((key) => moduleLabel(key, t))
                              .join(", ")}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <IconActionButton
                            label={t("actions.edit", "Labot")}
                            icon="fas fa-pen"
                            onClick={() => openEdit(plan)}
                          />
                          <IconActionButton
                            label={t("actions.delete", "Dzēst")}
                            icon="fas fa-trash"
                            variant="delete"
                            onClick={() => setDeleteTarget(plan)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
        title={
          editingPlan
            ? t("site_payment_plans.form.edit_title", "Labot maksas plānu")
            : t("site_payment_plans.form.create_title", "Jauns maksas plāns")
        }
        dirty={dirty}
        blocking={isBusy}
        panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.key", "Atslēga")}
            </span>
            <input
              type="text"
              value={draft.planKey}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  planKey: event.target.value,
                }))
              }
              className={`${fieldClassName} font-mono`}
              autoComplete="off"
              spellCheck={false}
              disabled={isBusy}
            />
            <span className="mt-1 block text-xs text-zinc-500">
              {t(
                "site_payment_plans.form.key_hint",
                "Piemērs: starter, pro, enterprise",
              )}
            </span>
          </label>

          {languages.length > 1 ? (
            <div
              role="tablist"
              aria-label={t("admin.nav.languages", "Valodas")}
              className="flex flex-wrap gap-2"
            >
              {languages.map((language) => {
                const active = language.code === editLang;
                return (
                  <button
                    key={language.code}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setEditLang(language.code)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    <span>{language.name}</span>
                    <span
                      className={`font-mono text-[11px] uppercase ${
                        active ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      {language.code}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.name", "Nosaukums")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </span>
            <input
              type="text"
              value={draft.nameValues[editLang] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  nameValues: {
                    ...current.nameValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              className={fieldClassName}
              disabled={isBusy}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.description", "Apraksts")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </span>
            <textarea
              value={draft.descriptionValues[editLang] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  descriptionValues: {
                    ...current.descriptionValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              rows={3}
              className={fieldClassName}
              disabled={isBusy}
            />
          </label>

          <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800">
                {t("site_payment_plans.form.is_free", "Bezmaksas plāns")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "site_payment_plans.form.is_free_hint",
                  "Vienmēr pieejams bez maksas. Cenas nav jānorāda, un komandai šis plāns nebeidzas.",
                )}
              </p>
            </div>
            <ToggleSwitch
              checked={draft.isFree}
              disabled={isBusy}
              label={t("site_payment_plans.form.is_free", "Bezmaksas plāns")}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  isFree: next,
                  ...(next && !current.maxMembers.trim()
                    ? { maxMembers: String(DEFAULT_PLAN_MEMBERS) }
                    : {}),
                }))
              }
            />
          </div>

          {draft.isFree ? (
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">
                {t("site_payment_plans.form.max_members", "Maks. lietotāju skaits")}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={MIN_PLAN_MEMBERS}
                max={MAX_PLAN_MEMBERS}
                step={1}
                value={draft.maxMembers}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    maxMembers: event.target.value,
                  }))
                }
                className={`${fieldClassName} tabular-nums`}
                disabled={isBusy}
              />
              <span className="mt-1 block text-xs text-zinc-500">
                {t(
                  "site_payment_plans.form.max_members_hint",
                  "Cik komandas lietotāju drīkst būt šajā bezmaksas plānā.",
                )}
              </span>
            </label>
          ) : null}

          {!draft.isFree ? (
            <>
          <div>
            <p className="text-sm font-medium text-zinc-800">
              {t(
                "site_payment_plans.form.prices",
                "Cenas par vienu lietotāju (EUR)",
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_payment_plans.form.prices_hint",
                "Cena ir par vienu lietotāju. Aizpildi tikai piedāvātos periodus. Tukšs periods landing lapā netiek rādīts. Decimālatdalītājs ir punkts, piemēram 9.00.",
              )}
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">
                  {t("site_payment_plans.form.price_month", "Mēnesis")}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.priceMonth}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priceMonth: event.target.value,
                    }))
                  }
                  className={`${fieldClassName} tabular-nums`}
                  placeholder="0.00"
                  disabled={isBusy}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">
                  {t("site_payment_plans.form.price_year", "Gads")}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.priceYear}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      priceYear: event.target.value,
                    }))
                  }
                  className={`${fieldClassName} tabular-nums`}
                  placeholder="0.00"
                  disabled={isBusy}
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-zinc-800">
              {t(
                "site_payment_plans.form.early_bird_prices",
                "Early Bird cenas par vienu lietotāju (EUR)",
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_payment_plans.form.early_bird_prices_hint",
                "Šīs cenas attiecas uz Early Bird vietām un arī ir par vienu lietotāju. Tukšus periodus vari atstāt tukšus.",
              )}
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">
                  {t("site_payment_plans.form.price_month", "Mēnesis")}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.earlyBirdPriceMonth}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      earlyBirdPriceMonth: event.target.value,
                    }))
                  }
                  className={`${fieldClassName} tabular-nums`}
                  placeholder="0.00"
                  disabled={isBusy}
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-zinc-600">
                  {t("site_payment_plans.form.price_year", "Gads")}
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={draft.earlyBirdPriceYear}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      earlyBirdPriceYear: event.target.value,
                    }))
                  }
                  className={`${fieldClassName} tabular-nums`}
                  placeholder="0.00"
                  disabled={isBusy}
                />
              </label>
            </div>
          </div>
            </>
          ) : null}

          <div>
            <p className="text-sm font-medium text-zinc-800">
              {t("site_payment_plans.form.modules", "Moduļi šajā plānā")}
            </p>
            {globallyEnabledModules.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-500">
                {t(
                  "site_payment_plans.form.modules_empty",
                  "Nav globāli ieslēgtu frontend moduļu.",
                )}
              </p>
            ) : (
              <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                {globallyEnabledModules.map((module) => {
                  const label = moduleLabel(module.moduleKey, t);
                  const checked = draft.moduleKeys.includes(module.moduleKey);
                  return (
                    <li
                      key={module.moduleKey}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-900">
                          {label}
                        </p>
                        <p className="mt-0.5 font-mono text-xs text-zinc-400">
                          {module.moduleKey}
                        </p>
                      </div>
                      <ToggleSwitch
                        checked={checked}
                        disabled={isBusy}
                        label={label}
                        onChange={(next) =>
                          toggleModule(module.moduleKey, next)
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={closeEditor}
              disabled={isBusy}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.cancel", "Atcelt")}
            </button>
            <button
              type="submit"
              disabled={isBusy || !dirty}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "create" || pendingKey?.startsWith("save:") ? (
                <span className="inline-flex items-center gap-2">
                  <i
                    className="fas fa-circle-notch fa-spin text-xs"
                    aria-hidden="true"
                  />
                  {t("actions.save", "Saglabāt")}
                </span>
              ) : (
                t("actions.save", "Saglabāt")
              )}
            </button>
          </div>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t(
          "site_payment_plans.delete.confirm_title",
          "Dzēst maksas plānu?",
        )}
        description={t(
          "site_payment_plans.delete.confirm_description",
          "Plāns tiks noņemts no komandām, kurām tas bija piešķirts.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={pendingKey?.startsWith("delete:") === true}
        onConfirm={handleDelete}
      />
    </div>
  );
}
