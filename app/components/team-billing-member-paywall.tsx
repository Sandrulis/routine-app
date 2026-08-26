"use client";

import type { ReactNode } from "react";
import { AppModal } from "@/app/components/app-modal";
import { ListBadge } from "@/app/components/list-badge";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeamBillingAccess } from "@/app/lib/billing/use-team-billing-access";
import { REQUEST_CREATE_TEAM_EVENT, type WorkTeam } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

const paywallOverlayClassName =
  "left-[var(--app-sidebar-width-expanded)] max-md:left-0";

function TeamBillingBlockedModal({
  open,
  otherTeams,
  onSelectTeam,
  onCreateTeam,
}: {
  open: boolean;
  otherTeams: WorkTeam[];
  onSelectTeam: (teamId: string) => void;
  onCreateTeam: () => void;
}) {
  const { t } = useTranslations();

  return (
    <AppModal
      open={open}
      onOpenChange={() => undefined}
      blocking
      overlayClassName={paywallOverlayClassName}
      title={t(
        "team.billing.member_paywall.title",
        "Komandas abonements nav apmaksāts",
      )}
      description={t(
        "team.billing.member_paywall.description",
        "Tava komanda vēl nav samaksājusi par abonementu. Sistēmas saturs nav pieejams, kamēr komandas vadītājs neapmaksā abonementu.",
      )}
      panelMaxWidthClassName="max-w-lg"
    >
      <p className="text-sm leading-relaxed text-zinc-600">
        {t(
          "team.billing.member_paywall.hint",
          "Sazinies ar komandas vadītāju, lai viņš noformētu maksājumu sadaļā Abonementi.",
        )}
      </p>

      <div className="mt-5 border-t border-zinc-100 pt-5">
        <p className="text-sm font-medium text-zinc-900">
          {t(
            "team.billing.member_paywall.switch_hint",
            "Vari pārslēgties uz citu komandu vai izveidot jaunu.",
          )}
        </p>

        {otherTeams.length > 0 ? (
          <ul className="mt-3 space-y-1">
            {otherTeams.map((team) => (
              <li key={team.id}>
                <button
                  type="button"
                  onClick={() => onSelectTeam(team.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-zinc-50"
                >
                  <ListBadge
                    name={team.name}
                    icon={team.icon}
                    color={team.color}
                    logoUrl={team.logoUrl}
                    size="sm"
                  />
                  <span className="min-w-0 truncate text-sm font-medium text-zinc-900">
                    {team.name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={onCreateTeam}
          className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("teams.add", "Pievienot jaunu komandu")}
        </button>
      </div>
    </AppModal>
  );
}

export function TeamBillingMemberPaywall({ children }: { children: ReactNode }) {
  const { memberBlocked, isReady } = useTeamBillingAccess();
  const { currentTeam, teams, selectTeam } = useTeam();

  if (!isReady || !currentTeam) {
    return <>{children}</>;
  }

  if (!memberBlocked) {
    return <>{children}</>;
  }

  const otherTeams = teams.filter((team) => team.id !== currentTeam.id);

  function handleCreateTeam() {
    window.dispatchEvent(new Event(REQUEST_CREATE_TEAM_EVENT));
  }

  return (
    <>
      <div className="relative min-h-[12rem] flex-1">
        <div
          aria-hidden="true"
          className="pointer-events-none select-none blur-sm saturate-[0.85]"
        >
          {children}
        </div>
      </div>
      <TeamBillingBlockedModal
        open
        otherTeams={otherTeams}
        onSelectTeam={selectTeam}
        onCreateTeam={handleCreateTeam}
      />
    </>
  );
}
