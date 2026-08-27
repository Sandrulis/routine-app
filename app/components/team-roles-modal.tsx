"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { IconActionButton } from "@/app/components/icon-action-button";
import { TeamRoleAccessModal } from "@/app/components/team-role-access-modal";
import { UserAvatar } from "@/app/components/user-avatar";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  MEMBER_TEAM_ROLE,
  OWNER_TEAM_ROLE,
  canManageTeamSettings,
  isMemberTeamOwner,
  teamRankLabel,
  type TeamRole,
} from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

type RolesDraft = {
  roleNames: Record<string, string>;
  memberRoleIds: Record<string, string>;
  newRoleName: string;
};

function snapshotFrom(
  roles: TeamRole[],
  members: { id: string; roleId: string | null; role: string }[],
): RolesDraft {
  const memberFallback =
    roles.find((role) => role.slug === MEMBER_TEAM_ROLE)?.id ?? roles[0]?.id ?? "";
  return {
    roleNames: Object.fromEntries(roles.map((role) => [role.id, role.name])),
    memberRoleIds: Object.fromEntries(
      members.map((member) => [
        member.id,
        member.roleId ??
          roles.find((role) => role.slug === member.role)?.id ??
          memberFallback,
      ]),
    ),
    newRoleName: "",
  };
}

