"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import {
  CreateItemMenu,
  createMenuAnchorFromEvent,
  type CreateMenuAnchor,
} from "@/app/components/create-item-menu";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ListBadge } from "@/app/components/list-badge";
import { LoadingSpinner } from "@/app/components/loading-state";
import { NameFormModal } from "@/app/components/name-form-modal";
import { OverflowTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel, type WorkTeam } from "@/app/lib/team";

function TeamAvatar({
  team,
  size = "md",
}: {
  team: WorkTeam;
  size?: "sm" | "md";
}) {
  return (
    <ListBadge
      name={team.name}
      icon={team.icon}
      color={team.color}
      logoUrl={team.logoUrl}
      size={size}
    />
  );
}

export function TeamSwitcher() {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { isReady, teams, currentTeam, currentUser, addTeam, updateTeam, deleteTeam, selectTeam, roles } =
    useTeam();
  const needsTeam = isReady && teams.length === 0;
  const rank = teamRankLabel(currentUser.role, t, roles);
  const teamRank = rank ?? t("teams.rank.owner", "Īpašnieks");
  const [open, setOpen] = useState(false);
  const [formTeam, setFormTeam] = useState<WorkTeam | "new" | null>(null);
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<WorkTeam | null>(null);
  const [itemMenu, setItemMenu] = useState<{
    teamId: string;
    anchor: CreateMenuAnchor;
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-app-modal-ignore-backdrop]")
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (itemMenu) return;
      event.preventDefault();
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [itemMenu, open]);

  const editingTeam = formTeam && formTeam !== "new" ? formTeam : null;
  const teamLabel = currentTeam?.name ?? t("teams.add.title", "Jauna komanda");
  const formOpen = needsTeam || formTeam !== null;

  function openTeamActions(event: MouseEvent<HTMLButtonElement>, team: WorkTeam) {
    event.preventDefault();
    event.stopPropagation();
    setItemMenu({
      teamId: team.id,
      anchor: createMenuAnchorFromEvent(event),
    });
  }

  return (
    <div
      ref={menuRef}
      className="relative shrink-0 px-2 py-2"
    >
      <button
        type="button"
        onClick={() => {
          if (!isReady || needsTeam) return;
          setOpen((current) => !current);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={teamLabel}
        className={`flex w-full min-h-12 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition ${
          open ? "bg-zinc-100 ring-2 ring-zinc-300 ring-offset-2" : "hover:bg-zinc-100"
        }`}
      >
        {currentTeam ? (
          <TeamAvatar team={currentTeam} />
        ) : isReady ? (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
            <i className="fas fa-plus text-[11px]" aria-hidden="true" />
          </span>
        ) : (
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
            <LoadingSpinner size="sm" className="text-zinc-400" />
          </span>
        )}
        <OverflowTooltip label={teamLabel} className="min-w-0 flex-1">
          <span className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-[15px] font-semibold text-zinc-900">
              {isReady ? teamLabel : t("common.loading", "Ielādē…")}
            </span>
            {rank ? (
              <span className="truncate text-[11px] text-zinc-400">{rank}</span>
            ) : null}
          </span>
        </OverflowTooltip>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute top-full left-2 z-[70] mt-1 w-[248px] overflow-hidden rounded-xl bg-white py-2 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
        >
          {teams.map((team) => {
            const isCurrent = team.id === currentTeam?.id;
            return (
              <div
                key={team.id}
                className={`group flex w-full items-center gap-1 pr-1.5 transition hover:bg-zinc-100 ${
                  isCurrent ? "bg-zinc-50" : ""
                }`}
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    selectTeam(team.id);
                    setOpen(false);
                  }}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
                >
                  <TeamAvatar team={team} />
                  <OverflowTooltip label={team.name} className="min-w-0 flex-1">
                    <span className="block min-w-0">
                      <span className="block truncate text-[13px] font-medium text-zinc-900">
                        {team.name}
                      </span>
                      {rank ? (
                        <span className="mt-0.5 block truncate text-[11px] text-zinc-400">
                          {rank}
                        </span>
                      ) : null}
                    </span>
                  </OverflowTooltip>
                </button>
                <span className="flex shrink-0 items-center pr-1">
                  <button
                    type="button"
                    aria-label={t("nav.more", "Vairāk")}
                    onClick={(event) => openTeamActions(event, team)}
                    className="inline-flex size-7 items-center justify-center rounded-md text-zinc-500 opacity-0 hover:bg-zinc-200 hover:text-zinc-800 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    <i className="fas fa-ellipsis text-[13px]" aria-hidden="true" />
                  </button>
                  {isCurrent ? (
                    <span className="inline-flex size-7 items-center justify-center text-zinc-500">
                      <i className="fas fa-check text-[11px]" aria-hidden="true" />
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
          <div className="my-1.5 border-t border-zinc-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setFormTeam("new");
            }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left transition hover:bg-zinc-100"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
              <i className="fas fa-plus text-[11px]" aria-hidden="true" />
            </span>
            <span className="text-[13px] font-medium text-zinc-900">
              {t("teams.add", "Pievienot jaunu komandu")}
            </span>
          </button>
        </div>
      ) : null}

      <CreateItemMenu
        open={itemMenu !== null}
        anchor={itemMenu?.anchor ?? null}
        title={t("common.actions", "Darbības")}
        items={[
          {
            id: "edit",
            icon: "fas fa-pen",
            title: t("actions.edit", "Labot"),
          },
          {
            id: "delete",
            icon: "fas fa-trash",
            title: t("actions.delete", "Dzēst"),
            danger: true,
            dividerBefore: true,
          },
        ]}
        onClose={() => setItemMenu(null)}
        onSelect={(id) => {
          const team = teams.find((item) => item.id === itemMenu?.teamId) ?? null;
          setItemMenu(null);
          if (!team) return;
          if (id === "edit") {
            setOpen(false);
            setFormTeam(team);
            return;
          }
          if (id === "delete") {
            if (teams.length <= 1) {
              showFeedback({
                type: "info",
                text: t("teams.delete.last", "Nevar dzēst pēdējo komandu."),
              });
              return;
            }
            setOpen(false);
            setDeleteTeamTarget(team);
          }
        }}
      />

      <NameFormModal
        open={formOpen}
        blocking={needsTeam}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && needsTeam) return;
          if (!nextOpen) setFormTeam(null);
        }}
        title={
          editingTeam
            ? t("teams.edit.title", "Labot komandu")
            : t("teams.add.title", "Jauna komanda")
        }
        description={
          editingTeam
            ? t(
                "teams.edit.description",
                "Maini komandas nosaukumu, izskatu vai logotipu.",
              )
            : needsTeam
              ? t(
                  "teams.required.description",
                  "Lai sāktu darbu, izveido savu komandu. Modālis aizvērsies pēc pievienošanas.",
                )
              : t(
                  "teams.add.description",
                  "Norādi nosaukumu, izvēlies avatāra izskatu vai pievieno logotipu.",
                )
        }
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={t(
          "teams.fields.name_placeholder",
          "Piemēram, Studio, Klienti",
        )}
        descriptionLabel=""
        descriptionPlaceholder=""
        submitLabel={
          editingTeam
            ? t("actions.save", "Saglabāt")
            : t("actions.add", "Pievienot")
        }
        showAppearance
        showDescription={false}
        showLogo
        showIcons={false}
        rankLabel={teamRank}
        initialValue={
          editingTeam
            ? {
                name: editingTeam.name,
                description: "",
                icon: editingTeam.icon,
                color: editingTeam.color,
                logoUrl: editingTeam.logoUrl,
              }
            : null
        }
        onCreate={(input) => {
          if (editingTeam) {
            updateTeam(editingTeam.id, {
              name: input.name,
              icon: input.icon ?? null,
              color: input.color,
              logoUrl: input.logoUrl ?? null,
            });
            showFeedback({
              type: "success",
              text: t("teams.updated", "Komanda saglabāta."),
            });
            return;
          }
          addTeam({
            name: input.name,
            icon: input.icon ?? null,
            color: input.color,
            logoUrl: input.logoUrl ?? null,
          });
          showFeedback({
            type: "success",
            text: t("teams.created", "Komanda pievienota."),
          });
        }}
      />

      <ConfirmModal
        open={deleteTeamTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteTeamTarget(null);
        }}
        title={t("teams.delete.title", "Dzēst komandu?")}
        description={t(
          "teams.delete.description",
          "Komanda “{name}” tiks dzēsta.",
          { name: deleteTeamTarget?.name ?? "" },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          if (!deleteTeamTarget) return;
          const removed = deleteTeam(deleteTeamTarget.id);
          setDeleteTeamTarget(null);
          showFeedback({
            type: removed ? "success" : "info",
            text: removed
              ? t("teams.deleted", "Komanda dzēsta.")
              : t("teams.delete.last", "Nevar dzēst pēdējo komandu."),
          });
        }}
      />
    </div>
  );
}
