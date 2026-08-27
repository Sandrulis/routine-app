"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { SectionPage } from "@/app/components/section-page";
import { LoadingSpinner, LoadingState } from "@/app/components/loading-state";
import { TeamInviteModal } from "@/app/components/team-invite-modal";
import { MemberLastOnline } from "@/app/components/member-last-online";
import {
  MemberSeatBillingHintLine,
  TeamOpenSeatsBillingHint,
} from "@/app/components/member-seat-billing-hint";
import { IconActionButton } from "@/app/components/icon-action-button";
import { UserAvatar } from "@/app/components/user-avatar";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { resolveSeatCounts } from "@/app/lib/billing/seats";
import { useStartTeamInvite } from "@/app/lib/billing/use-start-team-invite";
import {
  useFreePlanIds,
  usePaymentPlansEnabled,
} from "@/app/lib/payment-plans/context";
import {
  getTeamInviteLinkAction,
  inviteTeamMemberAction,
  removeTeamMemberAction,
  resendTeamInvitationAction,
  transferTeamLeadershipAction,
} from "@/app/lib/team/actions";
import {
  canAppointTeamLeader,
  canLeaveTeam,
  canOpenTeamPage,
  canRemoveTeamMember,
  canEditTeamSettings,
  isPendingTeamMember,
  isAwaitingPaymentSeat,
  memberDisplayName,
  MEMBER_TEAM_ROLE,
  teamRankLabel,
  type TeamMember,
} from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { NOTIFICATIONS_CHANGE_EVENT } from "@/app/lib/notifications";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

type PendingAction = "resend" | "remove" | "copy" | "leave" | "appoint" | null;

