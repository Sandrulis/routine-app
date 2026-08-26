"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
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
import { PasswordStrengthMeter } from "@/app/components/password-strength-meter";
import { useTranslations } from "@/app/components/translations-provider";
import { signUpWithPasswordAction } from "@/app/lib/auth/actions";
import { generateStrongPassword } from "@/app/lib/auth/generate-strong-password";
import { isPasswordStrongEnough } from "@/app/lib/auth/password-strength";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { getInviteSignupContextAction } from "@/app/lib/team/actions";
import { OAuthPendingTurnstileModal } from "@/app/components/oauth-pending-turnstile";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/app/components/turnstile-widget";

export function SignupForm({
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
  const searchParams = useSearchParams();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const inviteToken = searchParams.get("invite")?.trim() ?? "";
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  /** Suggested password still shown as plain text until the user edits a field. */
  const [suggestionPlain, setSuggestionPlain] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  /** After a suggested fill, the first password edit must empty confirm. */
  const clearConfirmOnPasswordEditRef = useRef(false);
  /** Ignore browser re-filling confirm right after we clear it. */
  const ignoreConfirmRefillRef = useRef(false);
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
  const turnstileRequired = Boolean(turnstileSiteKey);
  const googlePending = searchParams.get("pending") === "google";
  const [turnstileModalOpen, setTurnstileModalOpen] = useState(false);
  const showTurnstile = turnstileRequired && emailPasswordEnabled;

  function getTurnstileToken() {
    return turnstileRef.current?.getToken() ?? null;
  }

  function applySuggestedPassword() {
    const next = generateStrongPassword(16);
    setPassword(next);
    setConfirmPassword(next);
    setSuggestionPlain(true);
    setPasswordVisible(true);
    setConfirmVisible(true);
    clearConfirmOnPasswordEditRef.current = true;
  }

  useEffect(() => {
    if (!emailPasswordEnabled) return;
    applySuggestedPassword();
    // Fill once when the email/password form is available.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount/enable fill
  }, [emailPasswordEnabled]);

  useEffect(() => {
    if (googlePending && turnstileSiteKey) {
      setTurnstileModalOpen(true);
    }
  }, [googlePending, turnstileSiteKey]);

  function clearPendingQuery() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("pending");
    const query = params.toString();
    router.replace(query ? `/signup?${query}` : "/signup");
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
      turnstileRef.current?.reset();
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

    if (!isPasswordStrongEnough(password)) {
      showFeedback({
        type: "error",
        text: t(
          "auth.signup.password_too_weak",
          "Parole ir pārāk vāja. Izmanto lielos un mazos burtus, ciparus un speciālo zīmi.",
        ),
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
    const result = await signUpWithPasswordAction({
      firstName,
      lastName,
      email,
      password,
      next: inviteContext?.nextPath ?? getSafeRedirectPath(searchParams.get("next")),
      inviteToken: inviteToken || undefined,
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
    <>
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

          <div className="block">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-700">
                {t("auth.fields.password", "Parole")}
              </span>
              <PasswordInput
                required
                autoComplete="new-password"
                value={password}
                visible={passwordVisible}
                onVisibleChange={setPasswordVisible}
                onChange={(event) => {
                  const next = event.target.value;
                  setPassword(next);
                  if (
                    !event.nativeEvent.isTrusted ||
                    !clearConfirmOnPasswordEditRef.current
                  ) {
                    return;
                  }
                  // User started typing their own password — confirm must be empty.
                  clearConfirmOnPasswordEditRef.current = false;
                  ignoreConfirmRefillRef.current = true;
                  setConfirmPassword("");
                  setConfirmVisible(false);
                  setSuggestionPlain(false);
                  setPasswordVisible(false);
                  window.setTimeout(() => {
                    ignoreConfirmRefillRef.current = false;
                  }, 100);
                }}
                className="mt-2"
                inputClassName={authInputFieldClassName}
              />
            </label>
            <PasswordStrengthMeter password={password} />
            {suggestionPlain ? (
              <p className="mt-2 text-xs text-zinc-500">
                {t(
                  "auth.signup.password_suggested_hint",
                  "Spēcīga parole ir aizpildīta. Vari labot vai izvēlēties citu.",
                )}
              </p>
            ) : null}
            <button
              type="button"
              onClick={applySuggestedPassword}
              className="mt-1.5 text-left text-xs font-semibold text-zinc-700 underline decoration-zinc-300 underline-offset-2 transition hover:text-zinc-900"
            >
              {t(
                "auth.signup.password_suggest",
                "Piedāvāt citu spēcīgu paroli",
              )}
            </button>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-zinc-700">
              {t("auth.fields.password_confirm", "Atkārtot paroli")}
            </span>
            <PasswordInput
              required
              autoComplete="new-password"
              value={confirmPassword}
              visible={confirmVisible}
              onVisibleChange={setConfirmVisible}
              onChange={(event) => {
                const next = event.target.value;
                if (ignoreConfirmRefillRef.current && next !== "") {
                  return;
                }
                setConfirmPassword(next);
                if (suggestionPlain && event.nativeEvent.isTrusted) {
                  setSuggestionPlain(false);
                  setConfirmVisible(false);
                }
              }}
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
        <>
          {showTurnstile && turnstileSiteKey ? (
            <TurnstileWidget ref={turnstileRef} siteKey={turnstileSiteKey} />
          ) : null}
          <button
            type="submit"
            disabled={pending || (Boolean(inviteToken) && !inviteContext)}
            className={authPrimaryButtonClassName}
          >
            {t("auth.signup.title", "Reģistrēties")}
          </button>
        </>
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
