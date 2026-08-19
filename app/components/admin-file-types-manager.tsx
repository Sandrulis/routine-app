"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFileTypeExtensionAction,
  deleteFileTypeExtensionAction,
  updateFileTypeExtensionAction,
} from "@/app/(app)/admin/actions";
import { AppModal } from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { IconActionButton } from "@/app/components/icon-action-button";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import type {
  FileTypeExtensionInput,
  FileTypeExtensionSummary,
} from "@/app/lib/site-admin/types";

type ExtensionDraft = FileTypeExtensionInput;

function emptyDraft(): ExtensionDraft {
  return {
    extension: "",
    mimeType: "",
    icon: "fas fa-file",
    color: "#71717a",
  };
}

function draftFromExtension(entry: FileTypeExtensionSummary): ExtensionDraft {
  return {
    extension: entry.extension,
    mimeType: entry.mimeType,
    icon: entry.icon,
    color: entry.color,
  };
}

export function AdminFileTypesManager({
  extensions: initialExtensions,
}: {
  extensions: FileTypeExtensionSummary[];
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExtension, setEditingExtension] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<FileTypeExtensionSummary | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [extensions, setExtensions] = useState(initialExtensions);

  useEffect(() => {
    setExtensions(initialExtensions);
  }, [initialExtensions]);

  const initialDraft = editingExtension
    ? draftFromExtension(
        extensions.find((entry) => entry.extension === editingExtension) ?? {
          extension: editingExtension,
          mimeType: "",
          icon: "fas fa-file",
          color: "#71717a",
          sortOrder: 0,
        },
      )
    : emptyDraft();
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);

  useEffect(() => {
    if (!modalOpen) {
      setEditingExtension(null);
      setDraft(emptyDraft());
    }
  }, [modalOpen]);

  function openCreate() {
    clearFeedback();
    setEditingExtension(null);
    setDraft(emptyDraft());
    setModalOpen(true);
  }

  function openEdit(entry: FileTypeExtensionSummary) {
    clearFeedback();
    setEditingExtension(entry.extension);
    setDraft(draftFromExtension(entry));
    setModalOpen(true);
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    startTransition(async () => {
      const result = editingExtension
        ? await updateFileTypeExtensionAction(editingExtension, {
            mimeType: draft.mimeType,
            icon: draft.icon,
            color: draft.color,
          })
        : await createFileTypeExtensionAction(draft);

      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setModalOpen(false);
      showFeedback({
        type: "success",
        text: editingExtension
          ? t("admin.file_types.feedback.saved", "Faila tips saglabāts.")
          : t("admin.file_types.feedback.created", "Faila tips pievienots."),
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;

    startTransition(async () => {
      const result = await deleteFileTypeExtensionAction(deleteTarget.extension);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setDeleteTarget(null);
      showFeedback({
        type: "success",
        text: t("admin.file_types.feedback.deleted", "Faila tips dzēsts."),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500">
        {t(
          "admin.file_types.hint",
          "Šeit norāda, kādus failu paplašinājumus var augšupielādēt kokā un apakšuzdevumos.",
        )}
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          <i className="fas fa-plus text-xs" aria-hidden="true" />
          {t("admin.file_types.add", "Jauns tips")}
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-zinc-50 text-left text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-5 py-3">
                  {t("admin.file_types.extension", "Paplašinājums")}
                </th>
                <th className="px-5 py-3">
                  {t("admin.file_types.mime", "MIME tips")}
                </th>
                <th className="px-5 py-3">{t("admin.file_types.icon", "Ikona")}</th>
                <th className="px-5 py-3">{t("admin.file_types.color", "Krāsa")}</th>
                <th className="px-5 py-3 text-right">{t("common.actions", "Darbības")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {extensions.map((entry) => (
                <tr key={entry.extension} className="align-middle">
                  <td className="px-5 py-4 font-mono text-zinc-900">
                    .{entry.extension}
                  </td>
                  <td className="px-5 py-4 text-zinc-600">{entry.mimeType}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-zinc-50">
                      <i
                        className={entry.icon}
                        style={{ color: entry.color }}
                        aria-hidden="true"
                      />
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block size-4 rounded-full ring-1 ring-zinc-200"
                        style={{ backgroundColor: entry.color }}
                        aria-hidden="true"
                      />
                      <span className="font-mono text-xs text-zinc-500">
                        {entry.color}
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-1">
                      <IconActionButton
                        label={t("actions.edit", "Labot")}
                        icon="fas fa-pen"
                        onClick={() => openEdit(entry)}
                      />
                      <IconActionButton
                        label={t("actions.delete", "Dzēst")}
                        icon="fas fa-trash"
                        variant="delete"
                        onClick={() => setDeleteTarget(entry)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {extensions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-zinc-500">
                    {t("admin.file_types.empty", "Nav konfigurētu failu tipu.")}
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
          editingExtension
            ? t("actions.edit", "Labot")
            : t("admin.file_types.add", "Jauns tips")
        }
        description={t(
          "admin.file_types.form.description",
          "Norādi paplašinājumu, MIME tipu, Font Awesome ikonu un krāsu.",
        )}
        blocking={isPending}
        dirty={isDirty}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <fieldset disabled={isPending} className="space-y-4 disabled:opacity-80">
            <div>
              <label
                htmlFor="file-type-extension"
                className="text-sm font-medium text-zinc-800"
              >
                {t("admin.file_types.extension", "Paplašinājums")}
              </label>
              <input
                id="file-type-extension"
                value={draft.extension}
                disabled={Boolean(editingExtension)}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    extension: event.target.value.replace(/^\./, ""),
                  }))
                }
                placeholder="pdf"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:bg-zinc-50"
              />
            </div>

            <div>
              <label
                htmlFor="file-type-mime"
                className="text-sm font-medium text-zinc-800"
              >
                {t("admin.file_types.mime", "MIME tips")}
              </label>
              <input
                id="file-type-mime"
                value={draft.mimeType}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, mimeType: event.target.value }))
                }
                placeholder="application/pdf"
                className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
              />
            </div>

            <div>
              <label
                htmlFor="file-type-icon"
                className="text-sm font-medium text-zinc-800"
              >
                {t("admin.file_types.icon", "Ikona")}
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="file-type-icon"
                  value={draft.icon}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, icon: event.target.value }))
                  }
                  placeholder="fas fa-file-pdf"
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-zinc-50">
                  <i
                    className={draft.icon.trim() || "fas fa-file"}
                    style={{ color: draft.color }}
                    aria-hidden="true"
                  />
                </span>
              </div>
            </div>

            <div>
              <label
                htmlFor="file-type-color"
                className="text-sm font-medium text-zinc-800"
              >
                {t("admin.file_types.color", "Krāsa")}
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  id="file-type-color"
                  type="color"
                  value={draft.color}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, color: event.target.value }))
                  }
                  className="size-10 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1"
                />
                <input
                  value={draft.color}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, color: event.target.value }))
                  }
                  className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
              </div>
            </div>

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
        title={t("admin.file_types.delete.title", "Dzēst faila tipu?")}
        description={
          <>
            {t("admin.file_types.delete.confirm_prefix", "Vai tiešām dzēst tipu")}{" "}
            <span className="font-semibold text-zinc-900">
              .{deleteTarget?.extension}
            </span>
            ?
          </>
        }
        confirmLabel={isPending ? t("actions.deleting", "Dzēš…") : t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={handleDelete}
      />
    </div>
  );
}
