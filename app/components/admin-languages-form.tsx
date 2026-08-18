"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSiteLanguageAction,
  deleteSiteLanguageAction,
  setDefaultSiteLanguageAction,
  updateSiteLanguageActiveStatusAction,
  updateSiteLanguageNameAction,
} from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { LANGUAGE_OPTIONS } from "@/app/lib/site-admin/language-options";
import type { SiteLanguageSummary } from "@/app/lib/site-admin/types";

export function AdminLanguagesForm({
  initialLanguages,
}: {
  initialLanguages: SiteLanguageSummary[];
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [languages, setLanguages] = useState(initialLanguages);
  const [selectedCode, setSelectedCode] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [editTarget, setEditTarget] = useState<SiteLanguageSummary | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<SiteLanguageSummary | null>(null);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isBusy = isPending || pendingKey !== null;
  const selectedOption = LANGUAGE_OPTIONS.find((option) => option.code === selectedCode);
  const existingCodes = new Set(languages.map((language) => language.code));
  const createOptions = LANGUAGE_OPTIONS.filter((option) => !existingCodes.has(option.code));
  const editDirty = editTarget ? editName.trim() !== editTarget.name : editName.trim().length > 0;

  useEffect(() => {
    setLanguages(initialLanguages);
  }, [initialLanguages]);

  function refreshAfterSuccess(message: string) {
    showFeedback({ type: "success", text: message });
    router.refresh();
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!selectedOption) {
      showFeedback({
        type: "error",
        text: t("site_languages.feedback.select_language", "Izvēlies valodu."),
      });
      return;
    }

    startTransition(async () => {
      setPendingKey("create");
      const result = await createSiteLanguageAction({
        code: selectedOption.code,
        name: selectedOption.name,
        isDefault: makeDefault,
      });

      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setSelectedCode("");
      setMakeDefault(false);
      setPendingKey(null);
      refreshAfterSuccess(t("site_languages.feedback.created", "Valoda pievienota."));
    });
  }

  function handleActiveToggle(language: SiteLanguageSummary, nextActive: boolean) {
    clearFeedback();
    if (!nextActive && language.isDefault) {
      showFeedback({
        type: "error",
        text: t(
          "site_languages.feedback.default_cannot_deactivate",
          "Noklusējuma valodu nevar deaktivizēt.",
        ),
      });
      return;
    }

    const previous = languages;
    setLanguages((current) =>
      current.map((item) =>
        item.code === language.code ? { ...item, isActive: nextActive } : item,
      ),
    );

    startTransition(async () => {
      setPendingKey(`active:${language.code}`);
      const result = await updateSiteLanguageActiveStatusAction(language.code, nextActive);
      if (!result.ok) {
        setLanguages(previous);
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setPendingKey(null);
      refreshAfterSuccess(t("site_languages.feedback.status_saved", "Valodas statuss saglabāts."));
    });
  }

  function handleDefaultToggle(language: SiteLanguageSummary, nextDefault: boolean) {
    clearFeedback();
    if (!nextDefault || language.isDefault) return;

    const previous = languages;
    setLanguages((current) =>
      current.map((item) => ({
        ...item,
        isDefault: item.code === language.code,
        isActive: item.code === language.code ? true : item.isActive,
      })),
    );

    startTransition(async () => {
      setPendingKey(`default:${language.code}`);
      const result = await setDefaultSiteLanguageAction(language.code);
      if (!result.ok) {
        setLanguages(previous);
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setPendingKey(null);
      refreshAfterSuccess(
        t("site_languages.feedback.default_saved", "Noklusējuma valoda saglabāta."),
      );
    });
  }

  function handleEditSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editTarget) return;

    startTransition(async () => {
      setPendingKey(`edit:${editTarget.code}`);
      const result = await updateSiteLanguageNameAction(editTarget.code, editName);
      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setEditTarget(null);
      setPendingKey(null);
      refreshAfterSuccess(t("site_languages.feedback.saved", "Valoda saglabāta."));
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      setPendingKey(`delete:${deleteTarget.code}`);
      const result = await deleteSiteLanguageAction(deleteTarget.code);
      if (!result.ok) {
        setPendingKey(null);
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setDeleteTarget(null);
      setPendingKey(null);
      refreshAfterSuccess(t("site_languages.feedback.deleted", "Valoda dzēsta."));
    });
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleCreate}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="text-base font-semibold text-zinc-900">
          {t("site_languages.create.title", "Jauna valoda")}
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          {t(
            "site_languages.create.description",
            "Pievieno sistēmas UI valodu, piemēram de, fr vai en-US.",
          )}
        </p>
        <fieldset
          disabled={isBusy}
          className="mt-4 grid gap-3 disabled:opacity-80 sm:grid-cols-[minmax(0,1fr)_auto_auto]"
        >
          <select
            value={selectedCode}
            onChange={(event) => {
              setSelectedCode(event.target.value);
              clearFeedback();
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 disabled:cursor-not-allowed"
          >
            <option value="">
              {t("site_languages.create.select_placeholder", "Izvēlies valodu")}
            </option>
            {createOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.code.toUpperCase()} — {option.name}
              </option>
            ))}
          </select>
          <label className="inline-flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-700">
            {t("common.default", "Noklusējuma")}
            <ToggleSwitch
              checked={makeDefault}
              disabled={isBusy}
              label={t(
                "site_languages.create.make_default",
                "Jauno valodu iestatīt kā noklusējuma valodu",
              )}
              onChange={setMakeDefault}
            />
          </label>
          <button
            type="submit"
            disabled={isBusy || !selectedOption}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pendingKey === "create" ? (
              <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
            ) : null}
            {t("actions.add", "Pievienot")}
          </button>
        </fieldset>
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">{t("common.language", "Valoda")}</th>
                <th className="px-5 py-3">{t("common.code", "Kods")}</th>
                <th className="px-5 py-3">{t("common.active", "Aktīva")}</th>
                <th className="px-5 py-3">{t("common.default", "Noklusējuma")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {languages.map((language) => (
                <tr key={language.code}>
                  <td className="px-5 py-4 font-semibold text-zinc-900">{language.name}</td>
                  <td className="px-5 py-4 font-mono text-xs text-zinc-500">{language.code}</td>
                  <td className="px-5 py-4">
                    <ToggleSwitch
                      checked={language.isActive}
                      disabled={isBusy}
                      label={t("site_languages.aria.active", "{name} aktīva", {
                        name: language.name,
                      })}
                      onChange={(nextActive) => handleActiveToggle(language, nextActive)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <ToggleSwitch
                      checked={language.isDefault}
                      disabled={isBusy}
                      label={t("site_languages.aria.default", "{name} noklusējuma valoda", {
                        name: language.name,
                      })}
                      onChange={(nextDefault) => handleDefaultToggle(language, nextDefault)}
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        label={t("actions.edit", "Labot")}
                        icon="fas fa-pen"
                        onClick={() => {
                          setEditTarget(language);
                          setEditName(language.name);
                        }}
                      />
                      <IconActionButton
                        label={
                          language.isDefault
                            ? t(
                                "site_languages.delete.default_disabled",
                                "Noklusējuma valodu nevar dzēst",
                              )
                            : t("actions.delete", "Dzēst")
                        }
                        icon="fas fa-trash"
                        variant="delete"
                        disabled={language.isDefault}
                        onClick={() => {
                          if (!language.isDefault) setDeleteTarget(language);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        title={t("actions.edit", "Labot")}
        blocking={isBusy}
        dirty={editDirty}
      >
        <form onSubmit={handleEditSave} className="space-y-4">
          <div>
            <label htmlFor="language-name" className="text-sm font-medium text-zinc-800">
              {t("common.language", "Valoda")}
            </label>
            <input
              id="language-name"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
            />
          </div>
          <div className="flex justify-end border-t border-zinc-100 pt-4">
            <button
              type="submit"
              disabled={isBusy || !editDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pendingKey?.startsWith("edit:") ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : null}
              {t("actions.save", "Saglabāt")}
            </button>
          </div>
        </form>
      </AppModal>

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("site_languages.delete.title", "Dzēst valodu?")}
        description={
          <>
            {t("site_languages.delete.confirm_prefix", "Vai tiešām dzēst valodu")}{" "}
            <span className="font-semibold text-zinc-900">{deleteTarget?.name}</span>
            {t(
              "site_languages.delete.confirm_suffix",
              "? Šīs valodas tulkojumu vērtības tiks noņemtas.",
            )}
          </>
        }
        confirmLabel={
          pendingKey?.startsWith("delete:")
            ? t("actions.deleting", "Dzēš…")
            : t("actions.delete", "Dzēst")
        }
        confirmVariant="danger"
        blocking={isBusy}
        onConfirm={handleDelete}
      />
    </div>
  );
}
