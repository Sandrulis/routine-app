"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingState } from "@/app/components/loading-state";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  acceptTeamInvitationByTokenAction,
  getTeamInvitationByTokenAction,
  rejectTeamInvitationAction,
} from "@/app/lib/team/actions";

export default function InviteTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { user, isReady: authReady } = useAuthSession();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [invite, setInvite] = useState<{
    invitationId: string;
    teamName: string;
    inviterName: string;
    email: string;
    accountExists: boolean;
    awaitingPayment: boolean;
  } | null>(null);

  useEffect(() => {
    void params.then(({ token: nextToken }) => setToken(nextToken));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    void getTeamInvitationByTokenAction(token)
      .then((result) => {
        if (result.ok) {
          setInvite(result.data);
        } else {
          setInvite(null);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!authReady || loading || !token || !invite || user) return;
    if (invite.awaitingPayment) return;
    if (!invite.accountExists) {
      router.replace(`/signup?invite=${encodeURIComponent(token)}`);
    }
  }, [authReady, invite, loading, router, token, user]);

  async function handleAccept() {
    if (!token || pending) return;
    setPending(true);
    try {
      const result = await acceptTeamInvitationByTokenAction(token);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      showFeedback({
        type: "success",
        text: t("team.invite.accepted", "Uzaicinājums apstiprināts."),
      });
      router.replace("/dashboard");
    } finally {
      setPending(false);
    }
  }

  async function handleReject() {
    if (!invite?.invitationId || pending) return;
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
      showFeedback({
        type: "success",
        text: t("team.invite.rejected", "Uzaicinājums noraidīts."),
      });
      router.replace("/dashboard");
    } finally {
      setPending(false);
    }
  }

  if (loading || !authReady) {
    return (
      <div className="px-4 py-16">
        <LoadingState className="justify-center" />
      </div>
    );
  }

  if (!invite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {t("team.invite.page.title", "Komandas uzaicinājums")}
        </h1>
        <p className="mt-3 text-sm text-zinc-500">
          {translateActionError(t, "errors.team_invite_not_found")}
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white"
        >
          {t("nav.home", "Sākums")}
        </Link>
      </div>
    );
  }

  if (!user && !invite.accountExists && !invite.awaitingPayment) {
    return (
      <div className="px-4 py-16">
        <LoadingState className="justify-center" />
      </div>
    );
  }

  const loginHref = `/login?next=${encodeURIComponent(`/invite/${token}`)}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {t("team.invite.page.title", "Komandas uzaicinājums")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600">
          {t(
            "team.invite.page.description",
            "{inviter} uzaicina tevi pievienoties komandai “{team}”.",
            { inviter: invite.inviterName, team: invite.teamName },
          )}
        </p>

        {!user && !invite.awaitingPayment ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-500">
              {t(
                "team.invite.page.login_required",
                "Pieraksties ar e-pastu {email}, lai apstiprinātu uzaicinājumu.",
                { email: invite.email },
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={loginHref}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white"
              >
                {t("auth.login.title", "Ienākt")}
              </Link>
            </div>
          </div>
        ) : invite.awaitingPayment ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-zinc-500">
              {t(
                "team.invite.awaiting_payment_page",
                "Komanda vēl nav apmaksājusi vietu. Uzaicinājumu varēs apstiprināt pēc samaksas.",
              )}
            </p>
            {user ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => void handleReject()}
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
              >
                {t("team.invite.page.reject", "Noraidīt uzaicinājumu")}
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700"
              >
                {t("nav.home", "Sākums")}
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-2">
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
            <button
              type="button"
              disabled={pending}
              onClick={() => void handleReject()}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
            >
              {t("team.invite.page.reject", "Noraidīt uzaicinājumu")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
