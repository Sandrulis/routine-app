"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  authCardClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";

export function ForgotPasswordForm() {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    setPending(true);
    showFeedback({
      type: "success",
      text: t(
        "auth.forgot.success",
        "Ja konts pastāv, nosūtīsim atjaunošanas saiti.",
      ),
    });
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className={`${authCardClassName} space-y-4`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("auth.forgot.title", "Aizmirsi paroli")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t(
            "auth.forgot.subtitle",
            "Ievadi e-pastu, un nosūtīsim paroles atjaunošanas saiti.",
          )}
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">
          {t("auth.fields.email", "E-pasts")}
        </span>
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("auth.fields.email_placeholder", "vards@uznemums.lv")}
          className={authInputClassName}
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className={authPrimaryButtonClassName}
      >
        {t("auth.forgot.submit", "Nosūtīt saiti")}
      </button>

      <p className="text-center text-sm text-zinc-500">
        <Link
          href="/login"
          className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2"
        >
          {t("auth.forgot.back", "Atpakaļ uz ienākšanu")}
        </Link>
      </p>
    </form>
  );
}
