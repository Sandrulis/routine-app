"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";

export function ChangePasswordModal({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  const { t } = useTranslations();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
  }, [open]);

  const dirty = Boolean(currentPassword || nextPassword || confirmPassword);
  const passwordsMatch = nextPassword === confirmPassword;
  const canSave =
    currentPassword.length > 0 && nextPassword.length >= 8 && passwordsMatch;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;
    onSave();
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("user_menu.password.title", "Mainīt paroli")}
      description={t(
        "user_menu.password.description",
        "Ievadi pašreizējo paroli un jauno paroli.",
      )}
      dirty={dirty}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="current-password"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("user_menu.password.current", "Pašreizējā parole")}
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            autoFocus
          />
        </div>
        <div>
          <label
            htmlFor="next-password"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("user_menu.password.next", "Jaunā parole")}
          </label>
          <input
            id="next-password"
            type="password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("user_menu.password.confirm", "Atkārtot jauno paroli")}
          </label>
          <input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
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
            disabled={!canSave}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
