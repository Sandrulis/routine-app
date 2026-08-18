"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminTeamAction,
  deleteAdminTeamAction,
  updateAdminTeamAction,
} from "@/app/(app)/admin/actions";
import { AdminTeamMembersModal } from "@/app/components/admin-team-members-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ListBadge } from "@/app/components/list-badge";
import { NameFormModal } from "@/app/components/name-form-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type { AdminTeamMembersTarget, AdminTeamSummary } from "@/app/lib/site-admin/types";

export function AdminTeamsManager({ teams }: { teams: AdminTeamSummary[] }) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<AdminTeamSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminTeamSummary | null>(null);
  const [membersTeam, setMembersTeam] = useState<AdminTeamMembersTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    clearFeedback();
    setEditingTeam(null);
    setModalOpen(true);
  }

  function openEdit(team: AdminTeamSummary) {
    clearFeedback();
    setEditingTeam(team);
    setModalOpen(true);
  }

  function openMembers(team: AdminTeamSummary) {
    setMembersTeam({
      id: team.id,
      name: team.name,
      icon: team.icon,
      color: team.color,
      logoUrl: team.logoUrl,
    });
  }

  function handleSave(input: {
    name: string;
    icon?: string | null;
    color?: string;
    logoUrl?: string | null;
  }) {
    startTransition(async () => {
      const result = editingTeam
        ? await updateAdminTeamAction(editingTeam.id, input)
        : await createAdminTeamAction(input);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      showFeedback({
        type: "success",
        text: editingTeam
          ? t("teams.updated", "Komanda saglabāta.")
          : t("teams.created", "Komanda pievienota."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteAdminTeamAction(deleteTarget.id);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("teams.deleted", "Komanda dzēsta."),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("teams.add.title", "Jauna komanda")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">{t("lists.fields.name", "Nosaukums")}</th>
                <th className="px-5 py-3">{t("admin.teams.members", "Biedri")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {teams.map((team) => (
                <tr
                  key={team.id}
                  className="cursor-pointer transition hover:bg-zinc-50"
                  onClick={() => openMembers(team)}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <ListBadge
                        name={team.name}
                        icon={team.icon}
                        color={team.color}
                        logoUrl={team.logoUrl}
                      />
                      <p className="font-semibold text-zinc-900">{team.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{team.memberCount}</td>
                  <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        label={t("actions.edit", "Labot")}
                        icon="fas fa-pen"
                        onClick={() => openEdit(team)}
                      />
                      <IconActionButton
                        label={t("actions.delete", "Dzēst")}
                        icon="fas fa-trash"
                        variant="delete"
                        onClick={() => setDeleteTarget(team)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {teams.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-zinc-500">
                    {t("admin.teams.empty", "Nav nevienas komandas.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AdminTeamMembersModal
        open={membersTeam !== null}
        onOpenChange={(open) => {
          if (!open) setMembersTeam(null);
        }}
        team={membersTeam}
      />

      <NameFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingTeam
            ? t("actions.edit", "Labot")
            : t("teams.add.title", "Jauna komanda")
        }
        description={t(
          "admin.teams.form.description",
          "Norādi komandas nosaukumu un izskatu.",
        )}
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={t("teams.fields.name_placeholder", "Piemēram, Studio, Klienti")}
        descriptionLabel=""
        descriptionPlaceholder=""
        submitLabel={t("actions.save", "Saglabāt")}
        showAppearance
        showDescription={false}
        showLogo
        blocking={isPending}
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
        onCreate={handleSave}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("teams.delete.title", "Dzēst komandu?")}
        description={
          <>
            {t("admin.teams.delete.confirm_prefix", "Vai tiešām dzēst komandu")}{" "}
            <span className="font-semibold text-zinc-900">{deleteTarget?.name}</span>
            {t(
              "admin.teams.delete.confirm_suffix",
              "? Tiks dzēsti arī saraksti, uzdevumi un faili.",
            )}
          </>
        }
        confirmLabel={isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
