"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createAdminUserAction,
  deleteAdminUserAction,
  updateAdminUserAction,
} from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { AdminTeamMembersModal } from "@/app/components/admin-team-members-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { Tooltip } from "@/app/components/tooltip";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { MemberLastOnline } from "@/app/components/member-last-online";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTeam } from "@/app/lib/team-store";
import { initialsFromName, teamRankLabel } from "@/app/lib/team";
import type { AdminTeamMembersTarget, AdminUserSummary } from "@/app/lib/site-admin/types";

type UserDraft = {
  name: string;
  email: string;
  isAdmin: boolean;
};

function emptyDraft(): UserDraft {
  return { name: "", email: "", isAdmin: false };
}

function draftFromUser(user: AdminUserSummary): UserDraft {
  return { name: user.name, email: user.email, isAdmin: user.isAdmin };
}

export function AdminUsersManager({
  users,
  currentUserId,
}: {
  users: AdminUserSummary[];
  currentUserId: string;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const { currentUser } = useTeam();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserSummary | null>(null);
  const [membersTeam, setMembersTeam] = useState<AdminTeamMembersTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  const initialDraft = editingId
    ? draftFromUser(users.find((user) => user.id === editingId) ?? {
        id: "",
        name: "",
        email: "",
        avatar: "",
        isAdmin: false,
        registeredAt: null,
        lastSeenAt: null,
        languageCode: null,
        teams: [],
      })
    : emptyDraft();
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  const adminCount = users.filter((user) => user.isAdmin).length;

  useEffect(() => {
    if (!modalOpen) {
      setEditingId(null);
      setDraft(emptyDraft());
    }
  }, [modalOpen]);

  function openCreate() {
    clearFeedback();
    setEditingId(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  }

  function openEdit(user: AdminUserSummary) {
    clearFeedback();
    setEditingId(user.id);
    setDraft(draftFromUser(user));
    setModalOpen(true);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    startTransition(async () => {
      const result = editingId
        ? await updateAdminUserAction(editingId, draft)
        : await createAdminUserAction(draft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingId
          ? t("admin.users.feedback.saved", "Lietotājs saglabāts.")
          : t("admin.users.feedback.created", "Lietotājs pievienots."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteAdminUserAction(deleteTarget.id);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("admin.users.feedback.deleted", "Lietotājs dzēsts."),
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
          {t("admin.users.create", "Jauns lietotājs")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">{t("common.name", "Vārds")}</th>
                <th className="px-5 py-3">{t("admin.users.registered", "Reģistrējies")}</th>
                <th className="px-5 py-3">{t("nav.team", "Komanda")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const lastAdmin = user.isAdmin && adminCount <= 1;
                const deleteDisabled = isSelf || lastAdmin;
                const registered = user.registeredAt
                  ? formatDate(user.registeredAt)
                  : "";
                const lastOnlineAt =
                  user.id === currentUserId
                    ? currentUser.lastOnlineAt ?? user.lastSeenAt
                    : user.lastSeenAt;
                return (
                  <tr key={user.id}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          member={{
                            id: user.id,
                            name: user.name,
                            initials: initialsFromName(user.name),
                            role: "",
                            roleId: null,
                            email: user.email,
                            toneClassName: "bg-zinc-100 text-zinc-700",
                            lastOnlineAt,
                            avatarUrl: user.avatar || null,
                          }}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 font-semibold text-zinc-900">
                            {user.isAdmin ? (
                              <Tooltip
                                label={t("roles.system_admin", "Sistēmas administrators")}
                              >
                                <span
                                  tabIndex={0}
                                  className="inline-flex text-amber-500"
                                  aria-label={t(
                                    "roles.system_admin",
                                    "Sistēmas administrators",
                                  )}
                                >
                                  <i className="fas fa-crown text-[11px]" aria-hidden="true" />
                                </span>
                              </Tooltip>
                            ) : null}
                            <span className="truncate">{user.name}</span>
                          </p>
                          <p className="truncate text-sm text-zinc-500">{user.email}</p>
                          {user.languageCode ? (
                            <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-zinc-400">
                              {user.languageCode}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-zinc-800">{registered || "—"}</p>
                      <p className="mt-0.5 flex min-h-[1rem] items-center text-sm text-zinc-500">
                        {lastOnlineAt ? (
                          <MemberLastOnline lastOnlineAt={lastOnlineAt} />
                        ) : (
                          t("admin.users.last_seen_never", "Vēl nav ienācis")
                        )}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {user.teams.length > 0 ? (
                        <div className="flex flex-col gap-2.5">
                          {user.teams.map((team) => {
                            const roleLabel = teamRankLabel(team.role, t);
                            return (
                              <button
                                key={`${team.id}-${team.role}`}
                                type="button"
                                onClick={() =>
                                  setMembersTeam({
                                    id: team.id,
                                    name: team.name,
                                    logoUrl: team.logoUrl,
                                  })
                                }
                                className="-mx-2 flex w-full items-center gap-2.5 rounded-lg px-2 py-1 text-left transition hover:bg-zinc-50"
                              >
                                {team.logoUrl ? (
                                  <img
                                    src={team.logoUrl}
                                    alt=""
                                    className="size-7 shrink-0 rounded-md object-cover"
                                  />
                                ) : null}
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-zinc-900">
                                    {team.name}
                                  </p>
                                  {roleLabel ? (
                                    <p className="truncate text-sm text-zinc-500">
                                      {roleLabel}
                                    </p>
                                  ) : null}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-zinc-500">
                          {t("admin.users.no_team", "Nav komandā")}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <IconActionButton
                          label={t("actions.edit", "Labot")}
                          icon="fas fa-pen"
                          onClick={() => openEdit(user)}
                        />
                        <IconActionButton
                          label={
                            isSelf
                              ? t("admin.users.delete.self_disabled", "Nevar dzēst savu kontu")
                              : lastAdmin
                                ? t(
                                    "admin.users.delete.last_admin_disabled",
                                    "Pēdējo administratoru nevar dzēst",
                                  )
                                : t("actions.delete", "Dzēst")
                          }
                          icon="fas fa-trash"
                          variant="delete"
                          disabled={deleteDisabled}
                          onClick={() => {
                            if (!deleteDisabled) setDeleteTarget(user);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-zinc-500">
                    {t("admin.users.empty", "Nav neviena lietotāja.")}
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

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingId
            ? t("actions.edit", "Labot")
            : t("admin.users.create", "Jauns lietotājs")
        }
        description={
          editingId
            ? undefined
            : t(
                "admin.users.help.password",
                "Lietotājs var iestatīt paroli ar Aizmirsi paroli.",
              )
        }
        blocking={isPending}
        dirty={isDirty}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
            <div>
              <label htmlFor="admin-user-name" className="text-sm font-medium text-zinc-800">
                {t("common.name", "Vārds")}
              </label>
              <input
                id="admin-user-name"
                value={draft.name}
                onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="admin-user-email" className="text-sm font-medium text-zinc-800">
                {t("common.email", "E-pasts")}
              </label>
              <input
                id="admin-user-email"
                type="email"
                value={draft.email}
                onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700">
              {t("roles.admin", "Administrators")}
              <ToggleSwitch
                checked={draft.isAdmin}
                disabled={isPending}
                label={t("roles.admin", "Administrators")}
                onChange={(isAdmin) => setDraft((current) => ({ ...current, isAdmin }))}
              />
            </label>
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
        title={t("admin.users.delete.title", "Dzēst lietotāju?")}
        description={
          <>
            {t("admin.users.delete.confirm_prefix", "Vai tiešām dzēst lietotāju")}{" "}
            <span className="font-semibold text-zinc-900">{deleteTarget?.name}</span>?
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
