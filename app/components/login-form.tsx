"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  authCardClassName,
  authInputClassName,
  authInputFieldClassName,
  authPrimaryButtonClassName,
} from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { AuthDivider, GoogleAuthButton, MicrosoftAuthButton } from "@/app/components/google-auth-button";
import { OAuthPendingTurnstileModal } from "@/app/components/oauth-pending-turnstile";
import {
  RememberMeCheckbox,
  useRememberMe,
} from "@/app/components/remember-me-checkbox";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { signInWithPasswordAction } from "@/app/lib/auth/actions";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

export function LoginForm({
  googleSignInEnabled = false,
  microsoftSignInEnabled = false,
  emailPasswordEnabled = false,
  turnstileSiteKey = null,
}: {
  googleSignInEnabled?: boolean;
  microsoftSignInEnabled?: boolean;
  emailPasswordEnabled?: boolean;
  turnstileSiteKey?: string | null;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const { remember, updateRemember } = useRememberMe();
  const oauthEnabled = googleSignInEnabled || microsoftSignInEnabled;
  const oauthReturnPath = getSafeRedirectPath(searchParams.get("next"));
  const googlePending = searchParams.get("pending") === "google";
  const [turnstileModalOpen, setTurnstileModalOpen] = useState(false);

  useEffect(() => {
    if (googlePending && turnstileSiteKey) {
      setTurnstileModalOpen(true);
    }
  }, [googlePending, turnstileSiteKey]);

  function clearPendingQuery() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pending");
    const query = params.toString();
    router.replace(query ? `/login?${query}` : "/login");
  }

  useEffect(() => {
    const error = searchParams.get("error");
    if (error === "google") {
      showFeedback({
        type: "error",
        text: t("auth.google.failed", "Neizdevās pieslēgties ar Google."),
      });
      return;
    }
    if (error === "microsoft") {
      showFeedback({
        type: "error",
        text: t("auth.microsoft.failed", "Neizdevās pieslēgties ar Microsoft."),
      });
      return;
    }

    if (error === "account_exists") {
      showFeedback({
        type: "error",
        text: t(
          "errors.auth_account_exists",
          "Šim e-pastam jau ir konts. Ienāc ar to pašu metodi, ar kuru reģistrējies.",
        ),
      });
      return;
    }
    if (error === "email_unverified") {
      showFeedback({
        type: "error",
        text: t(
          "errors.auth_email_unverified",
          "Microsoft e-pasts nav verificēts.",
        ),
      });
      return;
    }
    if (error === "turnstile") {
      showFeedback({
        type: "error",
        text: t(
          "errors.auth_turnstile_failed",
          "Botu pārbaude neizdevās. Mēģini vēlreiz.",
        ),
      });
    }
  }, [searchParams, showFeedback, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPasswordEnabled) return;
    clearFeedback();
    setPending(true);
    const next = getSafeRedirectPath(searchParams.get("next"));
    const result = await signInWithPasswordAction({
      email,
      password,
      next,
    });
    setPending(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
      });
      return;
    }
    if (!result.needsMfa) {
      showFeedback({
        type: "success",
        text: t("auth.login.success", "Veiksmīgi ienāci."),
      });
    }
    router.push(result.next);
    router.refresh();
  }

  const oauthButtons = oauthEnabled ? (
    <div className="flex items-center gap-3">
      <RememberMeCheckbox
        checked={remember}
        onChange={updateRemember}
        tooltipOnly
        className="shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-2">
        {googleSignInEnabled ? (
          <GoogleAuthButton
            disabled={pending}
            rememberMe={remember}
            returnPath={oauthReturnPath}
            errorPage="login"
          />
        ) : null}
        {microsoftSignInEnabled ? (
          <MicrosoftAuthButton
            disabled={pending}
            rememberMe={remember}
            returnPath={oauthReturnPath}
            errorPage="login"
          />
        ) : null}
      </div>
    </div>
  ) : null;

  return (
    <>
      <form onSubmit={handleSubmit} className={`${authCardClassName} space-y-4`}>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("auth.login.title", "Ienākt")}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {t("auth.login.subtitle", "Pieslēdzies savam {SYSTEM_NAME} kontam.")}
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

            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">
                {t("auth.fields.password", "Parole")}
              </span>
              <PasswordInput
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2"
                inputClassName={authInputFieldClassName}
              />
            </label>
          </>
        ) : null}

        {!emailPasswordEnabled && !oauthEnabled ? (
          <p className="text-sm text-zinc-500">
            {t(
              "auth.email.unavailable",
              "Neviena ienākšanas metode nav ieslēgta. Adminā jābūt aktīvai Resend (e-pasts) vai Google / Microsoft OAuth integrācijai.",
            )}
          </p>
        ) : null}

        {emailPasswordEnabled ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <RememberMeCheckbox checked={remember} onChange={updateRemember} />
              <Link
                href="/forgot-password"
                className="shrink-0 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
              >
                {t("auth.login.forgot", "Aizmirsi paroli?")}
              </Link>
            </div>

            <button
              type="submit"
              disabled={pending}
              className={authPrimaryButtonClassName}
            >
              {t("auth.login.title", "Ienākt")}
            </button>
          </>
        ) : null}

        {emailPasswordEnabled && oauthEnabled ? <AuthDivider /> : null}
        {oauthButtons}

        {emailPasswordEnabled ? (
          <p className="text-center text-sm text-zinc-500">
            {t("auth.login.no_account", "Nav konta?")}{" "}
            <Link
              href="/signup"
              className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2"
            >
              {t("auth.signup.title", "Reģistrēties")}
            </Link>
          </p>
        ) : null}
      </form>

      {turnstileSiteKey ? (
        <OAuthPendingTurnstileModal
          open={turnstileModalOpen}
          siteKey={turnstileSiteKey}
          onOpenChange={(open) => {
            setTurnstileModalOpen(open);
            if (!open && googlePending) {
              clearPendingQuery();
            }
          }}
        />
      ) : null}
    </>
  );
}
