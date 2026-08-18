"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { TeamPermissionFields } from "@/app/components/team-permission-fields";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { canManageTeamSettings, OWNER_TEAM_ROLE, teamRankLabel } from "@/app/lib/team";
import {
  cloneTeamPermissions,
  createFullTeamPermissions,
  sameTeamPermissions,
  type TeamPermissionSet,
} from "@/app/lib/team-permissions";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function TeamRoleAccessModal({
  open,
  onOpenChange,
  roleId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId?: string | null;
}) {
  const { t } = useTranslations();
  const { isAdmin } = useIsAdmin();
  const { showFeedback } = useFeedbackToast();
  const { roles, currentUser, updateRolePermissions } = useTeam();
  const [selectedRoleId, setSelectedRoleId] = useState(roleId ?? roles[0]?.id ?? "");
  const [draftByRoleId, setDraftByRoleId] = useState<Record<string, TeamPermissionSet>>(
    () =>
      Object.fromEntries(
        roles.map((role) => [role.id, cloneTeamPermissions(role.permissions)]),
      ),
  );
  const canManage = canManageTeamSettings(
    currentUser,
    roles,
    isAdmin,
    "team.permissions.manage",
  );
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;
  const isOwnerRole = selectedRole?.slug === OWNER_TEAM_ROLE;
  const draft = selectedRole ? draftByRoleId[selectedRole.id] : null;
  const saved = selectedRole?.permissions ?? null;
  const isDirty = Boolean(draft && saved && !sameTeamPermissions(draft, saved));

  useEffect(() => {
    if (!open) return;
    setDraftByRoleId(
      Object.fromEntries(
        roles.map((role) => [role.id, cloneTeamPermissions(role.permissions)]),
      ),
    );
    setSelectedRoleId(
      roleId && roles.some((role) => role.id === roleId)
        ? roleId
        : (roles[0]?.id ?? ""),
    );
  }, [open, roleId, roles]);

  const selectedLabel = useMemo(
    () =>
      selectedRole
        ? (teamRankLabel(selectedRole.slug, t, roles) ?? selectedRole.name)
        : "",
    [roles, selectedRole, t],
  );

  function updateNav(key: keyof TeamPermissionSet["nav"], enabled: boolean) {
    if (!selectedRole || isOwnerRole) return;
    setDraftByRoleId((current) => ({
      ...current,
      [selectedRole.id]: {
        ...current[selectedRole.id],
        nav: {
          ...current[selectedRole.id].nav,
          [key]: enabled,
        },
      },
    }));
  }

  function updateAction(key: keyof TeamPermissionSet["actions"], enabled: boolean) {
    if (!selectedRole || isOwnerRole) return;
    setDraftByRoleId((current) => ({
      ...current,
      [selectedRole.id]: {
        ...current[selectedRole.id],
        actions: {
          ...current[selectedRole.id].actions,
          [key]: enabled,
        },
      },
    }));
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage || !selectedRole || !draft || isOwnerRole) return;
    updateRolePermissions(selectedRole.id, draft);
    showFeedback({
      type: "success",
      text: t("team.access.feedback.saved", "Lomas pieejas saglabātas."),
    });
    onOpenChange(false);
  }

  const displayDraft = isOwnerRole ? createFullTeamPermissions(true) : draft;

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("team.roles.access_tooltip", "Pieejas pašai lomai")}
      description={
        selectedLabel ||
        t(
          "team.access.description",
          "Katrai lomai norādi, kuras sadaļas un darbības ir pieejamas.",
        )
      }
      dirty={isDirty}
      overlayZIndex={80}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSave} className="space-y-5">

        {displayDraft && selectedRole ? (
          <fieldset
            disabled={!canManage || isOwnerRole}
            className="space-y-5 disabled:opacity-80"
          >
            {isOwnerRole ? (
              <p className="text-sm text-zinc-500">
                {t(
                  "team.access.owner_locked",
                  "Īpašnieka lomai ir pilna pieeja, un to nevar mainīt.",
                )}
              </p>
            ) : null}

            <TeamPermissionFields
              value={displayDraft}
              disabled={!canManage || isOwnerRole}
              onNavChange={updateNav}
              onActionChange={updateAction}
            />
          </fieldset>
        ) : (
          <p className="text-sm text-zinc-500">
            {t("team.roles.empty", "Nav nevienas lomas.")}
          </p>
        )}

        {!canManage ? (
          <p className="text-sm text-zinc-500">
            {t(
              "team.access.owner_only",
              "Lomu pieejas var mainīt tikai komandas īpašnieks.",
            )}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <p className="text-[12px] text-zinc-400">{selectedLabel}</p>
          <button
            type="submit"
            disabled={!canManage || !isDirty || isOwnerRole}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
