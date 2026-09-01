"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { OptionalTooltip } from "@/app/components/tooltip";
import { LoadingState } from "@/app/components/loading-state";
import { NotificationSettingsModal } from "@/app/components/notification-settings-modal";
import { useNow } from "@/app/components/now-provider";
import { VirtualWindow } from "@/app/components/virtual-window";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { getLastOnlineDisplay } from "@/app/lib/last-online";
import type { AppNotification } from "@/app/lib/notifications";
import { NOTIFICATIONS_CHANGE_EVENT } from "@/app/lib/notifications";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { useNotifications } from "@/app/lib/use-notifications";
import {
  acceptTeamInvitationAction,
  rejectTeamInvitationAction,
} from "@/app/lib/team/actions";
import {
  currentTeamIdStorageKey,
  getTeamMember,
  type MembersByTeam,
} from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

function findMemberAcrossTeams(
  membersByTeam: MembersByTeam,
  id: string | null,
) {
  if (!id) return null;
  for (const list of Object.values(membersByTeam)) {
    const member = getTeamMember(list, id);
    if (member) return member;
  }
  return null;
}

function NotificationMeta({
  item,
  now,
  showTeamLabel,
  t,
}: {
  item: AppNotification;
  now: number;
  showTeamLabel: boolean;
  t: (key: string, fallback: string, params?: Record<string, string | number>) => string;
}) {
  return (
    <>
      {showTeamLabel && item.teamName ? (
        <span className="mt-0.5 block truncate text-[11px] font-medium text-indigo-600/90">
          {item.teamName}
        </span>
      ) : null}
      <span className="mt-0.5 block text-[11px] tabular-nums text-zinc-400">
        {notificationTime(item.createdAt, now, t)}
      </span>
    </>
  );
}

function notificationText(
  item: AppNotification,
  actorName: string,
  recipientName: string,
  currentUserId: string,
  t: (key: string, fallback: string, params?: Record<string, string>) => string,
  untilLabel: string,
) {
  const params = { name: actorName, task: item.taskTitle, assignee: recipientName, team: item.taskTitle };
  if (item.kind === "seat_open") {
    if (untilLabel) {
      return t(
        "notifications.item.seat_open",
        "Komandā ir brīva apmaksāta vieta līdz {until}. Tās vietā var uzaicināt citu lietotāju.",
        { until: untilLabel },
      );
    }
    return t(
      "notifications.item.seat_open_no_date",
      "Komandā ir brīva apmaksāta vieta. Tās vietā var uzaicināt citu lietotāju.",
    );
  }
  if (item.kind === "billing_due") {
    if (untilLabel) {
      return t(
        "notifications.item.billing_due",
        "No nākamā mēneša ({until}) būs jāmaksā par komandas lietotājiem.",
        { until: untilLabel },
      );
    }
    return t(
      "notifications.item.billing_due_no_date",
      "No nākamā mēneša būs jāmaksā par komandas lietotājiem.",
    );
  }
  if (item.kind === "team_invite") {
    return t(
      "notifications.item.team_invite",
      "{name} uzaicināja tevi pievienoties komandai “{team}”",
      params,
    );
  }
  if (item.kind === "team_invite_rejected") {
    return t(
      "notifications.item.team_invite_rejected",
      "{email} noraidīja uzaicinājumu pievienoties komandai “{team}”",
      { email: item.href ?? "", team: item.taskTitle },
    );
  }
  if (item.kind === "assigned") {
    return t(
      "notifications.item.assigned",
      "{name} piešķīra tev “{task}”",
      params,
    );
  }
  if (item.kind === "unassigned") {
    return t(
      "notifications.item.unassigned",
      "{name} noņēma tevi no “{task}”",
      params,
    );
  }
  if (item.kind === "comment") {
    return t("notifications.item.comment", "{name} komentēja “{task}”", params);
  }
  if (item.kind === "file") {
    return t(
      "notifications.item.file",
      "{name} pievienoja failu pie “{task}”",
      params,
    );
  }
  if (item.kind === "status_changed") {
    return t(
      "notifications.item.status_changed",
      "{name} mainīja statusu “{task}”",
      params,
    );
  }
  if (item.kind === "task_updated") {
    return t(
      "notifications.item.task_updated",
      "{name} atjaunināja “{task}”",
      params,
    );
  }
  if (item.kind === "due") {
    return t("notifications.item.due", "Tuvojas termiņš: “{task}”", params);
  }
  if (item.kind === "start") {
    return t("notifications.item.start", "Jāuzsāk: “{task}”", params);
  }
  return t("notifications.item.task_updated", "{name} atjaunināja “{task}”", params);
}

