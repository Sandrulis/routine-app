"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { requestAccountDeletionAction } from "@/app/lib/users/actions";

export function AccountDeletionSection() {
  const { t } = useTranslations();
  const router = useRouter();
  const { showFeedback } = useFeedbackToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDeleteRequest() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await requestAccountDeletionAction();
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }
      router.push("/login");
      router.refresh();
    } finally {
      setIsDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-red-200 bg-white px-5 py-6">
        <h2 className="text-sm font-semibold text-zinc-900">
          {t("profile.deletion.title", "Dzēst kontu")}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {t(
            "profile.deletion.description",
            "Tavs profils tiks deaktivizēts uz 30 dienām. Pēc termiņa visi ar tevi saistītie dati tiks neatgriezeniski izdzēsti.",
          )}
        </p>
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {t(
            "profile.deletion.reactivate_on_login",
            "Ja pēc deaktivizācijas atkārtoti ienāksi sistēmā, konts automātiski tiks aktivizēts un dzēšana tiks atcelta.",
          )}
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isDeleting}
          className="mt-4 inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isDeleting ? (
            <>
              <i className="fas fa-spinner fa-spin text-xs" aria-hidden="true" />
              {t("profile.deletion.deleting", "Apstrādā…")}
            </>
          ) : (
            <>
              <i className="fas fa-trash text-xs" aria-hidden="true" />
              {t("profile.deletion.button", "Dzēst manu kontu")}
            </>
          )}
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t("profile.deletion.confirm_title", "Dzēst kontu?")}
        description={t(
          "profile.deletion.confirm_description",
          "Tavs profils tiks deaktivizēts uz 30 dienām un tu tiksi izlogots. Ja atkārtoti ienāksi, konts automātiski aktivizēsies un dzēšana tiks atcelta. Pēc 30 dienām bez atkārtotas pieslēgšanās visi dati tiks neatgriezeniski izdzēsti.",
        )}
        confirmLabel={t("profile.deletion.button", "Dzēst manu kontu")}
        confirmVariant="danger"
        blocking={isDeleting}
        onConfirm={() => void handleDeleteRequest()}
      />
    </>
  );
}
