"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { createClient } from "@/app/lib/supabase/client";

export function MfaVerifyModal({ open }: { open: boolean }) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setPending(false);
    void (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find(
        (item: { status: string; id: string }) => item.status === "verified",
      );
      setFactorId(verified?.id ?? null);
    })();
  }, [open]);

  const dirty = code.trim().length > 0;
  const canConfirm = !pending && Boolean(factorId) && code.trim().length >= 6;

  function leaveAdmin() {
    router.push("/dashboard");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canConfirm || !factorId) return;

    setPending(true);
    const supabase = createClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error || !challenge.data) {
      setPending(false);
      showFeedback({
        type: "error",
        text: t("errors.mfa_invalid", "MFA iestatīšana neizdevās."),
      });
      return;
    }

    const verified = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setPending(false);
    if (verified.error) {
      showFeedback({
        type: "error",
        text: t("errors.mfa_invalid", "MFA iestatīšana neizdevās."),
      });
      return;
    }

    router.refresh();
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) leaveAdmin();
      }}
      title={t("auth.mfa.title", "Divfaktoru autentifikācija")}
      description={t(
        "auth.mfa.subtitle",
        "Administrācijas panelim nepieciešams TOTP kods (Authenticator).",
      )}
      dirty={dirty}
      blocking={pending}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-amber-700">
          {t(
            "auth.mfa.verify_session",
            "Ievadi Authenticator kodu, lai apstiprinātu šo sesiju.",
          )}
        </p>
        <label className="block" htmlFor="admin-mfa-code">
          <span className="text-sm font-semibold text-zinc-700">
            {t("auth.mfa.code", "Kods")}
          </span>
          <input
            id="admin-mfa-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={pending}
            onClick={leaveAdmin}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {t("auth.mfa.verify", "Apstiprināt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
