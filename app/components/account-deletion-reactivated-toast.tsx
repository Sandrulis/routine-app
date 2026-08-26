"use client";

import { useEffect } from "react";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { ACCOUNT_DELETION_REACTIVATED_COOKIE } from "@/app/lib/users/account-deletion-cookie";

export function AccountDeletionReactivatedToast() {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();

  useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((entry) => entry.startsWith(`${ACCOUNT_DELETION_REACTIVATED_COOKIE}=1`));
    if (!hasCookie) {
      return;
    }

    document.cookie = `${ACCOUNT_DELETION_REACTIVATED_COOKIE}=; Max-Age=0; path=/`;
    showFeedback({
      type: "success",
      text: t(
        "profile.deletion.reactivated_toast",
        "Konta dzēšana ir atcelta. Tavs konts atkal ir aktīvs.",
      ),
    });
  }, [showFeedback, t]);

  return null;
}
