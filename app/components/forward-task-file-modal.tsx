"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { formatFileSize } from "@/app/lib/list-files";

export function ForwardTaskFileModal({
  open,
  onOpenChange,
  fileName,
  fileSize,
  defaultTo = "",
  defaultSubject,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileName: string;
  fileSize?: number;
  defaultTo?: string;
  defaultSubject: string;
  onSend: (input: {
    to: string;
    subject: string;
    body: string;
  }) => void | Promise<void>;
}) {
  const { t } = useTranslations();
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTo(defaultTo);
    setSubject(defaultSubject);
    setBody("");
    setPending(false);
  }, [defaultSubject, defaultTo, open]);

  const trimmedTo = to.trim();
  const trimmedSubject = subject.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedTo);
  const canSubmit = emailValid && trimmedSubject.length > 0 && !pending;
  const dirty =
    trimmedTo !== defaultTo.trim() ||
    body.trim().length > 0 ||
    trimmedSubject !== defaultSubject.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    try {
      await onSend({
        to: trimmedTo,
        subject: trimmedSubject,
        body: body.trim(),
      });
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  const sizeLabel =
    typeof fileSize === "number" && fileSize > 0
      ? ` (${formatFileSize(fileSize)})`
      : "";

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("files.forward.title", "Pārsūtīt failu")}
      description={t(
        "files.forward.description",
        "Nosūti failu e-pastā caur Resend. Atbilde (Reply-To) būs tava e-pasta adrese.",
      )}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        <p className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <span className="font-semibold text-zinc-900">
            {t("files.forward.attachment", "Pielikums")}
          </span>
          {": "}
          <span className="break-all">{fileName}</span>
          {sizeLabel}
        </p>
        <div>
          <label
            htmlFor="forward-file-to"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("common.email", "E-pasts")}
          </label>
          <input
            id="forward-file-to"
            type="email"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            disabled={pending}
            aria-invalid={trimmedTo.length > 0 && !emailValid}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            placeholder={t("team.fields.email_placeholder", "vards@uznemums.lv")}
            autoFocus
          />
        </div>
        <div>
          <label
            htmlFor="forward-file-subject"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("files.forward.subject", "Tēma")}
          </label>
          <input
            id="forward-file-subject"
            type="text"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={pending}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          />
        </div>
        <div>
          <label
            htmlFor="forward-file-body"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("files.forward.body", "Ziņojums")}
          </label>
          <textarea
            id="forward-file-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={pending}
            rows={5}
            className="mt-2 w-full resize-y rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            placeholder={t(
              "files.forward.body_placeholder",
              "Ieraksti ziņojuma tekstu…",
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? t("files.forward.sending", "Sūta…")
              : t("files.forward.send", "Sūtīt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
