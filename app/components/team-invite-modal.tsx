"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";

export function TeamInviteModal({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (input: { name: string; email: string; role: string }) => void;
}) {
  const { t } = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setEmail("");
    setRole("");
  }, [open]);

  const trimmedName = name.trim();
  const trimmedEmail = email.trim();
  const trimmedRole = role.trim();
  const dirty = Boolean(trimmedName || trimmedEmail || trimmedRole);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName || !emailValid) return;
    onInvite({ name: trimmedName, email: trimmedEmail, role: trimmedRole });
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("team.invite.title", "Uzaicināt biedru")}
      description={t(
        "team.invite.description",
        "Ieraksti vārdu un e-pastu, lai uzaicinātu jaunu komandas biedru.",
      )}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="team-invite-name" className="text-sm font-semibold text-zinc-700">
            {t("common.name", "Vārds")}
          </label>
          <input
            id="team-invite-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("team.fields.name_placeholder", "Vārds un uzvārds")}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="team-invite-email" className="text-sm font-semibold text-zinc-700">
            {t("common.email", "E-pasts")}
          </label>
          <input
            id="team-invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={trimmedEmail.length > 0 && !emailValid}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("team.fields.email_placeholder", "vards@uznemums.lv")}
          />
        </div>
        <div>
          <label htmlFor="team-invite-role" className="text-sm font-semibold text-zinc-700">
            {t("team.fields.role", "Loma")}
          </label>
          <input
            id="team-invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            placeholder={t("team.fields.role_placeholder", "Piemēram, izstrādātājs")}
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
            disabled={!trimmedName || !emailValid}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("team.invite.button", "Uzaicināt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
