"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OtpCodeInput } from "@/app/components/otp-code-input";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { createClient } from "@/app/lib/supabase/client";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function MfaSettingsCard() {
  const { t } = useTranslations();
  const { isAdmin } = useIsAdmin();
  const searchParams = useSearchParams();
  const { showFeedback } = useFeedbackToast();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [code, setCode] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  const [otpNonce, setOtpNonce] = useState(0);
  const factorIdRef = useRef<string | null>(null);
  const verifyingRef = useRef(false);

  const reason = searchParams.get("mfa");
  const codeLabelId = useId();
  factorIdRef.current = factorId;

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find(
        (item: { status: string; id: string }) => item.status === "verified",
      );
      setEnabled(Boolean(verified));
      if (verified) setFactorId(verified.id);
    })();
  }, []);

  async function enroll() {
    setPending(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "TASQIN",
    });
    setPending(false);
    if (error || !data) {
      showFeedback({
        type: "error",
        text: t("errors.mfa_invalid", "MFA iestatīšana neizdevās."),
      });
      return;
    }
    setFactorId(data.id);
    setSecret(data.totp.secret);
    setQr(data.totp.qr_code.startsWith("data:") ? data.totp.qr_code : "");
  }

  async function verify(raw?: string) {
    const digits = (raw ?? code).replace(/\D/g, "").slice(0, 6);
    const currentFactorId = factorIdRef.current;
    if (!currentFactorId || digits.length < 6 || verifyingRef.current) return;

    verifyingRef.current = true;
    setPending(true);
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: currentFactorId });
    if (challenge.error || !challenge.data) {
      verifyingRef.current = false;
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
    setPending(false);
    if (verified.error) {
      verifyingRef.current = false;
      setCode("");
      setOtpNonce((value) => value + 1);
      showFeedback({
        type: "error",
        text: t("errors.mfa_code_invalid", "Nepareizs kods. Mēģini vēlreiz."),
      });
      return;
    }
    verifyingRef.current = false;
    setEnabled(true);
    setQr("");
    setSecret("");
    setCode("");
    showFeedback({
      type: "success",
      text: t("auth.mfa.enabled", "Divfaktoru autentifikācija ir ieslēgta."),
    });
  }

  async function unenroll() {
    if (!factorId) return;
    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setPending(false);
    if (error) {
      showFeedback({
        type: "error",
        text: t("errors.mfa_invalid", "MFA iestatīšana neizdevās."),
      });
      return;
    }
    setEnabled(false);
    setFactorId(null);
  }

  const showCode = Boolean(secret) || (enabled && reason === "verify");
  const showActions = (enabled && reason !== "verify") || (!enabled && !secret);

  return (
    <div className="space-y-3 rounded-3xl border border-zinc-200 bg-white px-5 py-6">
      <h2 className="text-sm font-semibold text-zinc-900">
        {t("auth.mfa.title", "Divfaktoru autentifikācija")}
      </h2>
      <p className="text-sm text-zinc-500">
        {t(
          "auth.mfa.subtitle",
          "Papildu solis pie ielogošanās ar Authenticator lietotni (TOTP).",
        )}
      </p>
      {isAdmin ? (
        <p className="text-sm text-zinc-500">
          {t(
            "auth.mfa.admin_note",
            "Administrācijas panelim MFA ir obligāta.",
          )}
        </p>
      ) : null}
      {reason === "required" ? (
        <p className="text-sm text-amber-700">
          {t(
            "auth.mfa.required",
            "Lai atvērtu administrāciju, vispirms ieslēdz MFA.",
          )}
        </p>
      ) : null}
      {reason === "verify" ? (
        <p className="text-sm text-amber-700">
          {t(
            "auth.mfa.verify_session",
            "Ievadi Authenticator kodu, lai apstiprinātu šo sesiju.",
          )}
        </p>
      ) : null}
      {qr ? (
        <img src={qr} alt={t("auth.mfa.qr_alt", "MFA QR kods")} className="h-40 w-40" />
      ) : null}
      {secret ? (
        <p className="text-sm text-zinc-600">
          {t("auth.mfa.secret", "Noslēpums")}: <code>{secret}</code>
        </p>
      ) : null}
      {showCode ? (
        <div className="block" aria-busy={pending}>
          <span
            id={codeLabelId}
            className="block text-center text-sm font-semibold text-zinc-700"
          >
            {t("auth.mfa.code", "Kods")}
          </span>
          <OtpCodeInput
            key={otpNonce}
            id="mfa-settings-code"
            value={code}
            onChange={setCode}
            onComplete={(next) => void verify(next)}
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
      ) : null}
      {showActions ? (
        <div className="flex gap-2">
          {enabled && reason !== "verify" ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void unenroll()}
              className="rounded-xl border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
            >
              {t("auth.mfa.unenroll", "Izslēgt MFA")}
            </button>
          ) : null}
          {!enabled && !secret ? (
            <button
              type="button"
              disabled={pending}
              onClick={() => void enroll()}
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
            >
              {t("auth.mfa.enroll", "Ieslēgt MFA")}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
