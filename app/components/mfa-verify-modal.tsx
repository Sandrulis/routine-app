"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/app/components/app-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { OtpCodeInput } from "@/app/components/otp-code-input";
import { useTranslations } from "@/app/components/translations-provider";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { signOutWebsiteLocally } from "@/app/lib/auth/sign-out-website";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

function onlyDigits(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 6);
}

type VerifyStatus = "idle" | "pending" | "success" | "error";

const RESULT_HOLD_MS = 900;

export function MfaVerifyModal({
  open,
  mode = "admin",
  nextPath,
  onVerified,
}: {
  open: boolean;
  mode?: "admin" | "login";
  nextPath?: string;
  onVerified?: () => void;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const codeLabelId = useId();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [verifyStatus, setVerifyStatus] = useState<VerifyStatus>("idle");
  const [otpNonce, setOtpNonce] = useState(0);
  const factorIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);
  const queuedCodeRef = useRef<string | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLogin = mode === "login";
  const pending = verifyStatus !== "idle";
  factorIdRef.current = factorId;

  function clearResultTimer() {
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  }

  useEffect(() => {
    return () => clearResultTimer();
  }, []);

  useEffect(() => {
    if (!open) return;
    clearResultTimer();
    setCode("");
    setVerifyStatus("idle");
    verifyingRef.current = false;
    queuedCodeRef.current = null;
    setOtpNonce((value) => value + 1);
    void (async () => {
      if (!isSupabaseConfigured()) return;
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find(
        (item: { status: string; id: string }) => item.status === "verified",
      );
      setFactorId(verified?.id ?? null);
    })();
  }, [open]);

  useEffect(() => {
    if (!open || !factorId || !queuedCodeRef.current) return;
    void verifyCode(queuedCodeRef.current);
    // Retry once the TOTP factor id arrives if the user already filled the code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, factorId]);

  async function leave() {
    if (isLogin) {
      await signOutWebsiteLocally();
      router.push("/login");
      router.refresh();
      return;
    }
    router.push("/dashboard");
  }

  async function verifyCode(raw: string) {
    const digits = onlyDigits(raw);
    if (digits.length < 6) return;
    queuedCodeRef.current = digits;
    const currentFactorId = factorIdRef.current;
    if (!currentFactorId || verifyingRef.current) return;

    verifyingRef.current = true;
    setVerifyStatus("pending");
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error || !challenge.data) {
      showVerifyError();
      return;
    }

    const verified = await supabase.auth.mfa.verify({
      factorId: currentFactorId,
      challengeId: challenge.data.id,
      code: digits,
    });
    if (verified.error) {
      showVerifyError();
      return;
    }

    setVerifyStatus("success");
    clearResultTimer();
    resultTimerRef.current = setTimeout(() => {
      if (isLogin && nextPath) {
        router.push(getSafeRedirectPath(nextPath));
      }
      if (onVerified) {
        onVerified();
        return;
      }
      router.refresh();
    }, RESULT_HOLD_MS);
  }

  function showVerifyError() {
    setVerifyStatus("error");
    clearResultTimer();
    resultTimerRef.current = setTimeout(() => {
      verifyingRef.current = false;
      queuedCodeRef.current = null;
      setVerifyStatus("idle");
      setCode("");
      setOtpNonce((value) => value + 1);
    }, RESULT_HOLD_MS);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) void leave();
      }}
      title={t("auth.mfa.title", "Divfaktoru autentifikācija")}
      description={
        isLogin
          ? t(
              "auth.mfa.verify_login",
              "Ievadi Authenticator kodu, lai pabeigtu ielogošanos.",
            )
          : t(
              "auth.mfa.subtitle_admin",
              "Administrācijas panelim nepieciešams TOTP kods (Authenticator).",
            )
      }
      dirty={false}
      blocking
      headerMeta={
        <IconActionButton
          label={
            isLogin
              ? t("user_menu.sign_out", "Iziet")
              : t("actions.cancel", "Atcelt")
          }
          icon={isLogin ? "fas fa-right-from-bracket" : "fas fa-times"}
          variant="muted"
          disabled={pending}
          onClick={() => void leave()}
        />
      }
    >
      <div className="space-y-4">
        {isLogin ? null : (
          <p className="text-sm text-amber-700">
            {t(
              "auth.mfa.verify_session",
              "Ievadi Authenticator kodu, lai apstiprinātu šo sesiju.",
            )}
          </p>
        )}
        <div className="block" aria-busy={verifyStatus === "pending"}>
          <span
            id={codeLabelId}
            className="block text-center text-sm font-semibold text-zinc-700"
          >
            {t("auth.mfa.code", "Kods")}
          </span>
          <OtpCodeInput
            key={`${open ? "open" : "closed"}-${otpNonce}`}
            id="mfa-verify-code"
            value={code}
            onChange={setCode}
            onComplete={(next) => void verifyCode(next)}
            disabled={pending}
            autoFocus
            labelledBy={codeLabelId}
          />
          {verifyStatus === "idle" ? null : (
            <p
              className={`mt-3 flex min-h-7 items-center justify-center gap-2 text-sm ${
                verifyStatus === "success"
                  ? "text-emerald-600"
                  : verifyStatus === "error"
                    ? "text-red-600"
                    : "text-zinc-500"
              }`}
              role="status"
              aria-live="polite"
            >
              <span className="relative inline-flex size-6 items-center justify-center">
                <i
                  className={`fas fa-spinner fa-spin absolute text-sm text-zinc-400 transition duration-200 ${
                    verifyStatus === "pending"
                      ? "scale-100 opacity-100"
                      : "scale-50 opacity-0"
                  }`}
                  aria-hidden="true"
                />
                <i
                  className={`fas fa-check-circle absolute text-lg text-emerald-600 ${
                    verifyStatus === "success"
                      ? "mfa-verify-result-in"
                      : "scale-50 opacity-0"
                  }`}
                  aria-hidden="true"
                />
                <i
                  className={`fas fa-times-circle absolute text-lg text-red-600 ${
                    verifyStatus === "error"
                      ? "mfa-verify-result-in"
                      : "scale-50 opacity-0"
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span>
                {verifyStatus === "success"
                  ? t("auth.login.success", "Veiksmīgi ienāci.")
                  : verifyStatus === "error"
                    ? t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz.")
                    : t("common.loading", "Ielādē…")}
              </span>
            </p>
          )}
        </div>
      </div>
    </AppModal>
  );
}
