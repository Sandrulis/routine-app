"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  createSystemDefaultRoleAction,
  deleteSystemDefaultRoleAction,
  reorderSystemDefaultRolesAction,
  updateSystemDefaultRoleAction,
} from "@/app/(app)/admin/actions";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { DragHandle } from "@/app/components/drag-handle";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { TeamPermissionFields } from "@/app/components/team-permission-fields";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { OWNER_TEAM_ROLE } from "@/app/lib/team";
import {
  cloneTeamPermissions,
  createFullTeamPermissions,
  createMemberTeamPermissions,
  type TeamActionPermissionKey,
  type TeamNavPermissionKey,
  type TeamPermissionSet,
} from "@/app/lib/team-permissions";
import type {
  SiteLanguageSummary,
  SystemDefaultRoleSummary,
} from "@/app/lib/site-admin/types";

type RoleDraft = {
  labels: Record<string, string>;
  permissions: TeamPermissionSet;
};

function emptyDraft(languages: SiteLanguageSummary[]): RoleDraft {
  return {
    labels: Object.fromEntries(languages.map((language) => [language.code, ""])),
    permissions: createMemberTeamPermissions(),
  };
}

function draftFromRole(
  role: SystemDefaultRoleSummary,
  languages: SiteLanguageSummary[],
): RoleDraft {
  return {
    labels: Object.fromEntries(
      languages.map((language) => [
        language.code,
        role.labels[language.code] ?? "",
      ]),
    ),
    permissions:
      role.slug === OWNER_TEAM_ROLE
        ? createFullTeamPermissions(true)
        : cloneTeamPermissions(role.permissions),
  };
}

export function AdminRolesManager({
  roles: initialRoles,
  languages,
}: {
  roles: SystemDefaultRoleSummary[];
  languages: SiteLanguageSummary[];
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft(languages));
  const [deleteTarget, setDeleteTarget] = useState<SystemDefaultRoleSummary | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState(initialRoles);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  useEffect(() => {
    setRoles(initialRoles);
  }, [initialRoles]);

  const editingRole = editingId
    ? roles.find((role) => role.id === editingId) ?? null
    : null;
  const isOwnerRole = editingRole?.slug === OWNER_TEAM_ROLE;
  const initialDraft = editingRole
    ? draftFromRole(editingRole, languages)
    : emptyDraft(languages);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    if (!modalOpen) {
      setEditingId(null);
      setDraft(emptyDraft(languages));
    }
  }, [languages, modalOpen]);

  function openCreate() {
    clearFeedback();
    setEditingId(null);
    setDraft(emptyDraft(languages));
    setModalOpen(true);
  }

  function openEdit(role: SystemDefaultRoleSummary) {
    clearFeedback();
    setEditingId(role.id);
    setDraft(draftFromRole(role, languages));
    setModalOpen(true);
  }

  function updateNav(key: TeamNavPermissionKey, enabled: boolean) {
    if (isOwnerRole) return;
    setDraft((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        nav: { ...current.permissions.nav, [key]: enabled },
      },
    }));
  }

  function updateAction(key: TeamActionPermissionKey, enabled: boolean) {
    if (isOwnerRole) return;
    setDraft((current) => ({
      ...current,
      permissions: {
        ...current.permissions,
        actions: { ...current.permissions.actions, [key]: enabled },
      },
    }));
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    startTransition(async () => {
      const payload = {
        labels: draft.labels,
        permissions: isOwnerRole ? createFullTeamPermissions(true) : draft.permissions,
      };
      const result = editingId
        ? await updateSystemDefaultRoleAction(editingId, payload)
        : await createSystemDefaultRoleAction(payload);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingId
          ? t("admin.roles.feedback.saved", "Loma saglabāta.")
          : t("team.roles.feedback.created", "Loma pievienota."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteSystemDefaultRoleAction(deleteTarget.id);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("team.roles.feedback.deleted", "Loma dzēsta."),
      });
      router.refresh();
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || isPending) return;

    const oldIndex = roles.findIndex((role) => role.id === active.id);
    const newIndex = roles.findIndex((role) => role.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(roles, oldIndex, newIndex);
    setRoles(next);

    startTransition(async () => {
      const result = await reorderSystemDefaultRolesAction(next.map((role) => role.id));
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        setRoles(initialRoles);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        {t(
          "admin.roles.inherit_hint",
          "Šīs lomas un pieejas tiek piešķirtas jaunām komandām. Esošās komandas nemainās.",
        )}
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("admin.roles.add", "Jauna loma")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <tr>
                  <th className="w-10 px-3 py-3" />
                  <th className="px-5 py-3">{t("admin.statuses.label", "Nosaukums")}</th>
                  <th className="px-5 py-3">{t("team.access.nav", "Sadaļas")}</th>
                  <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
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
                      languages={languages}
                      dragLabel={t("subtasks.drag", "Mainīt secību")}
                      disabled={isPending}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      t={t}
                    />
                  ))}
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                        {t("admin.roles.empty", "Nav nevienas noklusējuma lomas.")}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </div>

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingId
            ? t("actions.edit", "Labot")
            : t("admin.roles.add", "Jauna loma")
        }
        description={t(
          "admin.roles.form.description",
          "Norādi lomas nosaukumus valodās un pieejas sistēmas sadaļām.",
        )}
        blocking={isPending}
        dirty={isDirty}
        panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <fieldset disabled={isPending} className="space-y-5 disabled:opacity-80">
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.code}>
                  <label
                    htmlFor={`default-role-label-${language.code}`}
                    className="text-sm font-medium text-zinc-800"
                  >
                    {t("admin.statuses.label", "Nosaukums")}{" "}
                    <span className="font-mono text-xs uppercase text-zinc-400">
                      {language.code}
                    </span>
                  </label>
                  <input
                    id={`default-role-label-${language.code}`}
                    value={draft.labels[language.code] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        labels: {
                          ...current.labels,
                          [language.code]: event.target.value,
                        },
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              ))}
            </div>

            {isOwnerRole ? (
              <p className="text-sm text-zinc-500">
                {t(
                  "team.access.owner_locked",
                  "Īpašnieka lomai ir pilna pieeja, un to nevar mainīt.",
                )}
              </p>
            ) : null}

            <TeamPermissionFields
              value={
                isOwnerRole ? createFullTeamPermissions(true) : draft.permissions
              }
              disabled={isOwnerRole}
              onNavChange={updateNav}
              onActionChange={updateAction}
            />

            <div className="flex justify-end border-t border-zinc-100 pt-4">
              <button
                type="submit"
                disabled={isPending || !isDirty}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
                ) : null}
                {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
              </button>
            </div>
          </fieldset>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("team.roles.delete.title", "Dzēst lomu?")}
        description={
          <>
            {t("admin.roles.delete.confirm_prefix", "Vai tiešām dzēst lomu")}{" "}
            <span className="font-semibold text-zinc-900">{deleteTarget?.label}</span>?
          </>
        }
        confirmLabel={isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}

