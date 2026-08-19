"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { MEMBER_TEAM_ROLE, teamRankLabel } from "@/app/lib/team";
import { useTeam } from "@/app/lib/team-store";

export function TeamInviteModal({
  open,
  onOpenChange,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (input: { email: string; role: string }) => void | Promise<void>;
}) {
  const { t } = useTranslations();
  const { roles } = useTeam();
  const defaultRoleId =
    roles.find((item) => item.slug === MEMBER_TEAM_ROLE)?.id ?? roles[0]?.id ?? "";
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(defaultRoleId);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail("");
    setRole(defaultRoleId);
    setPending(false);
  }, [defaultRoleId, open]);

  const trimmedEmail = email.trim();
  const dirty = Boolean(trimmedEmail);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailValid || !role.trim() || pending) return;
    setPending(true);
    try {
      await onInvite({ email: trimmedEmail, role: role.trim() });
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("team.invite.title", "Uzaicināt biedru")}
      description={t(
        "team.invite.description",
        "Ieraksti e-pastu un izvēlies lomu. Biedrs aizpildīs profilu pie pirmās ielogošanās.",
      )}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="team-invite-email" className="text-sm font-semibold text-zinc-700">
            {t("common.email", "E-pasts")}
          </label>
          <input
            id="team-invite-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={pending}
            aria-invalid={trimmedEmail.length > 0 && !emailValid}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
            placeholder={t("team.fields.email_placeholder", "vards@uznemums.lv")}
            autoFocus
          />
        </div>
        <div>
          <label htmlFor="team-invite-role" className="text-sm font-semibold text-zinc-700">
            {t("team.fields.role", "Loma")}
          </label>
          <select
            id="team-invite-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            disabled={pending}
            className="mt-2 min-h-11 w-full cursor-pointer rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:opacity-60"
          >
            {roles.map((item) => (
              <option key={item.id} value={item.id}>
                {teamRankLabel(item.slug, t, roles) ?? item.name}
              </option>
            ))}
          </select>
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
            disabled={!emailValid || !role.trim() || pending}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {pending
              ? t("team.invite.sending", "Sūta…")
              : t("team.invite.button", "Uzaicināt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
