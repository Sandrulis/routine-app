"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { SectionPage } from "@/app/components/section-page";
import { LoadingState } from "@/app/components/loading-state";
import { UserAvatar } from "@/app/components/user-avatar";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  getTeamInviteLinkAction,
  removeTeamMemberAction,
  resendTeamInvitationAction,
} from "@/app/lib/team/actions";
import {
  canLeaveTeam,
  canRemoveTeamMember,
  isPendingTeamMember,
  isSelfTeamMember,
  memberDisplayName,
  teamRankLabel,
} from "@/app/lib/team";
import { TeamLeaveSection } from "@/app/components/team-leave-section";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

type PendingAction = "resend" | "remove" | "copy" | null;

export function TeamMemberPage({ memberId }: { memberId: string }) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const { isAdmin } = useIsAdmin();
  const { members, isReady, roles, currentUser, refreshTeams } = useTeam();
  const member = members.find((item) => item.id === memberId) ?? null;
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);

  const isBusy = pendingAction !== null;
  const isPending = member ? isPendingTeamMember(member) : false;
  const canManageMember = member
    ? canRemoveTeamMember(currentUser, member, roles, isAdmin)
    : false;
  const canLeave = member ? canLeaveTeam(currentUser, member, roles) : false;
  const isSelf = member ? isSelfTeamMember(currentUser, member) : false;

  async function handleResend() {
    if (isBusy || !member) return;
    setPendingAction("resend");
    try {
      const result = await resendTeamInvitationAction(member.id);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      showFeedback({
        type: result.data.emailSent
          ? "success"
          : result.data.emailError
            ? "error"
            : "info",
        text: result.data.emailSent
          ? t("team.invite.resent", "Uzaicinājums nosūtīts vēlreiz.")
          : result.data.emailError
            ? translateActionError(t, result.data.emailError)
            : t(
                "team.invite.resent_no_email",
                "E-pasts netika nosūtīts. Nosūti uzaicinājuma linku manuāli.",
              ),
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCopyLink() {
    if (isBusy || !member) return;
    setPendingAction("copy");
    try {
      const result = await getTeamInviteLinkAction(member.id);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      await navigator.clipboard.writeText(result.data.inviteUrl);
      showFeedback({
        type: "success",
        text: t("team.invite.link_copied", "Uzaicinājuma links nokopēts."),
      });
    } catch {
      showFeedback({
        type: "error",
        text: t("errors.clipboard_failed", "Neizdevās nokopēt linku."),
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function handleRemove() {
    if (isBusy || !member) return;
    setPendingAction("remove");
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
        text: isSelf
          ? t("team.member.left", "Tu pameti komandu.")
          : t("team.member.removed", "Biedrs noņemts no komandas."),
      });
      router.push(isSelf ? "/" : "/team");
    } finally {
      setPendingAction(null);
      setRemoveConfirmOpen(false);
    }
  }

  if (!isReady) {
    return (
      <SectionPage
        title={t("team.detail.loading", "Ielādē biedru")}
        subtitle={t("team.page.subtitle", "Visi komandas biedri.")}
      >
        <LoadingState />
      </SectionPage>
    );
  }

  if (!member) {
    return (
      <SectionPage
        title={t("team.detail.missing", "Biedrs nav atrasts")}
        subtitle={t(
          "team.detail.missing_description",
          "Šis komandas biedrs vairs nav pieejams.",
        )}
      >
        <Link
          href="/team"
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("team.back", "Atpakaļ uz komandu")}
        </Link>
      </SectionPage>
    );
  }

  const displayName = memberDisplayName(member);

  return (
    <>
      <SectionPage
        title={displayName}
        subtitle={teamRankLabel(member.role, t, roles) || member.email}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-4 rounded-3xl border border-zinc-200 bg-white px-5 py-6">
            <UserAvatar member={member} />
            <div className="min-w-0 flex-1 text-sm text-zinc-500">
              {member.email ? <p>{member.email}</p> : null}
              {isPending ? (
                <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  {t("team.invite.pending", "Gaida apstiprinājumu")}
                </p>
              ) : null}
            </div>
          </div>

          {canLeave ? <TeamLeaveSection member={member} redirectTo="/" /> : null}

          {canManageMember ? (
            <div className="flex flex-wrap gap-3">
              {isPending ? (
                <>
                  <button
                    type="button"
                    onClick={() => void handleCopyLink()}
                    disabled={isBusy}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pendingAction === "copy" ? (
                      <>
                        <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
                        {t("actions.copying", "Kopē…")}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-link text-xs" aria-hidden="true" />
                        {t("team.invite.copy_link", "Kopēt uzaicinājuma linku")}
                      </>
                    )}
                  </button>
                  <button
                  type="button"
                  onClick={() => void handleResend()}
                  disabled={isBusy}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pendingAction === "resend" ? (
                    <>
                      <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
                      {t("team.invite.resending", "Sūta…")}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane text-xs" aria-hidden="true" />
                      {t("team.invite.resend", "Sūtīt uzaicinājumu vēlreiz")}
                    </>
                  )}
                </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setRemoveConfirmOpen(true)}
                disabled={isBusy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pendingAction === "remove" ? (
                  <>
                    <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
                    {t("actions.deleting", "Dzēš…")}
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-minus text-xs" aria-hidden="true" />
                    {t("team.member.remove", "Noņemt no komandas")}
                  </>
                )}
              </button>
            </div>
          ) : null}
        </div>
      </SectionPage>

      <ConfirmModal
        open={removeConfirmOpen}
        onOpenChange={setRemoveConfirmOpen}
        title={t("team.member.remove_confirm_title", "Noņemt biedru?")}
        description={t(
          "team.member.remove_confirm_description",
          "{name} zaudēs piekļuvi komandai.",
          { name: displayName },
        )}
        confirmLabel={t("team.member.remove", "Noņemt no komandas")}
        confirmVariant="danger"
        blocking={pendingAction === "remove"}
        onConfirm={() => void handleRemove()}
      />
    </>
  );
}
