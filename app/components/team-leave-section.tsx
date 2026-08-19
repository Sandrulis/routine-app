"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { removeTeamMemberAction } from "@/app/lib/team/actions";
import { canLeaveTeam, type TeamMember } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

type TeamLeaveSectionProps = {
  member: TeamMember;
  redirectTo?: string;
};

export function TeamLeaveSection({
  member,
  redirectTo = "/",
}: TeamLeaveSectionProps) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { currentUser, roles, refreshTeams, currentTeam } = useTeam();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  if (!canLeaveTeam(currentUser, member, roles)) {
    return null;
  }

  const teamName = currentTeam?.name?.trim() || t("team.page.title", "Komanda");

  async function handleLeave() {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      const result = await removeTeamMemberAction(member.id);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      await refreshTeams();
      showFeedback({
        type: "success",
        text: t("team.member.left", "Tu pameti komandu."),
      });
      router.push(redirectTo);
    } finally {
      setIsLeaving(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("team.member.leave_title", "Pamest komandu")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t(
            "team.member.leave_description",
            "Tu zaudēsi piekļuvi komandai {team}.",
            { team: teamName },
          )}
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isLeaving}
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLeaving ? (
            <>
              <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
              {t("team.member.leaving", "Pamet…")}
            </>
          ) : (
            <>
              <i className="fas fa-right-from-bracket text-xs" aria-hidden="true" />
              {t("team.member.leave", "Pamest komandu")}
            </>
          )}
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("team.member.leave_confirm_title", "Pamest komandu?")}
        description={t(
          "team.member.leave_confirm_description",
          "Tu zaudēsi piekļuvi komandai {team}. Šo darbību nevar atsaukt.",
          { team: teamName },
        )}
        confirmLabel={t("team.member.leave", "Pamest komandu")}
        confirmVariant="danger"
        blocking={isLeaving}
        onConfirm={() => void handleLeave()}
      />
    </>
  );
}
