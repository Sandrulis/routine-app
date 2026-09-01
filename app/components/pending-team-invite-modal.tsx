"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { NOTIFICATIONS_CHANGE_EVENT } from "@/app/lib/notifications";
import {
  acceptTeamInvitationAction,
  getPendingTeamInvitePromptAction,
  rejectTeamInvitationAction,
} from "@/app/lib/team/actions";
import { useTeam } from "@/app/lib/team-store";

const DISMISSED_INVITE_PREFIX = "routine-app-dismissed-invite:";

export function PendingTeamInviteModal() {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { user, isReady: authReady } = useAuthSession();
  const { isReady: teamReady, refreshTeams } = useTeam();
  const [invite, setInvite] = useState<{
    invitationId: string;
    teamName: string;
    inviterName: string;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!authReady || !teamReady || !user || checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    void getPendingTeamInvitePromptAction().then((result) => {
      if (!result.ok || !result.data) {
        return;
      }
      const dismissed = sessionStorage.getItem(
        `${DISMISSED_INVITE_PREFIX}${result.data.invitationId}`,
      );
      if (dismissed) {
        return;
      }
      setInvite(result.data);
      setOpen(true);
    });
  }, [authReady, teamReady, user]);

  function dismissPrompt(invitationId: string) {
    sessionStorage.setItem(`${DISMISSED_INVITE_PREFIX}${invitationId}`, "1");
    setOpen(false);
    setInvite(null);
  }

  async function handleAccept() {
    if (!invite || pending) return;
    setPending(true);
    try {
      const result = await acceptTeamInvitationAction(invite.invitationId);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      dismissPrompt(invite.invitationId);
      await refreshTeams();
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
      showFeedback({
        type: "success",
        text: t("team.invite.accepted", "Uzaicinājums apstiprināts."),
      });
      router.replace("/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleReject() {
    if (!invite || pending) return;
    setPending(true);
    try {
      const result = await rejectTeamInvitationAction(invite.invitationId);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      dismissPrompt(invite.invitationId);
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
      showFeedback({
        type: "success",
        text: t("team.invite.rejected", "Uzaicinājums noraidīts."),
      });
    } finally {
      setPending(false);
    }
  }

  if (!invite) {
    return null;
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && invite) {
          dismissPrompt(invite.invitationId);
        } else {
          setOpen(nextOpen);
        }
      }}
      title={t("team.invite.page.title", "Komandas uzaicinājums")}
      description={t(
        "team.invite.page.description",
        "{inviter} uzaicina tevi pievienoties komandai “{team}”.",
        { inviter: invite.inviterName, team: invite.teamName },
      )}
      blocking
    >
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleReject()}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
        >
          {t("team.invite.page.reject", "Noraidīt uzaicinājumu")}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void handleAccept()}
          className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        >
          {pending
            ? t("actions.saving", "Saglabā…")
            : t("team.invite.page.accept", "Pievienoties komandai")}
        </button>
      </div>
    </AppModal>
  );
}
