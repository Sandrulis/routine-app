"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

const passwordFieldClassName =
  "min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100";

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
  const { showFeedback } = useFeedbackToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCurrentPassword("");
    setNextPassword("");
    setConfirmPassword("");
    setPending(false);
  }, [open]);

  const dirty = Boolean(currentPassword || nextPassword || confirmPassword);
  const passwordsMatch = nextPassword === confirmPassword;
  const canSave =
    !pending &&
    currentPassword.length > 0 &&
    nextPassword.length >= 8 &&
    passwordsMatch &&
    nextPassword !== currentPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    if (nextPassword.length < 8) {
      showFeedback({
        type: "error",
        text: t("auth.signup.password_short", "Parolei jābūt vismaz 8 zīmēm."),
      });
      return;
    }

    if (!passwordsMatch) {
      showFeedback({
        type: "error",
        text: t("auth.signup.password_mismatch", "Paroles nesakrīt."),
      });
      return;
    }

    if (nextPassword === currentPassword) {
      showFeedback({
        type: "error",
        text: t(
          "user_menu.password.same",
          "Jaunā parole nedrīkst sakrist ar pašreizējo.",
        ),
      });
      return;
    }

    if (!currentPassword || !isSupabaseConfigured()) {
      showFeedback({
        type: "error",
        text: t("user_menu.password.failed", "Neizdevās atjaunot paroli."),
      });
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { data, error: userError } = await supabase.auth.getUser();
      const email = data.user?.email?.trim();
      if (userError || !email) {
        showFeedback({
          type: "error",
          text: t("user_menu.password.failed", "Neizdevās atjaunot paroli."),
        });
        return;
      }

      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      });
      if (reauthError) {
        showFeedback({
          type: "error",
          text: t(
            "user_menu.password.current_invalid",
            "Pašreizējā parole nav pareiza.",
          ),
        });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: nextPassword,
      });
      if (updateError) {
        showFeedback({
          type: "error",
          text: t("user_menu.password.failed", "Neizdevās atjaunot paroli."),
        });
        return;
      }

      onSave();
      onOpenChange(false);
    } catch {
      showFeedback({
        type: "error",
        text: t("user_menu.password.failed", "Neizdevās atjaunot paroli."),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("user_menu.password", "Mainīt paroli")}
      description={t(
        "user_menu.password.description",
        "Ievadi pašreizējo paroli un jauno paroli.",
      )}
      dirty={dirty}
      blocking={pending}
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
          <PasswordInput
            id="current-password"
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            className="mt-2"
            inputClassName={passwordFieldClassName}
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
          <PasswordInput
            id="next-password"
            autoComplete="new-password"
            value={nextPassword}
            onChange={(event) => setNextPassword(event.target.value)}
            className="mt-2"
            inputClassName={passwordFieldClassName}
          />
        </div>
        <div>
          <label
            htmlFor="confirm-password"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("user_menu.password.confirm", "Atkārtot jauno paroli")}
          </label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            aria-invalid={confirmPassword.length > 0 && !passwordsMatch}
            className="mt-2"
            inputClassName={passwordFieldClassName}
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {pending
              ? t("actions.saving", "Saglabā…")
              : t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