function SortableRoleRow({
  role,
  languages,
  dragLabel,
  disabled,
  onEdit,
  onDelete,
  t,
}: {
  role: SystemDefaultRoleSummary;
  languages: SiteLanguageSummary[];
  dragLabel: string;
  disabled: boolean;
  onEdit: (role: SystemDefaultRoleSummary) => void;
  onDelete: (role: SystemDefaultRoleSummary) => void;
  t: ReturnType<typeof useTranslations>["t"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: role.id, disabled });
  const navCount = Object.values(role.permissions.nav).filter(Boolean).length;
  const navTotal = Object.keys(role.permissions.nav).length;

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`align-top ${isDragging ? "relative z-10 bg-white shadow-sm" : ""}`}
    >
      <td className="px-3 py-4">
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      </td>
      <td className="px-5 py-4">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-900">{role.label}</p>
            {role.isSystem ? (
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                {t("admin.roles.system", "Sistēmas")}
              </span>
            ) : null}
          </div>
          {languages.map((language) => (
            <p key={language.code} className="text-sm text-zinc-600">
              <span className="font-mono text-xs uppercase text-zinc-400">
                {language.code}
              </span>{" "}
              {role.labels[language.code] || "—"}
            </p>
          ))}
        </div>
      </td>
      <td className="px-5 py-4 text-sm text-zinc-600">
        {t("admin.roles.nav_count", "{count} no {total}", {
          count: navCount,
          total: navTotal,
        })}
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <IconActionButton
            label={t("actions.edit", "Labot")}
            icon="fas fa-pen"
            onClick={() => onEdit(role)}
          />
          <IconActionButton
            label={
              role.isSystem
                ? t(
                    "team.roles.delete.system_disabled",
                    "Sistēmas lomu nevar dzēst",
                  )
                : t("actions.delete", "Dzēst")
            }
            icon="fas fa-trash"
            variant="delete"
            disabled={role.isSystem}
            onClick={() => onDelete(role)}
          />
        </div>
      </td>
    </tr>
  );
}
