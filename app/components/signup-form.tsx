"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  authCardClassName,
  authInputClassName,
  authPrimaryButtonClassName,
} from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { AuthDivider, GoogleAuthButton, MicrosoftAuthButton } from "@/app/components/google-auth-button";
import {
  RememberMeCheckbox,
  useRememberMe,
} from "@/app/components/remember-me-checkbox";
import { useTranslations } from "@/app/components/translations-provider";
import { signUpWithPasswordAction } from "@/app/lib/auth/actions";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";

export function SignupForm({
  googleSignInEnabled = false,
  microsoftSignInEnabled = false,
}: {
  googleSignInEnabled?: boolean;
  microsoftSignInEnabled?: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const { remember, updateRemember } = useRememberMe();

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
    }
  }, [searchParams, showFeedback, t]);

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

    if (!accepted) {
      showFeedback({
        type: "error",
        text: t(
          "auth.signup.terms_required",
          "Lai reģistrētos, piekrīti noteikumiem.",
        ),
      });
      return;
    }

    setPending(true);
    const result = await signUpWithPasswordAction({
      name,
      email,
      password,
      next: getSafeRedirectPath(searchParams.get("next")),
    });
    setPending(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: t(result.error, "Reģistrācija neizdevās."),
      });
      return;
    }
    if (result.needsEmail) {
      showFeedback({
        type: "success",
        text: t(
          "auth.signup.check_email",
          "Pārbaudi e-pastu, lai apstiprinātu kontu.",
        ),
      });
      router.push("/login");
      return;
    }
    showFeedback({
      type: "success",
      text: t("auth.signup.success", "Konts izveidots. Laipni lūgts Routine."),
    });
    router.push(result.next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className={`${authCardClassName} space-y-4`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("auth.signup.title", "Reģistrēties")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {t("auth.signup.subtitle", "Izveido kontu un sāc darbu ar komandu.")}
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-semibold text-zinc-700">
          {t("common.name", "Vārds")}
        </span>
        <input
          required
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("auth.fields.name_placeholder", "Vārds un uzvārds")}
          className={authInputClassName}
        />
      </label>

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

      <label className="flex items-start gap-3 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(event) => setAccepted(event.target.checked)}
          className="mt-1 size-4 rounded border-zinc-300"
        />
        <span>
          {t("auth.signup.accept_prefix", "Piekrītu")}{" "}
          <Link
            href="/terms"
            className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2"
          >
            {t("legal.terms.title", "Lietošanas noteikumiem")}
          </Link>{" "}
          {t("auth.signup.accept_and", "un")}{" "}
          <Link
            href="/privacy"
            className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2"
          >
            {t("legal.privacy.title", "Privātuma politikai")}
          </Link>
          .
        </span>
      </label>

      <RememberMeCheckbox checked={remember} onChange={updateRemember} />

      <button
        type="submit"
        disabled={pending}
        className={authPrimaryButtonClassName}
      >
        {t("auth.signup.title", "Reģistrēties")}
      </button>

      {googleSignInEnabled || microsoftSignInEnabled ? (
        <>
          <AuthDivider />
          <div className="space-y-2">
            {googleSignInEnabled ? (
              <GoogleAuthButton
                disabled={pending}
                rememberMe={remember}
                errorPage="signup"
                onBeforeSignIn={() => {
                  if (accepted) {
                    return true;
                  }

                  showFeedback({
                    type: "error",
                    text: t(
                      "auth.signup.terms_required",
                      "Lai reģistrētos, piekrīti noteikumiem.",
                    ),
                  });
                  return false;
                }}
              />
            ) : null}
            {microsoftSignInEnabled ? (
              <MicrosoftAuthButton
                disabled={pending}
                rememberMe={remember}
                errorPage="signup"
                onBeforeSignIn={() => {
                  if (accepted) {
                    return true;
                  }

                  showFeedback({
                    type: "error",
                    text: t(
                      "auth.signup.terms_required",
                      "Lai reģistrētos, piekrīti noteikumiem.",
                    ),
                  });
                  return false;
                }}
              />
            ) : null}
          </div>
        </>
      ) : null}

      <p className="text-center text-sm text-zinc-500">
        {t("auth.signup.has_account", "Jau ir konts?")}{" "}
        <Link
          href="/login"
          className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2"
        >
          {t("auth.login.title", "Ienākt")}
        </Link>
      </p>
    </form>
  );
}