export function TeamRolesModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { isAdmin } = useIsAdmin();
  const { showFeedback } = useFeedbackToast();
  const {
    members,
    roles,
    currentUser,
    addTeamRole,
    reorderTeamRoles,
    renameTeamRole,
    deleteTeamRole,
    assignMemberRole,
  } = useTeam();
  const [draft, setDraft] = useState<RolesDraft>(() =>
    snapshotFrom(roles, members),
  );
  const [deleteRole, setDeleteRole] = useState<TeamRole | null>(null);
  const [accessRoleId, setAccessRoleId] = useState<string | null>(null);
  const [addingRole, setAddingRole] = useState(false);
  const wasOpenRef = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const canManage = canManageTeamSettings(currentUser, roles, isAdmin);

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setAccessRoleId(null);
      return;
    }
    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setDraft(snapshotFrom(roles, members));
      return;
    }
    setDraft((current) => {
      const next = snapshotFrom(roles, members);
      return {
        ...next,
        roleNames: { ...next.roleNames, ...current.roleNames },
        memberRoleIds: { ...next.memberRoleIds, ...current.memberRoleIds },
        newRoleName: current.newRoleName,
      };
    });
  }, [members, open, roles]);

  const initial = useMemo(() => snapshotFrom(roles, members), [members, roles]);
  const isDirty =
    JSON.stringify({
      roleNames: draft.roleNames,
      memberRoleIds: draft.memberRoleIds,
      newRoleName: draft.newRoleName.trim(),
    }) !==
    JSON.stringify({
      roleNames: initial.roleNames,
      memberRoleIds: initial.memberRoleIds,
      newRoleName: "",
    });

  function roleLabel(role: TeamRole) {
    return teamRankLabel(role.slug, t, roles) ?? role.name;
  }

  async function handleAddRole(options?: { silent?: boolean }) {
    if (!canManage || addingRole) return false;
    const newName = draft.newRoleName.trim();
    if (!newName) {
      showFeedback({
        type: "error",
        text: t("errors.name_required", "Ievadi nosaukumu."),
      });
      return false;
    }

    setAddingRole(true);
    try {
      const created = await addTeamRole(newName);
      if (!created) {
        showFeedback({
          type: "error",
          text: t("errors.role_create_failed", "Neizdevās pievienot lomu."),
        });
        return false;
      }

      setDraft((current) => ({ ...current, newRoleName: "" }));
      if (!options?.silent) {
        showFeedback({
          type: "success",
          text: t("team.roles.feedback.created", "Loma pievienota."),
        });
      }
      return true;
    } finally {
      setAddingRole(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canManage) return;

    if (draft.newRoleName.trim()) {
      const created = await handleAddRole({ silent: true });
      if (!created) return;
    }

    for (const role of roles) {
      if (role.isSystem) continue;
      const nextName = draft.roleNames[role.id]?.trim();
      if (nextName && nextName !== role.name) {
        renameTeamRole(role.id, nextName);
      }
    }

    for (const member of members) {
      if (isMemberTeamOwner(member, roles)) continue;
      const nextRoleId = draft.memberRoleIds[member.id];
      const nextRole = roles.find((role) => role.id === nextRoleId);
      if (nextRole?.slug === OWNER_TEAM_ROLE) continue;
      if (nextRoleId && nextRoleId !== member.roleId) {
        assignMemberRole(member.id, nextRoleId);
      }
    }

    showFeedback({
      type: "success",
      text: t("team.roles.feedback.saved", "Komandas lomas saglabātas."),
    });
    onOpenChange(false);
  }

  function handleDragEnd(event: DragEndEvent) {
    if (!canManage) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = roles.findIndex((role) => role.id === active.id);
    const newIndex = roles.findIndex((role) => role.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(roles, oldIndex, newIndex);
    void reorderTeamRoles(next.map((role) => role.id)).then((ok) => {
      if (ok) return;
      showFeedback({
        type: "error",
        text: t("errors.role_reorder_failed", "Neizdevās mainīt lomu secību."),
      });
    });
  }

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        title={t("team.roles.title", "Komandas lomas")}
        description={t(
          "team.roles.description",
          "Izveido lomas un sadali komandas lietotājus pa tām.",
        )}
        dirty={isDirty}
        panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleSave} className="space-y-6">
          <fieldset disabled={!canManage} className="space-y-6 disabled:opacity-80">
            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                {t("team.roles.list", "Lomas")}
              </h3>
              {canManage ? (
                <p className="text-[13px] text-zinc-500">
                  {t(
                    "team.roles.reorder_hint",
                    "Velc lomas, lai mainītu prioritāti. Augstākā ir pirmā.",
                  )}
                </p>
              ) : null}
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <table className="min-w-full text-sm">
                    <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      <tr>
                        <th className="w-10 px-2 py-2.5" />
                        <th className="px-4 py-2.5">{t("lists.fields.name", "Nosaukums")}</th>
                        <th className="px-4 py-2.5 text-right">
                          {t("common.actions", "Darbības")}
                        </th>
                      </tr>
                    </thead>
                    <SortableContext
                      items={roles.map((role) => role.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <tbody className="divide-y divide-zinc-100">
                        {roles.map((role) => (
                          <SortableRoleRow
                            key={role.id}
                            role={role}
                            name={draft.roleNames[role.id] ?? role.name}
                            canManage={canManage}
                            dragLabel={t("subtasks.drag", "Mainīt secību")}
                            label={roleLabel(role)}
                            onNameChange={(value) =>
                              setDraft((current) => ({
                                ...current,
                                roleNames: {
                                  ...current.roleNames,
                                  [role.id]: value,
                                },
                              }))
                            }
                            onDelete={() => setDeleteRole(role)}
                            onOpenAccess={() => setAccessRoleId(role.id)}
                            accessLabel={t(
                              "team.roles.access_tooltip",
                              "Pieejas pašai lomai",
                            )}
                            deleteLabel={
                              role.isSystem
                                ? t(
                                    "team.roles.delete.system_disabled",
                                    "Sistēmas lomu nevar dzēst",
                                  )
                                : t("actions.delete", "Dzēst")
                            }
                          />
                        ))}
                      </tbody>
                    </SortableContext>
                  </table>
                </DndContext>
              </div>
              <div className="flex gap-2">
                <input
                  value={draft.newRoleName}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      newRoleName: event.target.value,
                    }))
                  }
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") return;
                    event.preventDefault();
                    void handleAddRole();
                  }}
                  placeholder={t("team.roles.new_placeholder", "Jaunas lomas nosaukums")}
                  className="min-h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                />
                <button
                  type="button"
                  disabled={!canManage || addingRole || !draft.newRoleName.trim()}
                  onClick={() => void handleAddRole()}
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingRole ? (
                    <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                  ) : (
                    <i className="fas fa-plus text-xs" aria-hidden="true" />
                  )}
                  {t("actions.add", "Pievienot")}
                </button>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-zinc-800">
                {t("nav.team", "Komanda")}
              </h3>
              <div className="overflow-hidden rounded-xl border border-zinc-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                    <tr>
                      <th className="px-4 py-2.5">{t("common.name", "Vārds")}</th>
                      <th className="px-4 py-2.5">{t("team.fields.role", "Loma")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {members.map((member) => {
                      const memberIsOwner = isMemberTeamOwner(member, roles);
                      const assignableRoles = memberIsOwner
                        ? roles.filter((role) => role.slug === OWNER_TEAM_ROLE)
                        : roles.filter((role) => role.slug !== OWNER_TEAM_ROLE);
                      return (
                      <tr key={member.id}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <UserAvatar member={member} size="xs" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-zinc-900">
                                {member.name}
                              </p>
                              {member.email ? (
                                <p className="truncate text-[12px] text-zinc-400">
                                  {member.email}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <select
                            value={draft.memberRoleIds[member.id] ?? ""}
                            disabled={memberIsOwner}
                            onChange={(event) =>
                              setDraft((current) => ({
                                ...current,
                                memberRoleIds: {
                                  ...current.memberRoleIds,
                                  [member.id]: event.target.value,
                                },
                              }))
                            }
                            className="w-full cursor-pointer rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500"
                          >
                            {assignableRoles.map((role) => (
                              <option key={role.id} value={role.id}>
                                {roleLabel(role)}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[13px] text-zinc-500">
                {t(
                  "team.roles.leader_transfer_hint",
                  "Komandas vadītāju ieceļ komandas lietotāja lapā. Šeit vadītāja lomu nevar piešķirt.",
                )}
              </p>
            </section>
          </fieldset>

          {!canManage ? (
            <p className="text-sm text-zinc-500">
              {t(
                "team.roles.owner_only",
                "Lomas var mainīt tikai komandas īpašnieks.",
              )}
            </p>
          ) : null}

          <div className="flex justify-end border-t border-zinc-100 pt-4">
            <button
              type="submit"
              disabled={!canManage || !isDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.save", "Saglabāt")}
            </button>
          </div>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteRole !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDeleteRole(null);
        }}
        title={t("team.roles.delete.title", "Dzēst lomu?")}
        description={t(
          "team.roles.delete.description",
          "Loma “{name}” tiks dzēsta. Lietotāji tiks pārcelti uz lomu Lietotājs.",
          { name: deleteRole ? roleLabel(deleteRole) : "" },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          if (!deleteRole) return;
          deleteTeamRole(deleteRole.id);
          setDeleteRole(null);
          showFeedback({
            type: "success",
            text: t("team.roles.feedback.deleted", "Loma dzēsta."),
          });
        }}
      />
      <TeamRoleAccessModal
        open={accessRoleId !== null}
        roleId={accessRoleId}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setAccessRoleId(null);
        }}
      />
    </>
  );
}

function SortableRoleRow({
  role,
  name,
  canManage,
  dragLabel,
  label,
  onNameChange,
  onDelete,
  onOpenAccess,
  accessLabel,
  deleteLabel,
}: {
  role: TeamRole;
  name: string;
  canManage: boolean;
  dragLabel: string;
  label: string;
  onNameChange: (value: string) => void;
  onDelete: () => void;
  onOpenAccess: () => void;
  accessLabel: string;
  deleteLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id, disabled: !canManage });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={isDragging ? "relative z-10 bg-white shadow-sm" : ""}
    >
      <td className="px-2 py-2.5">
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      </td>
      <td className="px-4 py-2.5">
        {role.isSystem ? (
          <p className="font-medium text-zinc-900">{label}</p>
        ) : (
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
        )}
      </td>
      <td
        className="px-4 py-2.5"
        onPointerDown={(event) => event.stopPropagation()}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end gap-1">
          <IconActionButton
            label={accessLabel}
            icon="fas fa-list-ul"
            disabled={!canManage}
            onClick={onOpenAccess}
          />
          <IconActionButton
            label={deleteLabel}
            icon="fas fa-trash"
            variant="delete"
            disabled={role.isSystem || !canManage}
            onClick={onDelete}
          />
        </div>
      </td>
    </tr>
  );
}
