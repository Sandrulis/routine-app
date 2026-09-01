"use client";

import { useEffect, useState, useTransition } from "react";
import {
  createSiteAnnouncementAction,
  deleteSiteAnnouncementAction,
  updateSiteAnnouncementAction,
  updateSiteAnnouncementEnabledAction,
} from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import type {
  SiteAnnouncementInput,
  SiteAnnouncementSummary,
} from "@/app/lib/announcements/types";
import { todayIsoDate } from "@/app/lib/format-display-date";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  resolveLocalizedValue,
  type LocalizedValues,
} from "@/app/lib/i18n/localized-values";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/types";

const fieldBaseClassName =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const fieldClassName = `mt-1.5 ${fieldBaseClassName}`;

type Draft = {
  titleValues: LocalizedValues;
  bodyValues: LocalizedValues;
  expiresAt: string;
  isEnabled: boolean;
};

function emptyValues(languages: SiteLanguageSummary[]): LocalizedValues {
  return Object.fromEntries(languages.map((language) => [language.code, ""]));
}

function mergeValues(
  languages: SiteLanguageSummary[],
  values: LocalizedValues,
): LocalizedValues {
  return {
    ...emptyValues(languages),
    ...values,
  };
}

function emptyDraft(languages: SiteLanguageSummary[]): Draft {
  return {
    titleValues: emptyValues(languages),
    bodyValues: emptyValues(languages),
    expiresAt: "",
    isEnabled: true,
  };
}

function draftFromAnnouncement(
  announcement: SiteAnnouncementSummary,
  languages: SiteLanguageSummary[],
): Draft {
  return {
    titleValues: mergeValues(languages, announcement.titleValues),
    bodyValues: mergeValues(languages, announcement.bodyValues),
    expiresAt: announcement.expiresAt,
    isEnabled: announcement.isEnabled,
  };
}

function draftsEqual(left: Draft, right: Draft): boolean {
  const titleKeys = new Set([
    ...Object.keys(left.titleValues),
    ...Object.keys(right.titleValues),
  ]);
  for (const code of titleKeys) {
    if ((left.titleValues[code] ?? "") !== (right.titleValues[code] ?? "")) {
      return false;
    }
  }

  const bodyKeys = new Set([
    ...Object.keys(left.bodyValues),
    ...Object.keys(right.bodyValues),
  ]);
  for (const code of bodyKeys) {
    if ((left.bodyValues[code] ?? "") !== (right.bodyValues[code] ?? "")) {
      return false;
    }
  }

  return left.expiresAt === right.expiresAt && left.isEnabled === right.isEnabled;
}

function toInput(draft: Draft): SiteAnnouncementInput {
  return {
    titleValues: draft.titleValues,
    bodyValues: draft.bodyValues,
    expiresAt: draft.expiresAt,
    isEnabled: draft.isEnabled,
  };
}

