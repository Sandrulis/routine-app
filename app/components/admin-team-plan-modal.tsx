"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateAdminTeamPaymentPlanAction } from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { formatInteger } from "@/app/lib/format/numbers";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  resolveLocalizedValue,
  toDateInputValue,
  type PaymentPlanSummary,
} from "@/app/lib/payment-plans/helpers";
import type { AdminTeamSummary } from "@/app/lib/site-admin/types";

const fieldClassName =
  "mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";

type PlanDraft = {
  planId: string | null;
  until: string;
  paid: boolean;
  isTrial: boolean;
};

function draftFromTeam(team: AdminTeamSummary): PlanDraft {
  return {
    planId: team.paymentPlanId,
    until: toDateInputValue(team.paymentPlanUntil),
    paid: team.paymentPlanPaid,
    isTrial: team.paymentPlanIsTrial,
  };
}

function draftsEqual(left: PlanDraft, right: PlanDraft): boolean {
  return (
    left.planId === right.planId &&
    left.until.trim() === right.until.trim() &&
    left.paid === right.paid &&
    left.isTrial === right.isTrial
  );
}

export function AdminTeamPlanModal({
  team,
  plans,
  open,
  onOpenChange,
  onSaved,
}: {
  team: AdminTeamSummary | null;
  plans: PaymentPlanSummary[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const { t, languageCode } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [draft, setDraft] = useState<PlanDraft>(() =>
    team ? draftFromTeam(team) : {
      planId: null,
      until: "",
      paid: false,
      isTrial: false,
    },
  );
  const [savedDraft, setSavedDraft] = useState<PlanDraft>(draft);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!team) return;
    const next = draftFromTeam(team);
    setDraft(next);
    setSavedDraft(next);
  }, [team]);

  const dirty = !draftsEqual(draft, savedDraft);
  const selectedPlan = useMemo(
    () => plans.find((plan) => plan.id === draft.planId) ?? null,
    [draft.planId, plans],
  );

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!team || !dirty || isPending) return;
    clearFeedback();

    if (draft.planId && !selectedPlan?.isFree && !draft.paid && !draft.isTrial) {
      showFeedback({
        type: "error",
        text: t(
          "admin.teams.plan.status_required",
          "Norādi vismaz vienu statusu: samaksāts vai izmēģinājums.",
        ),
      });
      return;
    }

    startTransition(async () => {
      const result = await updateAdminTeamPaymentPlanAction(team.id, {
        planId: draft.planId,
        until: draft.until.trim() || null,
        paid: draft.paid,
        isTrial: draft.isTrial,
        isEarlyBird: false,
      });

      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setSavedDraft(draft);
      showFeedback({
        type: "success",
        text: t("admin.teams.plan.saved", "Komandas plāns saglabāts."),
      });
      onOpenChange(false);
      onSaved?.();
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("admin.teams.plan.title", "Komandas maksas plāns")}
      dirty={dirty}
      blocking={isPending}
    >
      {team ? (
        <form onSubmit={handleSave} className="space-y-4">
          <p className="text-sm text-zinc-600">
            {t("admin.teams.plan.team_label", "Komanda")}:{" "}
            <span className="font-semibold text-zinc-900">{team.name}</span>
          </p>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("admin.teams.plan.field_plan", "Plāns")}
            </span>
            <select
              value={draft.planId ?? ""}
              onChange={(event) => {
                const nextId = event.target.value || null;
                const nextPlan = plans.find((plan) => plan.id === nextId);
                setDraft((current) => ({
                  ...current,
                  planId: nextId,
                  ...(nextPlan?.isFree
                    ? {
                        until: "",
                        paid: false,
                        isTrial: false,
                      }
                    : {}),
                }));
              }}
              disabled={isPending}
              className={`${fieldClassName} appearance-none disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">
                {t("admin.teams.plan.plan_none", "Bez plāna")}
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {resolveLocalizedValue(plan.nameValues, languageCode) ||
                    plan.planKey}
                </option>
              ))}
            </select>
          </label>

          {selectedPlan?.isFree ? (
            <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
              {t(
                "admin.teams.plan.free_hint",
                "Bezmaksas plāns ir vienmēr aktīvs. Samaksa un termiņš nav jānorāda.",
              )}
            </p>
          ) : null}

          {selectedPlan ? (
            <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
              {selectedPlan.isFree
                ? t(
                    "admin.teams.plan.plan_summary",
                    "Līdz {maxMembers} lietotājiem · {moduleCount} moduļi",
                    {
                      maxMembers: selectedPlan.maxMembers ?? 0,
                      moduleCount: selectedPlan.moduleKeys.length,
                    },
                  )
                : t(
                    "admin.teams.plan.plan_summary_paid",
                    "{moduleCount} moduļi · cena par lietotāju",
                    {
                      moduleCount: selectedPlan.moduleKeys.length,
                    },
                  )}
            </p>
          ) : null}

          {selectedPlan && !selectedPlan.isFree ? (
            <>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("admin.teams.plan.field_until", "Derīgs līdz")}
            </span>
            <input
              type="date"
              value={draft.until}
              onChange={(event) =>
                setDraft((current) => ({ ...current, until: event.target.value }))
              }
              disabled={isPending || !draft.planId}
              className={`${fieldClassName} disabled:cursor-not-allowed disabled:opacity-60`}
            />
            <span className="mt-1 block text-xs text-zinc-500">
              {t(
                "admin.teams.plan.until_hint",
                "Tukšs = bez beigu datuma. Formāts: YYYY-MM-DD.",
              )}
            </span>
          </label>

          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {(
              [
                ["paid", t("admin.teams.plan.paid", "Samaksāts"), draft.paid],
                [
                  "isTrial",
                  t("admin.teams.plan.trial", "Izmēģinājums"),
                  draft.isTrial,
                ],
              ] as const
            ).map(([key, label, checked]) => (
              <li
                key={key}
                className="flex items-center justify-between gap-4 px-4 py-3"
              >
                <span className="text-sm font-medium text-zinc-900">{label}</span>
                <ToggleSwitch
                  checked={checked}
                  disabled={isPending || !draft.planId}
                  label={label}
                  onChange={(next) =>
                    setDraft((current) => ({ ...current, [key]: next }))
                  }
                />
              </li>
            ))}
          </ul>
          <p className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-xs text-zinc-600">
            {t(
              "admin.teams.plan.early_bird_seats",
              "Early Bird vietas: {count}",
              { count: formatInteger(team.earlyBirdSeatCount) },
            )}
          </p>
            </>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.cancel", "Atcelt")}
            </button>
            <button
              type="submit"
              disabled={isPending || !dirty}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <i
                  className="fas fa-circle-notch fa-spin text-xs"
                  aria-hidden="true"
                />
              ) : null}
              {t("actions.save", "Saglabāt")}
            </button>
          </div>
        </form>
      ) : null}
    </AppModal>
  );
}
