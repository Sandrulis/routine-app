"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createSiteTranslationAction,
  deleteSiteTranslationAction,
  updateSiteTranslationAction,
} from "@/app/(app)/admin/actions";
import {
  AppModal,
  appModalExtraWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  SiteLanguageSummary,
  SiteTranslationInput,
  SiteTranslationSummary,
} from "@/app/lib/site-admin/types";

type TranslationDraft = SiteTranslationInput;

function createEmptyDraft(languages: SiteLanguageSummary[]): TranslationDraft {
  return {
    key: "",
    namespace: "",
    description: "",
    values: Object.fromEntries(languages.map((language) => [language.code, ""])),
  };
}

function createDraftFromTranslation(
  translation: SiteTranslationSummary,
  languages: SiteLanguageSummary[],
): TranslationDraft {
  return {
    key: translation.key,
    namespace: translation.namespace,
    description: translation.description,
    values: Object.fromEntries(
      languages.map((language) => [
        language.code,
        translation.values[language.code] ?? "",
      ]),
    ),
  };
}

export function AdminTranslationsManager({
  translations,
  languages,
}: {
  translations: SiteTranslationSummary[];
  languages: SiteLanguageSummary[];
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => createEmptyDraft(languages));
  const [deleteTarget, setDeleteTarget] = useState<SiteTranslationSummary | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredTranslations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return translations;

    return translations.filter((translation) => {
      const haystack = [
        translation.key,
        translation.namespace,
        translation.description,
        ...Object.values(translation.values),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [query, translations]);

  const initialDraft = useMemo(() => {
    if (!editingKey) return createEmptyDraft(languages);
    const translation = translations.find((item) => item.key === editingKey);
    return translation
      ? createDraftFromTranslation(translation, languages)
      : createEmptyDraft(languages);
  }, [editingKey, languages, translations]);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  function openCreateModal() {
    clearFeedback();
    setEditingKey(null);
    setDraft(createEmptyDraft(languages));
    setModalOpen(true);
  }

  function openEditModal(translation: SiteTranslationSummary) {
    clearFeedback();
    setEditingKey(translation.key);
    setDraft(createDraftFromTranslation(translation, languages));
    setModalOpen(true);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    if (!draft.key.trim()) {
      showFeedback({
        type: "error",
        text: t("site_translations.feedback.key_required", "Ievadi tulkojuma key."),
      });
      return;
    }

    startTransition(async () => {
      const payload = { ...draft, namespace: "", description: "" };
      const result = editingKey
        ? await updateSiteTranslationAction(editingKey, payload)
        : await createSiteTranslationAction(payload);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingKey
          ? t("site_translations.feedback.saved", "Tulkojums saglabāts.")
          : t("site_translations.feedback.created", "Tulkojums pievienots."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteSiteTranslationAction(deleteTarget.key);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }
      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("site_translations.feedback.deleted", "Tulkojums dzēsts."),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">
        {t(
          "site_translations.help",
          "Sarakstā meklē pēc key un tulkojumu tekstiem. Labošanas formā vienlaikus redzamas visas valodas.",
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("site_translations.search.placeholder", "Meklēt tulkojumus...")}
          className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400"
        />
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("site_translations.create.action", "Jauns tulkojums")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">{t("common.key", "Key")}</th>
                <th className="px-5 py-3">
                  {t("site_translations.table.translations", "Tulkojumi")}
                </th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredTranslations.map((translation) => (
                <tr key={translation.key} className="align-top">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-zinc-900">
                      {translation.key}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      {languages.map((language) => (
                        <p key={language.code} className="text-sm text-zinc-600">
                          <span className="font-mono text-xs uppercase text-zinc-400">
                            {language.code}
                          </span>{" "}
                          {translation.values[language.code] || "—"}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        label={t("actions.edit", "Labot")}
                        icon="fas fa-pen"
                        onClick={() => openEditModal(translation)}
                      />
                      <IconActionButton
                        label={
                          translation.bundled
                            ? t(
                                "site_translations.delete.bundled_disabled",
                                "Koda tulkojumu nevar dzēst",
                              )
                            : t("actions.delete", "Dzēst")
                        }
                        icon="fas fa-trash"
                        variant="delete"
                        disabled={translation.bundled}
                        onClick={() => {
                          if (!translation.bundled) setDeleteTarget(translation);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTranslations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-zinc-500">
                    {t("site_translations.empty", "Nav atrasts neviens tulkojums.")}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <AppModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={
          editingKey
            ? t("actions.edit", "Labot")
            : t("site_translations.create.action", "Jauns tulkojums")
        }
        description={t(
          "site_translations.form.description",
          "Norādi key un tulkojumu vērtības valodām.",
        )}
        blocking={isPending}
        dirty={isDirty}
        panelMaxWidthClassName={appModalExtraWidePanelMaxWidthClassName}
      >
        <form onSubmit={handleSave} className="space-y-5">
          <fieldset disabled={isPending} className="space-y-5 disabled:opacity-80">
            <div>
              <label htmlFor="translationKey" className="text-sm font-medium text-zinc-800">
                {t("common.key", "Key")}
              </label>
              <input
                id="translationKey"
                value={draft.key}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, key: event.target.value }))
                }
                placeholder="nav.home"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.code}>
                  <label
                    htmlFor={`translation-${language.code}`}
                    className="text-sm font-medium text-zinc-800"
                  >
                    {language.name}{" "}
                    <span className="font-mono text-xs uppercase text-zinc-400">
                      {language.code}
                    </span>
                  </label>
                  <textarea
                    id={`translation-${language.code}`}
                    value={draft.values[language.code] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        values: { ...current.values, [language.code]: event.target.value },
                      }))
                    }
                    rows={2}
                    className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end border-t border-zinc-100 pt-5">
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
        title={t("site_translations.delete.title", "Dzēst tulkojumu?")}
        description={
          <>
            {t("site_translations.delete.confirm_prefix", "Vai tiešām dzēst tulkojumu")}{" "}
            <span className="font-semibold text-zinc-900">{deleteTarget?.key}</span>?
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
