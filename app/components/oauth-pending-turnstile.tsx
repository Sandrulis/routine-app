"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppModal } from "@/app/components/app-modal";
import { authPrimaryButtonClassName } from "@/app/components/auth-form-styles";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/app/components/turnstile-widget";
import { useTranslations } from "@/app/components/translations-provider";
import { completePendingGoogleOAuthAction } from "@/app/lib/auth/actions";
import { translateActionError } from "@/app/lib/i18n/action-errors";

export function OAuthPendingTurnstileModal({
  open,
  siteKey,
  onOpenChange,
}: {
  open: boolean;
  siteKey: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const [pending, setPending] = useState(false);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    if (!open) {
      setPending(false);
      setTokenReady(false);
    }
  }, [open]);

  async function handleContinue() {
    clearFeedback();
    const token = turnstileRef.current?.getToken() ?? null;
    if (!token) {
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
    const result = await completePendingGoogleOAuthAction({
      turnstileToken: token,
    });
    setPending(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
      });
      turnstileRef.current?.reset();
      setTokenReady(false);
      return;
    }
    onOpenChange(false);
    router.push(result.next);
    router.refresh();
  }

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
      blocking={pending}
      title={t("auth.turnstile.modal_title", "Botu pārbaude")}
      description={t(
        "auth.turnstile.google_pending",
        "Lai turpinātu ar Google bez komandas, apstiprini, ka neesi robots.",
      )}
    >
      <div className="space-y-4">
        {open ? (
          <TurnstileWidget
            ref={turnstileRef}
            siteKey={siteKey}
            onTokenChange={(token) => setTokenReady(Boolean(token))}
          />
        ) : null}
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="button"
            disabled={pending || !tokenReady}
            onClick={() => void handleContinue()}
            className={authPrimaryButtonClassName}
          >
            {pending
              ? t("auth.google.signing_in", "Pieslēdzas...")
              : t("actions.continue", "Turpināt")}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
