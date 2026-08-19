"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OptionalTooltip } from "@/app/components/tooltip";
import { LoadingState } from "@/app/components/loading-state";
import { NotificationSettingsModal } from "@/app/components/notification-settings-modal";
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
import { getTeamMember } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

function notificationText(
  item: AppNotification,
  actorName: string,
  recipientName: string,
  currentUserId: string,
  t: (key: string, fallback: string, params?: Record<string, string>) => string,
) {
  const params = { name: actorName, task: item.taskTitle, assignee: recipientName, team: item.taskTitle };
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
  const { showFeedback } = useFeedbackToast();
  const { user: authUser } = useAuthSession();
  const { members, currentUser, refreshTeams } = useTeam();
  const { items, isLoading, unreadCount, markRead, markAllRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [pendingInviteId, setPendingInviteId] = useState<string | null>(null);
  const label = t("notifications.label", "Paziņojumi");
  const settingsLabel = t("user_menu.notifications", "Paziņojumu uzstādījumi");
  const dismissLabel = t("notifications.dismiss", "Noņemt");

  useEffect(() => {
    if (!open) return;
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, [open]);

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

  async function handleInviteResponse(
    invitationId: string,
    action: "accept" | "reject",
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
            <div className="max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto">
              {items.map((item) => {
                const actor = getTeamMember(members, item.actorId);
                const recipient = getTeamMember(members, item.recipientId);
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
                          )}
                        </span>
                        <span className="mt-0.5 block text-[11px] tabular-nums text-zinc-400">
                          {notificationTime(item.createdAt, now, t)}
                        </span>
                        {unread ? (
                          <span className="mt-2 flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={inviteBusy}
                              onClick={() => {
                                void handleInviteResponse(item.invitationId!, "accept");
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
                                void handleInviteResponse(item.invitationId!, "reject");
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
                          )}
                        </span>
                        <span className="mt-0.5 block text-[11px] tabular-nums text-zinc-400">
                          {notificationTime(item.createdAt, now, t)}
                        </span>
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
                    onClick={() => {
                      markRead(item.id);
                      setOpen(false);
                      if (item.href) router.push(item.href);
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      markRead(item.id);
                      setOpen(false);
                      if (item.href) router.push(item.href);
                    }}
                    className={`group/notif flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-100 ${
                      unread ? "bg-sky-50/70" : ""
                    }`}
                  >
                    {actor ? (
                      <UserAvatar member={actor} size="sm" />
                    ) : (
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                        <i className="fas fa-clock text-[11px]" aria-hidden="true" />
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
                        )}
                      </span>
                      <span className="mt-0.5 block text-[11px] tabular-nums text-zinc-400">
                        {notificationTime(item.createdAt, now, t)}
                      </span>
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
              })}
            </div>
          )}
        </div>
      ) : null}

      <NotificationSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
