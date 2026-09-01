"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/app/components/app-modal";
import { IconActionButton } from "@/app/components/icon-action-button";
import { OtpCodeInput } from "@/app/components/otp-code-input";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { getSafeRedirectPath } from "@/app/lib/security/safe-redirect-path";
import { signOutWebsiteLocally } from "@/app/lib/auth/sign-out-website";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

function onlyDigits(raw: string) {
  return raw.replace(/\D/g, "").slice(0, 6);
}

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
  const { showFeedback } = useFeedbackToast();
  const codeLabelId = useId();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [otpNonce, setOtpNonce] = useState(0);
  const factorIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);
  const queuedCodeRef = useRef<string | null>(null);

  const isLogin = mode === "login";
  factorIdRef.current = factorId;

  useEffect(() => {
    if (!open) return;
    setCode("");
    setPending(false);
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
    setPending(true);
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error || !challenge.data) {
      verifyingRef.current = false;
      queuedCodeRef.current = null;
      setPending(false);
      setCode("");
      setOtpNonce((value) => value + 1);
      showFeedback({
        type: "error",
        text: t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz."),
      });
      return;
    }

    const verified = await supabase.auth.mfa.verify({
      factorId: currentFactorId,
      challengeId: challenge.data.id,
      code: digits,
    });
    if (verified.error) {
      verifyingRef.current = false;
      queuedCodeRef.current = null;
      setPending(false);
      setCode("");
      setOtpNonce((value) => value + 1);
      showFeedback({
        type: "error",
        text: t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz."),
      });
      return;
    }

    if (isLogin) {
      showFeedback({
        type: "success",
        text: t("auth.login.success", "Veiksmīgi ienāci."),
      });
      if (nextPath) {
        router.push(getSafeRedirectPath(nextPath));
      }
    }
    if (onVerified) {
      onVerified();
      return;
    }
    router.refresh();
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
        <div className="block" aria-busy={pending}>
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
          {pending ? (
            <p className="mt-3 flex items-center justify-center gap-2 text-sm text-zinc-500">
              <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
              {t("common.loading", "Ielādē…")}
            </p>
          ) : null}
        </div>
      </div>
    </AppModal>
  );
}
