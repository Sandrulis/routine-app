"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChangePasswordModal } from "@/app/components/change-password-modal";
import { NotificationSettingsModal } from "@/app/components/notification-settings-modal";
import { PersonalInfoModal } from "@/app/components/personal-info-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { OverflowTooltip } from "@/app/components/tooltip";
import { UserAvatar } from "@/app/components/user-avatar";
import { userHasPasswordLogin } from "@/app/lib/auth/map-user-display";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel, type TeamMember } from "@/app/lib/team";

export function UserMenu({ user }: { user: TeamMember }) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslations();
  const { teams, roles } = useTeam();
  const rank = teams.length === 0 ? null : teamRankLabel(user.role, t, roles);
  const { showFeedback } = useFeedbackToast();
  const { user: authUser } = useAuthSession();
  const canChangePassword = userHasPasswordLogin(authUser);
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [personalInfoOpen, setPersonalInfoOpen] = useState(false);
  const [notificationSettingsOpen, setNotificationSettingsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function closeAnd(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("user_menu.label", "Lietotāja izvēlne")}
        className={`flex h-9 w-full items-center gap-2 rounded-md px-1.5 text-left transition ${
          open ? "bg-zinc-100" : "hover:bg-zinc-100"
        }`}
      >
        <UserAvatar member={user} size="xs" />
        <OverflowTooltip label={user.name} className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[13px] text-zinc-800">{user.name}</span>
            {rank ? (
              <span className="truncate text-[11px] text-zinc-400">{rank}</span>
            ) : null}
          </span>
        </OverflowTooltip>
        <i className="fas fa-chevron-up text-[9px] text-zinc-400" aria-hidden="true" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute bottom-full left-0 z-[70] mb-2 w-[248px] overflow-hidden rounded-xl bg-white py-2 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
        >
          <p className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-zinc-400 uppercase">
            {t("user_menu.heading", "Konts")}
          </p>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              closeAnd(() => {
                setPersonalInfoOpen(true);
              })
            }
            className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-zinc-100"
          >
            <i
              className="fas fa-id-card mt-0.5 w-4 text-center text-[13px] text-zinc-500"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-zinc-900">
                {t("user_menu.personal_info", "Personīgā informācija")}
              </span>
              <span className="mt-0.5 block text-[12px] text-zinc-400">
                {t("user_menu.personal_info_hint", "Vārds un uzvārds")}
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              closeAnd(() => {
                router.push("/settings/profile");
              })
            }
            className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-zinc-100"
          >
            <i
              className="fas fa-user-gear mt-0.5 w-4 text-center text-[13px] text-zinc-500"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-zinc-900">
                {t("user_menu.settings", "Personīgie uzstādījumi")}
              </span>
              <span className="mt-0.5 block text-[12px] text-zinc-400">
                {t(
                  "user_menu.settings_hint",
                  "Profils, valoda un datumu attēlojums",
                )}
              </span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              closeAnd(() => {
                setNotificationSettingsOpen(true);
              })
            }
            className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-zinc-100"
          >
            <i
              className="fas fa-bell mt-0.5 w-4 text-center text-[13px] text-zinc-500"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-zinc-900">
                {t("user_menu.notifications", "Paziņojumu uzstādījumi")}
              </span>
              <span className="mt-0.5 block text-[12px] text-zinc-400">
                {t(
                  "user_menu.notifications_hint",
                  "Izvēlies, par ko saņemt brīdinājumus",
                )}
              </span>
            </span>
          </button>
          {canChangePassword ? (
            <button
              type="button"
              role="menuitem"
              onClick={() =>
                closeAnd(() => {
                  setPasswordOpen(true);
                })
              }
              className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-zinc-100"
            >
              <i
                className="fas fa-key mt-0.5 w-4 text-center text-[13px] text-zinc-500"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-zinc-900">
                  {t("user_menu.password", "Mainīt paroli")}
                </span>
                <span className="mt-0.5 block text-[12px] text-zinc-400">
                  {t("user_menu.password_hint", "Atjauno piekļuves paroli")}
                </span>
              </span>
            </button>
          ) : null}
          <div className="my-1.5 border-t border-zinc-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() =>
              closeAnd(() => {
                void (async () => {
                  if (isSupabaseConfigured()) {
                    await createClient().auth.signOut();
                  }
                  showFeedback({
                    type: "info",
                    text: t("user_menu.sign_out_done", "Tu izgāji no sistēmas."),
                  });
                  router.push("/");
                })();
              })
            }
            className="flex w-full items-start gap-3 px-3 py-2 text-left transition hover:bg-zinc-100"
          >
            <i
              className="fas fa-right-from-bracket mt-0.5 w-4 text-center text-[13px] text-zinc-500"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-zinc-900">
                {t("user_menu.sign_out", "Iziet")}
              </span>
              <span className="mt-0.5 block text-[12px] text-zinc-400">
                {t("user_menu.sign_out_hint", "Iziet no sistēmas")}
              </span>
            </span>
          </button>
        </div>
      ) : null}

      <PersonalInfoModal
        open={personalInfoOpen}
        onOpenChange={setPersonalInfoOpen}
        user={user}
        onSave={() => {
          showFeedback({
            type: "success",
            text: t("profile.personal.feedback.saved", "Profils saglabāts."),
          });
        }}
      />

      <NotificationSettingsModal
        open={notificationSettingsOpen}
        onOpenChange={setNotificationSettingsOpen}
      />

      {canChangePassword ? (
        <ChangePasswordModal
          open={passwordOpen}
          onOpenChange={setPasswordOpen}
          onSave={() => {
            showFeedback({
              type: "success",
              text: t("user_menu.password.saved", "Parole atjaunota."),
            });
          }}
        />
      ) : null}
    </div>
  );
}
