"use client";

import { useTransition } from "react";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { resumeTeamSubscriptionAction } from "@/app/lib/billing/actions";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { useTeam } from "@/app/lib/team-store";

export function ResumeSubscriptionButton({
  disabled,
  onResumed,
}: {
  disabled?: boolean;
  onResumed?: () => void | Promise<void>;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { currentTeam, refreshTeams } = useTeam();
  const [isPending, startTransition] = useTransition();
  const busy = disabled || isPending;

  function resume() {
    if (!currentTeam || busy) return;
    startTransition(async () => {
      const result = await resumeTeamSubscriptionAction(currentTeam.id);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      showFeedback({
        type: "success",
        text: t(
          "team.billing.resume_subscription_success",
          "Abonements atjaunots. Automātiskā atcelšana ir noņemta.",
        ),
      });
      await refreshTeams();
      await onResumed?.();
    });
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={resume}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? (
        <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
      ) : null}
      {t("team.billing.resume_subscription", "Atjaunot abonementu")}
    </button>
  );
}
