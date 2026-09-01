"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AppModal } from "@/app/components/app-modal";
import { OverflowTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

const MAX_FILE_NOTE_LENGTH = 500;

export function FileNoteModal({
  open,
  onOpenChange,
  fileName,
  initialNote,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  initialNote: string;
  onSave: (note: string) => void;
}) {
  const { t } = useTranslations();
  const [note, setNote] = useState("");
  const [snapshot, setSnapshot] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = initialNote.trim();
    setNote(initialNote);
    setSnapshot(next);
  }, [open, initialNote]);

  const trimmed = note.trim();
  const dirty = trimmed !== snapshot;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!dirty) return;
    onSave(trimmed);
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("files.note", "Piezīme")}
      description={t(
        "files.note.help",
        "Piezīme parādās, kad uzvelc peli uz pielikuma.",
      )}
      dirty={dirty}
      headerSubtitle={
        fileName ? (
          <OverflowTooltip label={fileName} className="min-w-0">
            <p className="truncate text-sm text-zinc-500">{fileName}</p>
          </OverflowTooltip>
        ) : null
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="file-note"
            className="text-sm font-medium text-zinc-500"
          >
            {t("files.note", "Piezīme")}
          </label>
          <textarea
            id="file-note"
            value={note}
            onChange={(event) =>
              setNote(event.target.value.slice(0, MAX_FILE_NOTE_LENGTH))
            }
            rows={4}
            maxLength={MAX_FILE_NOTE_LENGTH}
            className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder={t(
              "lists.windows.files_note_placeholder",
              "Īsa piezīme",
            )}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!dirty}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