export default function TeamPage() {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const paymentPlansEnabled = usePaymentPlansEnabled();
  const freePlanIds = useFreePlanIds();
  const { isAdmin } = useIsAdmin();
  const {
    members,
    currentTeam,
    currentUser,
    isReady,
    roles,
    refreshTeams,
  } = useTeam();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [appointTarget, setAppointTarget] = useState<TeamMember | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const isBusy = pendingAction !== null;
  const canOpenTeam = canOpenTeamPage(currentUser, roles, isAdmin);
  const {
    canInvite,
    startInvite,
    handleInviteError,
    isPurchasingSeat,
    seatPurchasedOpen,
    setSeatPurchasedOpen,
    confirmSeatPurchased,
  } = useStartTeamInvite();
  const selfMember =
    members.find(
      (member) =>
        member.id === currentUser.id ||
        (member.userId && member.userId === currentUser.userId),
    ) ?? null;
  const isFreePlan = Boolean(
    currentTeam?.paymentPlan.planId &&
      freePlanIds.includes(currentTeam.paymentPlan.planId),
  );
  const seatCounts = currentTeam
    ? resolveSeatCounts({
        paidSeatCount: currentTeam.paidSeatCount,
        members,
      })
    : null;

  async function handleResend(member: TeamMember) {
    if (isBusy) return;
    setPendingMemberId(member.id);
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
      setPendingMemberId(null);
      setPendingAction(null);
    }
  }

  async function handleCopyInviteLink(member: TeamMember) {
    if (isBusy) return;
    setPendingMemberId(member.id);
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
      setPendingMemberId(null);
      setPendingAction(null);
    }
  }

  async function handleLeave() {
    if (isBusy || !selfMember) return;
    setPendingMemberId(selfMember.id);
    setPendingAction("leave");
    try {
      const result = await removeTeamMemberAction(selfMember.id);
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
      setLeaveConfirmOpen(false);
      router.push("/");
    } finally {
      setPendingMemberId(null);
      setPendingAction(null);
    }
  }

  async function handleRemove(member: TeamMember) {
    if (isBusy) return;
    setPendingMemberId(member.id);
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
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
      showFeedback({
        type: "success",
        text: t("team.member.removed", "Lietotājs noņemts no komandas."),
      });
      setRemoveTarget(null);
    } finally {
      setPendingMemberId(null);
      setPendingAction(null);
    }
  }

  async function handleAppoint(member: TeamMember) {
    if (isBusy) return;
    setPendingMemberId(member.id);
    setPendingAction("appoint");
    try {
      const result = await transferTeamLeadershipAction(member.id);
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
        text: t(
          "team.member.appoint_leader_success",
          "{name} tagad ir komandas vadītājs.",
          { name: memberDisplayName(member) },
        ),
      });
      setAppointTarget(null);
    } finally {
      setPendingMemberId(null);
      setPendingAction(null);
    }
  }

  if (isReady && !canOpenTeam) {
    return (
      <SectionPage
        title={t("nav.team", "Komanda")}
        subtitle={t(
          "errors.team_page_forbidden",
          "Nav pieejas komandas lapai.",
        )}
      >
        <Link
          href="/dashboard"
          className="inline-flex min-h-10 items-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
        >
          {t("nav.home", "Sākums")}
        </Link>
      </SectionPage>
    );
  }

  return (
    <>
      <SectionPage
        title={t("nav.team", "Komanda")}
        subtitle={t(
          "team.page.subtitle",
          "Visi komandas lietotāji. Uzaicini jaunu lietotāju ar pluszīmi.",
        )}
        actions={
          currentTeam && canInvite ? (
            <button
              type="button"
              disabled={isPurchasingSeat}
              aria-busy={isPurchasingSeat}
              onClick={() => startInvite(() => setInviteOpen(true))}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPurchasingSeat ? (
                <LoadingSpinner size="sm" className="text-xs text-white" />
              ) : (
                <i className="fas fa-plus text-xs" aria-hidden="true" />
              )}
              {isPurchasingSeat
                ? t("team.invite.purchasing_seat", "Iegādājas vietu…")
                : t("team.invite.button", "Uzaicināt")}
            </button>
          ) : null
        }
      >
        <div className="grid gap-3">
          {!isReady ? (
            <LoadingState />
          ) : members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500">
              {currentTeam
                ? t("team.empty", "Komandā vēl nav lietotāju.")
                : t("teams.required.empty_members", "Vispirms izveido komandu.")}
            </div>
          ) : (
            <>
              {currentTeam && seatCounts ? (
                <TeamOpenSeatsBillingHint
                  team={currentTeam}
                  roles={roles}
                  viewer={currentUser}
                  isFreePlan={isFreePlan}
                  paymentPlansEnabled={paymentPlansEnabled}
                  openSeatCount={seatCounts.openSeatCount}
                />
              ) : null}
              {members.map((member) => {
              const pending = isPendingTeamMember(member);
              const awaitingPayment = isAwaitingPaymentSeat(member);
              const canManage = canRemoveTeamMember(
                currentUser,
                member,
                roles,
                isAdmin,
              );
              const canLeave = canLeaveTeam(currentUser, member, roles);
              const canAppoint = canAppointTeamLeader(
                currentUser,
                member,
                roles,
              );
              const memberBusy = isBusy && pendingMemberId === member.id;
              const appointButton = canAppoint ? (
                <IconActionButton
                  label={t("team.member.appoint_leader", "Iecelt par vadītāju")}
                  icon={
                    memberBusy && pendingAction === "appoint"
                      ? "fas fa-spinner fa-spin"
                      : "fas fa-user-tie"
                  }
                  variant="muted"
                  disabled={isBusy}
                  onClick={() => setAppointTarget(member)}
                />
              ) : null;
              const removeButton = canManage ? (
                <IconActionButton
                  label={t("team.member.remove", "Noņemt no komandas")}
                  icon={
                    memberBusy && pendingAction === "remove"
                      ? "fas fa-spinner fa-spin"
                      : "fas fa-user-minus"
                  }
                  variant="delete"
                  disabled={isBusy}
                  onClick={() => setRemoveTarget(member)}
                />
              ) : null;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-2 rounded-3xl border border-zinc-200 bg-white px-5 py-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                >
                  <Link
                    href={`/team/${member.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <UserAvatar member={member} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        {memberDisplayName(member)}
                      </p>
                      <p className="mt-0.5 text-sm text-zinc-500">
                        {[
                          teamRankLabel(member.role, t, roles),
                          pending
                            ? awaitingPayment
                              ? t("team.invite.pending_payment", "Gaida samaksu")
                              : t("team.invite.pending", "Gaida apstiprinājumu")
                            : null,
                          member.email,
                        ]
                          .filter(Boolean)
                          .join(" - ")}
                      </p>
                      {currentTeam ? (
                        <MemberSeatBillingHintLine
                          member={member}
                          roles={roles}
                          team={currentTeam}
                          isFreePlan={isFreePlan}
                          paymentPlansEnabled={paymentPlansEnabled}
                          viewer={currentUser}
                        />
                      ) : null}
                    </div>
                  </Link>

                  {pending && canManage ? (
                    <div className="flex shrink-0 items-center gap-1">
                      {awaitingPayment ? null : (
                        <>
                      <IconActionButton
                        label={t("team.invite.copy_link", "Kopēt uzaicinājuma linku")}
                        icon={
                          memberBusy && pendingAction === "copy"
                            ? "fas fa-spinner fa-spin"
                            : "fas fa-link"
                        }
                        variant="muted"
                        disabled={isBusy}
                        onClick={() => void handleCopyInviteLink(member)}
                      />
                      <IconActionButton
                        label={t("team.invite.resend", "Sūtīt uzaicinājumu vēlreiz")}
                        icon={
                          memberBusy && pendingAction === "resend"
                            ? "fas fa-spinner fa-spin"
                            : "fas fa-paper-plane"
                        }
                        variant="muted"
                        disabled={isBusy}
                        onClick={() => void handleResend(member)}
                      />
                        </>
                      )}
                      {removeButton}
                    </div>
                  ) : canLeave ? (
                    <div className="flex shrink-0 items-center gap-1">
                      <IconActionButton
                        label={t("team.member.leave", "Pamest komandu")}
                        icon={
                          memberBusy && pendingAction === "leave"
                            ? "fas fa-spinner fa-spin"
                            : "fas fa-right-from-bracket"
                        }
                        variant="delete"
                        disabled={isBusy}
                        onClick={() => setLeaveConfirmOpen(true)}
                      />
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      {appointButton}
                      {removeButton}
                      <MemberLastOnline lastOnlineAt={member.lastOnlineAt} />
                    </div>
                  )}
                </div>
              );
            })}
            </>
          )}
        </div>

        <TeamInviteModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvite={async (input) => {
            if (!currentTeam) return;
            try {
              const teamRoles = roles;
              const requested = input.role.trim();
              const matched =
                teamRoles.find((role) => role.id === requested || role.slug === requested) ??
                teamRoles.find((role) => role.slug === MEMBER_TEAM_ROLE) ??
                null;

              const result = await inviteTeamMemberAction({
                teamId: currentTeam.id,
                email: input.email.trim(),
                roleId: matched?.id ?? requested,
              });

              if (!result.ok) {
                throw new Error(result.error);
              }

              await refreshTeams();
              if (result.data.awaitingPayment) {
                showFeedback({
                  type: "info",
                  text: t(
                    "team.invite.saved_awaiting_payment",
                    "Uzaicinājums saglabāts. Lietotājs saņems piekļuvi pēc vietas samaksas.",
                  ),
                });
                setInviteOpen(false);
                if (canEditTeamSettings(currentUser, roles, isAdmin)) {
                  router.push("/team/billing");
                }
                return;
              }
              showFeedback({
                type: result.data.emailSent
                  ? "success"
                  : result.data.emailError
                    ? "error"
                    : "info",
                text: result.data.emailSent
                  ? t("team.invited", "Uzaicinājums nosūtīts.")
                  : result.data.emailError
                    ? translateActionError(t, result.data.emailError)
                    : t(
                        "team.invited_no_email",
                        "Uzaicinājums saglabāts. E-pasts netika nosūtīts — nosūti linku manuāli.",
                      ),
              });
              setInviteOpen(false);
              router.push(`/team/${result.data.memberId}`);
            } catch (error) {
              const message =
                error instanceof Error ? error.message : "errors.team_invite_failed";
              handleInviteError(message);
              showFeedback({
                type: message === "errors.team_invite_pay_first" ? "info" : "error",
                text: translateActionError(t, message),
              });
            }
          }}
        />
      </SectionPage>

      <ConfirmModal
        open={seatPurchasedOpen}
        onOpenChange={setSeatPurchasedOpen}
        title={t("team.invite.seat_purchased_title", "Vieta iegādāta")}
        description={t(
          "team.invite.seat_purchased_description",
          "Viena apmaksāta vieta ir gatava. Tagad vari uzaicināt lietotāju.",
        )}
        confirmLabel={t("team.invite.button", "Uzaicināt")}
        onConfirm={confirmSeatPurchased}
      />

      <ConfirmModal
        open={leaveConfirmOpen}
        onOpenChange={(open) => {
          if (!open && pendingAction !== "leave") setLeaveConfirmOpen(false);
        }}
        title={t("team.member.leave_confirm_title", "Pamest komandu?")}
        description={t(
          "team.member.leave_confirm_description",
          "Tu zaudēsi piekļuvi komandai {team}. Šo darbību nevar atsaukt.",
          { team: currentTeam?.name?.trim() || t("nav.team", "Komanda") },
        )}
        confirmLabel={t("team.member.leave", "Pamest komandu")}
        confirmVariant="danger"
        blocking={pendingAction === "leave"}
        onConfirm={() => void handleLeave()}
      />

      <ConfirmModal
        open={appointTarget !== null}
        onOpenChange={(open) => {
          if (!open && pendingAction !== "appoint") setAppointTarget(null);
        }}
        title={t(
          "team.member.appoint_leader_confirm_title",
          "Iecelt par komandas vadītāju?",
        )}
        description={t(
          "team.member.appoint_leader_confirm_description",
          "{name} kļūs par komandas vadītāju. Tu pārņemsi šī lietotāja lomu ({role}).",
          {
            name: appointTarget ? memberDisplayName(appointTarget) : "",
            role:
              appointTarget
                ? teamRankLabel(appointTarget.role, t, roles) ||
                  appointTarget.role
                : "",
          },
        )}
        confirmLabel={t("team.member.appoint_leader", "Iecelt par vadītāju")}
        blocking={pendingAction === "appoint"}
        onConfirm={() => {
          if (appointTarget) void handleAppoint(appointTarget);
        }}
      />

      <ConfirmModal
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open && pendingAction !== "remove") setRemoveTarget(null);
        }}
        title={t("team.member.remove_confirm_title", "Noņemt lietotāju?")}
        description={t(
          "team.member.remove_confirm_description",
          "{name} zaudēs piekļuvi komandai.",
          { name: removeTarget ? memberDisplayName(removeTarget) : "" },
        )}
        confirmLabel={t("team.member.remove", "Noņemt no komandas")}
        confirmVariant="danger"
        blocking={pendingAction === "remove"}
        onConfirm={() => {
          if (removeTarget) void handleRemove(removeTarget);
        }}
      />
    </>
  );
}
