"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";

export function ProjectFormModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; description: string }) => void;
}) {
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setDescription("");
  }, [open]);

  const trimmedName = name.trim();
  const trimmedDescription = description.trim();
  const dirty = Boolean(trimmedName || trimmedDescription);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    onCreate({ name: trimmedName, description: trimmedDescription });
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("projects.add.title", "Jauns projekts")}
      description={t(
        "projects.add.description",
        "Ieraksti projekta nosaukumu, lai pievienotu to aktīvajiem projektiem.",
      )}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="project-name" className="text-sm font-semibold text-zinc-700">
            {t("projects.fields.name", "Nosaukums")}
          </label>
          <input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("projects.fields.name_placeholder", "Projekta nosaukums")}
            autoFocus
          />
        </div>
        <div>
          <label
            htmlFor="project-description"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("projects.fields.description", "Apraksts")}
          </label>
          <textarea
            id="project-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t(
              "projects.fields.description_placeholder",
              "Īss projekta apraksts",
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!trimmedName}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("actions.add", "Pievienot")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
