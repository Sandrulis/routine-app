"use client";

import { useState } from "react";
import { authSecondaryButtonClassName } from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { writeRememberSessionPreference } from "@/app/lib/auth/remember-session";
import type { OAuthLoginErrorPage } from "@/app/lib/auth/oauth-login-state";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M12 1h10v10H12z" />
      <path fill="#7FBA00" d="M1 12h10v10H1z" />
      <path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}

export function AuthDivider() {
  const { t } = useTranslations();

  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {t("auth.google.or", "vai")}
      </span>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

type OAuthButtonProps = {
  disabled?: boolean;
  returnPath?: string;
  rememberMe?: boolean;
  errorPage?: OAuthLoginErrorPage;
  onBeforeSignIn?: () => boolean;
};

export function GoogleAuthButton({
  disabled = false,
  returnPath = "/dashboard",
  rememberMe = true,
  errorPage = "login",
  onBeforeSignIn,
}: OAuthButtonProps) {
  const { t } = useTranslations();
  const { clearFeedback } = useFeedbackToast();
  const [pending, setPending] = useState(false);

  function handleClick() {
    if (onBeforeSignIn && !onBeforeSignIn()) {
      return;
    }

    clearFeedback();
    setPending(true);
    writeRememberSessionPreference(rememberMe);

    const params = new URLSearchParams({ next: returnPath });
    if (errorPage !== "login") {
      params.set("errorPage", errorPage);
    }
    window.location.assign(`/auth/google-oauth/sign-in?${params.toString()}`);
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={authSecondaryButtonClassName}
    >
      <GoogleIcon />
      {pending
        ? t("auth.google.signing_in", "Pieslēdzas...")
        : t("auth.google.continue", "Turpināt ar Google")}
    </button>
  );
}

export function MicrosoftAuthButton({
  disabled = false,
  returnPath = "/dashboard",
  rememberMe = true,
  errorPage = "login",
  onBeforeSignIn,
}: OAuthButtonProps) {
  const { t } = useTranslations();
  const { clearFeedback } = useFeedbackToast();
  const [pending, setPending] = useState(false);

  function handleClick() {
    if (onBeforeSignIn && !onBeforeSignIn()) {
      return;
    }

    clearFeedback();
    setPending(true);
    writeRememberSessionPreference(rememberMe);

    const params = new URLSearchParams({ next: returnPath });
    if (errorPage !== "login") {
      params.set("errorPage", errorPage);
    }
    window.location.assign(`/auth/microsoft-oauth/sign-in?${params.toString()}`);
  }

  return (
    <button
      type="button"
      disabled={disabled || pending}
      onClick={handleClick}
      className={authSecondaryButtonClassName}
    >
      <MicrosoftIcon />
      {pending
        ? t("auth.microsoft.signing_in", "Pieslēdzas...")
        : t("auth.microsoft.continue", "Turpināt ar Microsoft")}
    </button>
  );
}
