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
import { LoadingState } from "@/app/components/loading-state";
import { PasswordInput } from "@/app/components/password-input";
import { useTranslations } from "@/app/components/translations-provider";
import { signUpWithPasswordAction } from "@/app/lib/auth/actions";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { getInviteSignupContextAction } from "@/app/lib/team/actions";

export function SignupForm({
  googleSignInEnabled = false,
  microsoftSignInEnabled = false,
  emailPasswordEnabled = false,
}: {
  googleSignInEnabled?: boolean;
  microsoftSignInEnabled?: boolean;
  emailPasswordEnabled?: boolean;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const inviteToken = searchParams.get("invite")?.trim() ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [pending, setPending] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(Boolean(inviteToken));
  const [inviteContext, setInviteContext] = useState<{
    email: string;
    teamName: string;
    inviterName: string;
    nextPath: string;
  } | null>(null);
  const emailLocked = Boolean(inviteContext);
  const oauthEnabled =
    !emailLocked && (googleSignInEnabled || microsoftSignInEnabled);

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
  }, [searchParams, showFeedback, t]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      setInviteContext(null);
      return;
    }

    let cancelled = false;
    setInviteLoading(true);
    void getInviteSignupContextAction(inviteToken)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          if (result.error === "errors.team_invite_account_exists") {
            router.replace(
              `/login?next=${encodeURIComponent(`/invite/${inviteToken}`)}`,
            );
            return;
          }
          showFeedback({
            type: "error",
            text: translateActionError(t, result.error),
          });
          router.replace(`/invite/${inviteToken}`);
          return;
        }
        setInviteContext(result.data);
        setEmail(result.data.email);
      })
      .finally(() => {
        if (!cancelled) setInviteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [inviteToken, router, showFeedback, t]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!emailPasswordEnabled) return;
    clearFeedback();

    if (!firstName.trim()) {
      showFeedback({
        type: "error",
        text: translateActionError(t, "errors.first_name_required"),
      });
      return;
    }
    if (!lastName.trim()) {
      showFeedback({
        type: "error",
        text: translateActionError(t, "errors.last_name_required"),
      });
      return;
    }

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
      firstName,
      lastName,
      email,
      password,
      next: inviteContext?.nextPath ?? getSafeRedirectPath(searchParams.get("next")),
      inviteToken: inviteToken || undefined,
    });
    setPending(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
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
      router.push(
        inviteContext
          ? `/login?next=${encodeURIComponent(inviteContext.nextPath)}`
          : "/login",
      );
      return;
    }
    showFeedback({
      type: "success",
      text: t("auth.signup.success", "Konts izveidots. Laipni lūgts {SYSTEM_NAME}."),
    });
    router.push(result.next);
    router.refresh();
  }

  if (inviteLoading) {
    return (
      <div className={`${authCardClassName} py-12`}>
        <LoadingState className="justify-center" />
      </div>
    );
  }

  const oauthButtons = oauthEnabled ? (
    <div className="space-y-2">
      {googleSignInEnabled ? (
        <GoogleAuthButton
          disabled={pending}
          rememberMe={false}
          errorPage="signup"
        />
      ) : null}
      {microsoftSignInEnabled ? (
        <MicrosoftAuthButton
          disabled={pending}
          rememberMe={false}
          errorPage="signup"
        />
      ) : null}
    </div>
  ) : null;

  return (
    <form onSubmit={handleSubmit} className={`${authCardClassName} space-y-4`}>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("auth.signup.title", "Reģistrēties")}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {inviteContext
            ? t(
                "auth.signup.invite_subtitle",
                "Izveido kontu, lai pievienotos komandai “{team}”.",
                { team: inviteContext.teamName },
              )
            : t("auth.signup.subtitle", "Izveido kontu un sāc darbu ar komandu.")}
        </p>
      </div>

      {emailPasswordEnabled ? (
        <>
          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">
              {t("profile.personal.first_name", "Vārds")}
            </span>
            <input
              required
              type="text"
              autoComplete="given-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className={authInputClassName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">
              {t("profile.personal.last_name", "Uzvārds")}
            </span>
            <input
              required
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
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
              onChange={(event) => {
                if (!emailLocked) setEmail(event.target.value);
              }}
              readOnly={emailLocked}
              disabled={emailLocked}
              placeholder={t("auth.fields.email_placeholder", "vards@uznemums.lv")}
              className={`${authInputClassName} disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-600`}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">
              {t("auth.fields.password", "Parole")}
            </span>
            <PasswordInput
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2"
              inputClassName={authInputFieldClassName}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">
              {t("auth.fields.password_confirm", "Atkārtot paroli")}
            </span>
            <PasswordInput
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2"
              inputClassName={authInputFieldClassName}
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
        </>
      ) : null}

      {!emailPasswordEnabled && !oauthEnabled ? (
        <p className="text-sm text-zinc-500">
          {t(
            "auth.email.unavailable",
            "Ienākšana un reģistrācija ar e-pastu ir pieejama, kad Resend integrācija ir konfigurēta un aktīva.",
          )}
        </p>
      ) : null}

      {emailPasswordEnabled ? (
        <button
          type="submit"
          disabled={pending || (Boolean(inviteToken) && !inviteContext)}
          className={authPrimaryButtonClassName}
        >
          {t("auth.signup.title", "Reģistrēties")}
        </button>
      ) : null}

      {emailPasswordEnabled && oauthEnabled ? <AuthDivider /> : null}
      {oauthButtons}

      <p className="text-center text-sm text-zinc-500">
        {t("auth.signup.has_account", "Jau ir konts?")}{" "}
        <Link
          href={
            inviteToken
              ? `/login?next=${encodeURIComponent(`/invite/${inviteToken}`)}`
              : "/login"
          }
          className="font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-2"
        >
          {t("auth.login.title", "Ienākt")}
        </Link>
      </p>
    </form>
  );
}
