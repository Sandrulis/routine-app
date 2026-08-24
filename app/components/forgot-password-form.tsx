"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import {
  authCardClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/app/components/turnstile-widget";
import { requestPasswordResetAction } from "@/app/lib/auth/actions";
import { translateActionError } from "@/app/lib/i18n/action-errors";

export function ForgotPasswordForm({
  emailPasswordEnabled = false,
  turnstileSiteKey = null,
}: {
  emailPasswordEnabled?: boolean;
  turnstileSiteKey?: string | null;
}) {
  const { t } = useTranslations();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const turnstileRequired = Boolean(turnstileSiteKey);

  function getTurnstileToken() {
    return turnstileRef.current?.getToken() ?? null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPasswordEnabled) return;
    clearFeedback();

    if (turnstileRequired && !getTurnstileToken()) {
      showFeedback({
        type: "error",
        text: t(
          "errors.auth_turnstile_required",
          "Apstiprini, ka neesi robots, pirms turpini.",
        ),
      });
      return;
    }

    setPending(true);
    const result = await requestPasswordResetAction({
      email,
      turnstileToken: getTurnstileToken() ?? undefined,
    });
    setPending(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
      });
      turnstileRef.current?.reset();
      return;
    }
    showFeedback({
      type: "success",
      text: t(
        "auth.forgot.success",
        "Ja konts pastāv, nosūtīsim atjaunošanas saiti.",
      ),
    });
  }

  return (
    <form onSubmit={handleSubmit} className={`${authCardClassName} space-y-4`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("auth.forgot.title", "Aizmirsi paroli")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {emailPasswordEnabled
            ? t(
                "auth.forgot.subtitle",
                "Ievadi e-pastu, un nosūtīsim paroles atjaunošanas saiti.",
              )
            : t(
                "auth.email.unavailable",
                "Ienākšana un reģistrācija ar e-pastu ir pieejama, kad Resend integrācija ir konfigurēta un aktīva.",
              )}
        </p>
      </div>

      {emailPasswordEnabled ? (
        <>
          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">
              {t("common.email", "E-pasts")}
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

          {turnstileSiteKey ? (
            <TurnstileWidget ref={turnstileRef} siteKey={turnstileSiteKey} />
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className={authPrimaryButtonClassName}
          >
            {t("auth.forgot.submit", "Nosūtīt saiti")}
          </button>
        </>
      ) : null}

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