function notificationTime(
  createdAt: string,
  now: number,
  t: (key: string, fallback: string, params?: Record<string, string | number>) => string,
) {
  const display = getLastOnlineDisplay(createdAt, now);
  if (display.kind === "unknown") return "";
  if (display.kind === "online") {
    return t("notifications.just_now", "tagad");
  }
  if (display.kind === "minutes") {
    return t("team.online.minutes", "{count} min", { count: display.count });
  }
  if (display.kind === "hours") {
    return t("team.online.hours", "{count} h", { count: display.count });
  }
  if (display.kind === "days") {
    return t("team.online.days", "{count} d", { count: display.count });
  }
  return t("team.online.months", "{count} m", { count: display.count });
}

export function NotificationsMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { showFeedback } = useFeedbackToast();
  const { user: authUser } = useAuthSession();
  const {
    teams,
    membersByTeam,
    currentTeam,
    currentUser,
    refreshTeams,
    selectTeam,
  } = useTeam();
  const { items, isLoading, unreadCount, markRead, markAllRead, dismiss, dismissAll } =
    useNotifications();
  const showTeamLabels = teams.length > 1;
  const notificationItemHeight = showTeamLabels ? 92 : 80;
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearingAll, setClearingAll] = useState(false);
  const now = useNow();
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const label = t("notifications.label", "Paziņojumi");
  const settingsLabel = t("user_menu.notifications", "Paziņojumu uzstādījumi");
  const dismissLabel = t("notifications.dismiss", "Noņemt");
  const dismissAllLabel = t("notifications.dismiss_all", "Dzēst visus");

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function activateTeamForNotification(teamId: string | null | undefined) {
    if (!teamId || !authUser?.id || currentTeam?.id === teamId) return;
    window.localStorage.setItem(currentTeamIdStorageKey(authUser.id), teamId);
    selectTeam(teamId);
  }

  function openNotification(item: AppNotification) {
    markRead(item.id);
    setOpen(false);
    activateTeamForNotification(item.teamId);
    if (item.href) {
      router.push(item.href);
    }
  }

  async function handleInviteResponse(
    invitationId: string,
    action: "accept" | "reject",
    teamId?: string | null,
  ) {
    if (pendingInviteId) return;
    setPendingInviteId(invitationId);
    try {
      const result =
        action === "accept"
          ? await acceptTeamInvitationAction(invitationId)
          : await rejectTeamInvitationAction(invitationId);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      if (action === "accept") {
        activateTeamForNotification(teamId);
        await refreshTeams();
        showFeedback({
          type: "success",
          text: t("team.invite.accepted", "Uzaicinājums apstiprināts."),
        });
      } else {
        await refreshTeams();
        showFeedback({
          type: "success",
          text: t("team.invite.rejected", "Uzaicinājums noraidīts."),
        });
      }
      window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
    } finally {
      setPendingInviteId(null);
    }
  }

  return (
    <div ref={menuRef} className="relative shrink-0">
      <OptionalTooltip label={open ? null : label}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={label}
          className={`relative inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition ${
            open ? "bg-zinc-100 text-zinc-800" : "hover:bg-zinc-100 hover:text-zinc-800"
          }`}
        >
          <i className="fas fa-bell text-[14px]" aria-hidden="true" />
          {unreadCount > 0 ? (
            <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          ) : null}
        </button>
      </OptionalTooltip>

      {open ? (
        <div
          role="menu"
          className="absolute top-full right-0 z-[70] mt-1 w-[22rem] overflow-hidden rounded-xl bg-white py-2 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
        >
          <div className="flex items-center justify-between gap-2 px-3 pb-1.5">
            <p className="text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
              {label}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => markAllRead()}
                  className="text-[11px] font-medium text-zinc-500 transition hover:text-zinc-800"
                >
                  {t("notifications.mark_all", "Atzīmēt visus kā lasītus")}
                </button>
              ) : null}
              {items.length > 0 ? (
                <OptionalTooltip label={dismissAllLabel}>
                  <button
                    type="button"
                    onClick={() => setClearAllOpen(true)}
                    aria-label={dismissAllLabel}
                    disabled={clearingAll}
                    className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <i
                      className={
                        clearingAll
                          ? "fas fa-circle-notch fa-spin text-[12px]"
                          : "fas fa-trash-can text-[12px]"
                      }
                      aria-hidden="true"
                    />
                  </button>
                </OptionalTooltip>
              ) : null}
              <OptionalTooltip label={settingsLabel}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setSettingsOpen(true);
                  }}
                  aria-label={settingsLabel}
                  className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
                >
                  <i className="fas fa-sliders text-[12px]" aria-hidden="true" />
                </button>
              </OptionalTooltip>
            </div>
          </div>

          {isLoading ? (
            <LoadingState compact className="justify-center py-6" />
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-zinc-400">
              {t("notifications.empty", "Nav paziņojumu")}
            </p>
          ) : (
            <VirtualWindow
              count={items.length}
              itemHeight={notificationItemHeight}
              threshold={40}
              className="max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto"
            >
              {(index) => {
                const item = items[index];
                const actor = findMemberAcrossTeams(membersByTeam, item.actorId);
                const recipient = findMemberAcrossTeams(membersByTeam, item.recipientId);
                const unread = item.readAt === null;
                const isTeamInvite =
                  item.kind === "team_invite" &&
                  item.invitationId &&
                  item.targetUserId === authUser?.id;
                const isInviteRejected = item.kind === "team_invite_rejected";

                if (isTeamInvite) {
                  const inviteBusy = pendingInviteId === item.invitationId;
                  return (
                    <div
                      key={item.id}
                      className={`group/notif flex w-full items-start gap-3 px-3 py-2.5 text-left ${
                        unread ? "bg-sky-50/70" : ""
                      }`}
                    >
                      {actor ? (
                        <UserAvatar member={actor} size="sm" />
                      ) : (
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                          <i className="fas fa-user-plus text-[11px]" aria-hidden="true" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[13px] leading-snug ${
                            unread
                              ? "font-medium text-zinc-900"
                              : "text-zinc-600"
                          }`}
                        >
                          {notificationText(
                            item,
                            actor?.name ?? "",
                            recipient?.name ?? "",
                            currentUser.id,
                            t,
                            item.taskTitle.trim() ? formatDate(item.taskTitle) : "",
                          )}
                        </span>
                        <NotificationMeta
                          item={item}
                          now={now}
                          showTeamLabel={showTeamLabels}
                          t={t}
                        />
                        {unread ? (
                          <span className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={inviteBusy}
                              onClick={() => {
                                void handleInviteResponse(
                                  item.invitationId!,
                                  "accept",
                                  item.teamId,
                                );
                              }}
                              className="inline-flex min-h-8 items-center justify-center rounded-xl bg-blue-700 px-3 text-[12px] font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
                            >
                              {inviteBusy
                                ? t("actions.saving", "Saglabā…")
                                : t("actions.accept", "Apstiprināt")}
                            </button>
                            <button
                              type="button"
                              disabled={inviteBusy}
                              onClick={() => {
                                void handleInviteResponse(
                                  item.invitationId!,
                                  "reject",
                                  item.teamId,
                                );
                              }}
                              className="inline-flex min-h-8 items-center justify-center rounded-xl bg-zinc-100 px-3 text-[12px] font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
                            >
                              {t("actions.reject", "Noraidīt")}
                            </button>
                          </span>
                        ) : null}
                      </span>
                      {!unread ? (
                        <button
                          type="button"
                          onClick={() => dismiss(item.id)}
                          aria-label={dismissLabel}
                          className="mt-1 shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-zinc-600 group-hover/notif:opacity-100"
                        >
                          <i className="fas fa-xmark text-[10px]" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  );
                }

                if (isInviteRejected) {
                  return (
                    <div
                      key={item.id}
                      role="menuitem"
                      tabIndex={0}
                      onClick={() => markRead(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") markRead(item.id);
                      }}
                      className={`group/notif flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-100 ${
                        unread ? "bg-sky-50/70" : ""
                      }`}
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                        <i className="fas fa-user-xmark text-[11px]" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[13px] leading-snug ${
                            unread
                              ? "font-medium text-zinc-900"
                              : "text-zinc-600"
                          }`}
                        >
                          {notificationText(
                            item,
                            actor?.name ?? "",
                            recipient?.name ?? "",
                            currentUser.id,
                            t,
                            item.taskTitle.trim() ? formatDate(item.taskTitle) : "",
                          )}
                        </span>
                        <NotificationMeta
                          item={item}
                          now={now}
                          showTeamLabel={showTeamLabels}
                          t={t}
                        />
                      </span>
                      {unread ? (
                        <span
                          className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500"
                          aria-hidden="true"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            dismiss(item.id);
                          }}
                          aria-label={dismissLabel}
                          className="mt-1 shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-zinc-600 group-hover/notif:opacity-100"
                        >
                          <i className="fas fa-xmark text-[10px]" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    role="menuitem"
                    tabIndex={0}
                    onClick={() => openNotification(item)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") openNotification(item);
                    }}
                    className={`group/notif flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-100 ${
                      unread ? "bg-sky-50/70" : ""
                    }`}
                  >
                    {actor ? (
                      <UserAvatar member={actor} size="sm" />
                    ) : (
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                          item.kind === "seat_open"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.kind === "billing_due"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        <i
                          className={`fas ${
                            item.kind === "seat_open"
                              ? "fa-user-check"
                              : item.kind === "billing_due"
                                ? "fa-credit-card"
                                : "fa-clock"
                          } text-[11px]`}
                          aria-hidden="true"
                        />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[13px] leading-snug ${
                          unread
                            ? "font-medium text-zinc-900"
                            : "text-zinc-600"
                        }`}
                      >
                        {notificationText(
                          item,
                          actor?.name ?? "",
                          recipient?.name ?? "",
                          currentUser.id,
                          t,
                          item.taskTitle.trim() ? formatDate(item.taskTitle) : "",
                        )}
                      </span>
                      <NotificationMeta
                        item={item}
                        now={now}
                        showTeamLabel={showTeamLabels}
                        t={t}
                      />
                    </span>
                    {unread ? (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-sky-500"
                        aria-hidden="true"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          dismiss(item.id);
                        }}
                        aria-label={dismissLabel}
                        className="mt-1 shrink-0 rounded p-0.5 text-zinc-300 opacity-0 transition hover:text-zinc-600 group-hover/notif:opacity-100"
                      >
                        <i className="fas fa-xmark text-[10px]" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                );
              }}
            </VirtualWindow>
          )}
        </div>
      ) : null}

      <ConfirmModal
        open={clearAllOpen}
        onOpenChange={(next) => {
          if (clearingAll) return;
          setClearAllOpen(next);
        }}
        title={t("notifications.dismiss_all_title", "Dzēst visus paziņojumus?")}
        description={t(
          "notifications.dismiss_all_description",
          "Visi redzamie paziņojumi tiks neatgriezeniski dzēsti.",
        )}
        confirmLabel={t("notifications.dismiss_all", "Dzēst visus")}
        confirmVariant="danger"
        blocking={clearingAll}
        onConfirm={() => {
          if (clearingAll) return;
          setClearingAll(true);
          dismissAll();
          setClearAllOpen(false);
          setClearingAll(false);
        }}
      />

      <NotificationSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
