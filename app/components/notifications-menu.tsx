"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { getLastOnlineDisplay } from "@/app/lib/last-online";
import type { AppNotification } from "@/app/lib/notifications";
import { useNotifications } from "@/app/lib/use-notifications";
import { getTeamMember } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

function notificationText(
  item: AppNotification,
  actorName: string,
  recipientName: string,
  currentUserId: string,
  t: (key: string, fallback: string, params?: Record<string, string>) => string,
) {
  const params = { name: actorName, task: item.taskTitle, assignee: recipientName };
  if (item.kind === "assigned") {
    if (item.recipientId && item.recipientId !== currentUserId && recipientName) {
      return t(
        "notifications.item.assigned_other",
        "{name} piešķīra {assignee} “{task}”",
        params,
      );
    }
    return t(
      "notifications.item.assigned",
      "{name} piešķīra tev “{task}”",
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
  return t("notifications.item.due", "Tuvojas termiņš: “{task}”", params);
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
  const { members, currentUser } = useTeam();
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const label = t("notifications.label", "Paziņojumi");

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
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-[11px] font-medium text-zinc-500 transition hover:text-zinc-800"
              >
                {t("notifications.mark_all", "Atzīmēt visus kā lasītus")}
              </button>
            ) : null}
          </div>

          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-zinc-400">
              {t("notifications.empty", "Nav paziņojumu")}
            </p>
          ) : (
            <div className="max-h-[min(24rem,calc(100vh-6rem))] overflow-y-auto">
              {items.map((item) => {
                const actor = getTeamMember(members, item.actorId);
                const recipient = getTeamMember(members, item.recipientId);
                const unread = item.readAt === null;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      markRead(item.id);
                      setOpen(false);
                      if (item.href) router.push(item.href);
                    }}
                    className={`flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-zinc-100 ${
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
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
