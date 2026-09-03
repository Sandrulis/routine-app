"use client";

import { useEffect, useState, useTransition } from "react";
import { listAdminTeamMembersAction, setAdminTeamVipAction } from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ListBadge } from "@/app/components/list-badge";
import { LoadingState } from "@/app/components/loading-state";
import { MemberLastOnline } from "@/app/components/member-last-online";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { initialsFromName, teamRankLabel } from "@/app/lib/team";
import type {
  AdminTeamMemberSummary,
  AdminTeamMembersTarget,
} from "@/app/lib/site-admin/types";

type AdminTeamMembersModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: AdminTeamMembersTarget | null;
  onVipChange?: (teamId: string, isVip: boolean) => void;
};

export function AdminTeamMembersModal({
  open,
  onOpenChange,
  team,
  onVipChange,
}: AdminTeamMembersModalProps) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const [members, setMembers] = useState<AdminTeamMemberSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isVip, setIsVip] = useState(team?.isVip === true);
  const [vipPending, startVipTransition] = useTransition();

  useEffect(() => {
    setIsVip(team?.isVip === true);
  }, [team]);

  useEffect(() => {
    if (!open || !team) {
      setMembers([]);
      setLoadFailed(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);

    void listAdminTeamMembersAction(team.id)
      .then((nextMembers) => {
        if (cancelled) return;
        setMembers(nextMembers);
      })
      .catch(() => {
        if (cancelled) return;
        setMembers([]);
        setLoadFailed(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, team]);

  function toggleVip() {
    if (!team || vipPending) return;
    const next = !isVip;
    startVipTransition(async () => {
      const result = await setAdminTeamVipAction(team.id, next);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setIsVip(next);
      onVipChange?.(team.id, next);
      showFeedback({
        type: "success",
        text: t("admin.teams.vip.saved", "VIP statuss saglabāts."),
      });
    });
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={team?.name ?? t("admin.teams.members", "Lietotāji")}
      description={t("admin.teams.members.description", "Komandas lietotāju saraksts.")}
      panelMaxWidthClassName="max-w-lg"
    >
      {team ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <ListBadge
              name={team.name}
              icon={team.icon ?? null}
              color={team.color ?? "black"}
              logoUrl={team.logoUrl ?? null}
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-zinc-900">{team.name}</p>
              <p className="text-sm text-zinc-500">
                {loading
                  ? t("admin.teams.members.loading", "Ielādē lietotājus…")
                  : t("admin.teams.members.count", "{count} lietotāji", {
                      count: members.length,
                    })}
              </p>
            </div>
            <button
              type="button"
              aria-pressed={isVip}
              aria-label={
                isVip
                  ? t("admin.teams.vip.disable", "Noņemt VIP")
                  : t("admin.teams.vip.enable", "Padarīt par VIP")
              }
              title={
                isVip
                  ? t("admin.teams.vip.disable", "Noņemt VIP")
                  : t("admin.teams.vip.enable", "Padarīt par VIP")
              }
              disabled={vipPending}
              onClick={toggleVip}
              className="ml-auto flex size-10 shrink-0 items-center justify-center rounded-lg text-xl transition hover:bg-zinc-200/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <i
                className={
                  isVip ? "fas fa-star text-amber-400" : "far fa-star text-zinc-300"
                }
                aria-hidden="true"
              />
            </button>
          </div>

          {loading ? (
            <LoadingState compact className="justify-center py-8" />
          ) : loadFailed ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {t("admin.teams.members.load_failed", "Neizdevās ielādēt lietotājus.")}
            </p>
          ) : members.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">
              {t("admin.teams.members.empty", "Nav lietotāju.")}
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
              {members.map((member) => {
                const roleLabel = teamRankLabel(member.role, t);
                return (
                  <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                        <UserAvatar
                      member={{
                        id: member.id,
                        name: member.name,
                        initials: initialsFromName(member.name),
                        role: member.role,
                        roleId: null,
                        dutyIds: [],
                        email: member.email,
                        toneClassName: "bg-zinc-100 text-zinc-700",
                        lastOnlineAt: member.lastOnlineAt,
                        avatarUrl: member.avatarUrl,
                      }}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-900">{member.name}</p>
                      <p className="truncate text-sm text-zinc-500">{member.email}</p>
                      {roleLabel ? (
                        <p className="truncate text-sm text-zinc-500">{roleLabel}</p>
                      ) : null}
                    </div>
                    <div className="shrink-0">
                      {member.lastOnlineAt ? (
                        <MemberLastOnline lastOnlineAt={member.lastOnlineAt} />
                      ) : (
                        <span className="text-[11px] text-zinc-400">
                          {t("admin.users.last_seen_never", "Vēl nav ienācis")}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </AppModal>
  );
}
