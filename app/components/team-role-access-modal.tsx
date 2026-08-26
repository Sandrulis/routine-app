"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { TeamPermissionFields } from "@/app/components/team-permission-fields";
import { useTranslations } from "@/app/components/translations-provider";
import { canManageTeamSettings, OWNER_TEAM_ROLE, teamRankLabel } from "@/app/lib/team";
import { createFullTeamPermissions } from "@/app/lib/team-permissions";
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
  const { roles, currentUser, updateRolePermissions } = useTeam();
  const [selectedRoleId, setSelectedRoleId] = useState(roleId ?? roles[0]?.id ?? "");
  const canManage = canManageTeamSettings(
    currentUser,
    roles,
    isAdmin,
    "team.permissions.manage",
  );
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;
  const isOwnerRole = selectedRole?.slug === OWNER_TEAM_ROLE;
  const permissions = isOwnerRole
    ? createFullTeamPermissions(true)
    : selectedRole?.permissions ?? null;

  useEffect(() => {
    if (!open) return;
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

  function persistAction(
    updates: Partial<
      Record<keyof NonNullable<typeof permissions>["actions"], boolean>
    >,
  ) {
    if (!selectedRole || isOwnerRole || !permissions) return;
    updateRolePermissions(selectedRole.id, {
      ...permissions,
      actions: { ...permissions.actions, ...updates },
    });
  }

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
      overlayZIndex={80}
      panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
    >
      <div className="space-y-4">
        {permissions && selectedRole ? (
          <fieldset
            disabled={!canManage || isOwnerRole}
            className="space-y-4 disabled:opacity-80"
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
              value={permissions}
              disabled={!canManage || isOwnerRole}
              onActionChange={persistAction}
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
      </div>
    </AppModal>
  );
}
