"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  authCardClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { updatePasswordAction } from "@/app/lib/auth/actions";

export function UpdatePasswordForm() {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (password.length < 8) {
      showFeedback({
        type: "error",
        text: t("auth.signup.password_short", "Parolei jābūt vismaz 8 zīmēm."),
      });
      return;
    }
    if (password !== confirmPassword) {
      showFeedback({
        type: "error",
        text: t("auth.signup.password_mismatch", "Paroles nesakrīt."),
      });
      return;
    }
    setPending(true);
    const result = await updatePasswordAction({ password });
    setPending(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: t(result.error, "Paroli neizdevās atjaunot."),
      });
      return;
    }
    showFeedback({
      type: "success",
      text: t("auth.update_password.success", "Parole atjaunota."),
    });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`${authCardClassName} space-y-4`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("auth.update_password.title", "Jauna parole")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t(
            "auth.update_password.subtitle",
            "Izvēlies jaunu paroli savam kontam.",
          )}
        </p>
      </div>
      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">
          {t("auth.fields.password", "Parole")}
        </span>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authInputClassName}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">
          {t("auth.fields.password_confirm", "Atkārtot paroli")}
        </span>
        <input
          required
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={authInputClassName}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className={authPrimaryButtonClassName}
      >
        {t("auth.update_password.submit", "Saglabāt paroli")}
      </button>
    </form>
  );
}