export function AdminAnnouncementsManager({
  announcements: initialAnnouncements,
  languages,
}: {
  announcements: SiteAnnouncementSummary[];
  languages: SiteLanguageSummary[];
}) {
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t, languageCode } = useTranslations();
  const { formatDate } = useDisplayPreferences();
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SiteAnnouncementSummary | null>(null);
  const [draft, setDraft] = useState(() => emptyDraft(languages));
  const [savedDraft, setSavedDraft] = useState(() => emptyDraft(languages));
  const [editLang, setEditLang] = useState(
    languages.find((language) => language.isDefault)?.code ??
      languages[0]?.code ??
      "lv",
  );
  const [deleteTarget, setDeleteTarget] = useState<SiteAnnouncementSummary | null>(
    null,
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;
  const dirty = !draftsEqual(draft, savedDraft);
  const today = todayIsoDate();

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  function closeEditor() {
    setEditorOpen(false);
    setEditing(null);
    const empty = emptyDraft(languages);
    setDraft(empty);
    setSavedDraft(empty);
  }

  function openCreate() {
    clearFeedback();
    const next = emptyDraft(languages);
    setEditing(null);
    setDraft(next);
    setSavedDraft(next);
    setEditLang(
      languages.find((language) => language.isDefault)?.code ??
        languages[0]?.code ??
        "lv",
    );
    setEditorOpen(true);
  }

  function openEdit(announcement: SiteAnnouncementSummary) {
    clearFeedback();
    const next = draftFromAnnouncement(announcement, languages);
    setEditing(announcement);
    setDraft(next);
    setSavedDraft(next);
    setEditLang(
      languages.find((language) => language.isDefault)?.code ??
        languages[0]?.code ??
        "lv",
    );
    setEditorOpen(true);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!Object.values(draft.titleValues).some((value) => value.trim())) {
      showFeedback({
        type: "error",
        text: t(
          "site_announcements.validation.title_required",
          "Ievadi paziņojuma virsrakstu vismaz vienā valodā.",
        ),
      });
      return;
    }

    if (!draft.expiresAt.trim()) {
      showFeedback({
        type: "error",
        text: t(
          "site_announcements.validation.expires_required",
          "Norādi paziņojuma termiņu.",
        ),
      });
      return;
    }

    const editingId = editing?.id ?? null;

    startTransition(async () => {
      setPendingKey(editingId ? `save:${editingId}` : "create");
      const result = editingId
        ? await updateSiteAnnouncementAction(editingId, toInput(draft))
        : await createSiteAnnouncementAction(toInput(draft));

      if (!result.ok) {
        setPendingKey(null);
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setAnnouncements((current) => {
        if (editingId) {
          return current.map((item) =>
            item.id === editingId ? result.data : item,
          );
        }
        return [result.data, ...current];
      });
      setPendingKey(null);
      closeEditor();
      showFeedback({
        type: "success",
        text: editingId
          ? t("site_announcements.feedback.saved", "Paziņojums saglabāts.")
          : t("site_announcements.feedback.created", "Paziņojums pievienots."),
      });
    });
  }

  function handleEnabledToggle(
    announcement: SiteAnnouncementSummary,
    nextEnabled: boolean,
  ) {
    clearFeedback();

    const previous = announcements;
    setAnnouncements((current) =>
      current.map((item) =>
        item.id === announcement.id ? { ...item, isEnabled: nextEnabled } : item,
      ),
    );

    startTransition(async () => {
      setPendingKey(`enabled:${announcement.id}`);
      const result = await updateSiteAnnouncementEnabledAction(
        announcement.id,
        nextEnabled,
      );

      if (!result.ok) {
        setAnnouncements(previous);
        setPendingKey(null);
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setAnnouncements((current) =>
        current.map((item) =>
          item.id === announcement.id ? result.data : item,
        ),
      );
      setPendingKey(null);
      showFeedback({
        type: "success",
        text: t(
          "site_announcements.feedback.status_saved",
          "Paziņojuma statuss saglabāts.",
        ),
      });
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    const deletedId = deleteTarget.id;

    startTransition(async () => {
      setPendingKey(`delete:${deletedId}`);
      const result = await deleteSiteAnnouncementAction(deletedId);

      if (!result.ok) {
        setPendingKey(null);
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      setAnnouncements((current) =>
        current.filter((item) => item.id !== deletedId),
      );
      setDeleteTarget(null);
      setPendingKey(null);
      showFeedback({
        type: "success",
        text: t("site_announcements.feedback.deleted", "Paziņojums dzēsts."),
      });
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {t("site_announcements.list.title", "Paziņojumi")}
          </h2>
          <button
            type="button"
            onClick={openCreate}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <i className="fas fa-plus text-xs" aria-hidden="true" />
            {t("actions.add", "Pievienot")}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">
                  {t("site_announcements.table.title", "Virsraksts")}
                </th>
                <th className="px-5 py-3">
                  {t("site_announcements.table.expires", "Termiņš")}
                </th>
                <th className="px-5 py-3 text-right">
                  {t("common.actions", "Darbības")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {announcements.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-8 text-center text-sm text-zinc-500"
                  >
                    {t("site_announcements.table.empty", "Nav paziņojumu.")}
                  </td>
                </tr>
              ) : (
                announcements.map((announcement) => {
                  const title =
                    resolveLocalizedValue(
                      announcement.titleValues,
                      languageCode,
                    ) || t("site_announcements.form.title", "Virsraksts");
                  const expired = announcement.expiresAt < today;
                  const isRowBusy =
                    pendingKey === `enabled:${announcement.id}` ||
                    pendingKey === `delete:${announcement.id}` ||
                    pendingKey === `save:${announcement.id}`;

                  return (
                    <tr key={announcement.id}>
                      <td className="px-5 py-4">
                        <p className="font-medium text-zinc-900">{title}</p>
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        <span className="tabular-nums">
                          {formatDate(announcement.expiresAt)}
                        </span>
                        {expired ? (
                          <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                            {t("site_announcements.status.expired", "Beidzies")}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-3">
                          <ToggleSwitch
                            checked={announcement.isEnabled}
                            disabled={isBusy && !isRowBusy}
                            busy={isRowBusy && pendingKey === `enabled:${announcement.id}`}
                            label={t(
                              "site_announcements.aria.enabled",
                              "{title} ieslēgts",
                              { title },
                            )}
                            onChange={(nextEnabled) =>
                              handleEnabledToggle(announcement, nextEnabled)
                            }
                          />
                          <IconActionButton
                            label={t("actions.edit", "Labot")}
                            icon="fas fa-pen"
                            disabled={isRowBusy || isBusy}
                            onClick={() => openEdit(announcement)}
                          />
                          <IconActionButton
                            label={t("actions.delete", "Dzēst")}
                            icon="fas fa-trash"
                            variant="delete"
                            disabled={isRowBusy || isBusy}
                            onClick={() => setDeleteTarget(announcement)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        open={editorOpen}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
        title={
          editing
            ? t("site_announcements.form.edit_title", "Labot paziņojumu")
            : t("site_announcements.form.create_title", "Jauns paziņojums")
        }
        dirty={dirty}
        blocking={isBusy}
        panelMaxWidthClassName="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {languages.length > 1 ? (
            <div
              role="tablist"
              aria-label={t("admin.nav.languages", "Valodas")}
              className="flex flex-wrap gap-2"
            >
              {languages.map((language) => {
                const active = language.code === editLang;
                return (
                  <button
                    key={language.code}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setEditLang(language.code)}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                    }`}
                  >
                    <span>{language.name}</span>
                    <span
                      className={`font-mono text-[11px] uppercase ${
                        active ? "text-zinc-300" : "text-zinc-400"
                      }`}
                    >
                      {language.code}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_announcements.form.title", "Virsraksts")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </span>
            <input
              type="text"
              value={draft.titleValues[editLang] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  titleValues: {
                    ...current.titleValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              className={fieldClassName}
              disabled={isBusy}
              maxLength={200}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_announcements.form.body", "Teksts")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </span>
            <textarea
              value={draft.bodyValues[editLang] ?? ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  bodyValues: {
                    ...current.bodyValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              rows={5}
              className={`${fieldClassName} resize-y`}
              disabled={isBusy}
              maxLength={4000}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">
              {t("site_announcements.form.expires", "Termiņš")}
            </span>
            <input
              type="date"
              value={draft.expiresAt}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  expiresAt: event.target.value,
                }))
              }
              className={fieldClassName}
              disabled={isBusy}
            />
            <span className="mt-1 block text-xs text-zinc-500">
              {t(
                "site_announcements.form.expires_hint",
                "Pēc šī datuma paziņojums lietotājiem vairs nerādās.",
              )}
            </span>
          </label>

          <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-800">
                {t("site_announcements.form.enabled", "Rādīt lietotājiem")}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t(
                  "site_announcements.form.enabled_hint",
                  "Kad ieslēgts un termiņš nav beidzies, paziņojuma bloks rādās visiem lietotājiem.",
                )}
              </p>
            </div>
            <ToggleSwitch
              checked={draft.isEnabled}
              disabled={isBusy}
              label={t("site_announcements.form.enabled", "Rādīt lietotājiem")}
              onChange={(nextEnabled) =>
                setDraft((current) => ({ ...current, isEnabled: nextEnabled }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
            <button
              type="button"
              onClick={closeEditor}
              disabled={isBusy}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("actions.cancel", "Atcelt")}
            </button>
            <button
              type="submit"
              disabled={isBusy || !dirty}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey === "create" || pendingKey?.startsWith("save:") ? (
                <span className="inline-flex items-center gap-2">
                  <i
                    className="fas fa-circle-notch fa-spin text-xs"
                    aria-hidden="true"
                  />
                  {t("actions.save", "Saglabāt")}
                </span>
              ) : (
                t("actions.save", "Saglabāt")
              )}
            </button>
          </div>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t(
          "site_announcements.delete.confirm_title",
          "Dzēst paziņojumu?",
        )}
        description={t(
          "site_announcements.delete.confirm_description",
          "Paziņojums tiks neatgriezeniski dzēsts.",
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        blocking={pendingKey?.startsWith("delete:") === true}
        onConfirm={handleDelete}
      />
    </div>
  );
}
