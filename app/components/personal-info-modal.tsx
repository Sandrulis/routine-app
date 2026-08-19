"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { createClient } from "@/app/lib/supabase/client";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { useTeam } from "@/app/lib/team-store";
import type { TeamMember } from "@/app/lib/team";
import {
  joinDisplayName,
  readPersonalNameFromMetadata,
} from "@/app/lib/users/display-name";
import { saveUserPersonalInfoAction } from "@/app/lib/users/actions";

export function PersonalInfoModal({
  open,
  onOpenChange,
  user,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: TeamMember;
  onSave: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { user: authUser } = useAuthSession();
  const { refreshTeams } = useTeam();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savedFirstName, setSavedFirstName] = useState("");
  const [savedLastName, setSavedLastName] = useState("");
  const [pending, setPending] = useState(false);

  const initialNames = useMemo(
    () =>
      readPersonalNameFromMetadata(
        (authUser?.user_metadata ?? undefined) as Record<string, unknown> | undefined,
        user.name,
      ),
    [authUser?.user_metadata, user.name],
  );

  useEffect(() => {
    if (!open) return;
    setFirstName(initialNames.firstName);
    setLastName(initialNames.lastName);
    setSavedFirstName(initialNames.firstName);
    setSavedLastName(initialNames.lastName);
    setPending(false);
  }, [initialNames.firstName, initialNames.lastName, open]);

  const dirty =
    firstName.trim() !== savedFirstName.trim() ||
    lastName.trim() !== savedLastName.trim();
  const canSave =
    !pending &&
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    dirty;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !canSave) return;

    setPending(true);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      const result = await saveUserPersonalInfoAction({
        firstName: trimmedFirst,
        lastName: trimmedLast,
      });

      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
        return;
      }

      const fullName = joinDisplayName(trimmedFirst, trimmedLast);
      if (isSupabaseConfigured()) {
        const { error } = await createClient().auth.updateUser({
          data: {
            given_name: trimmedFirst,
            family_name: trimmedLast,
            name: fullName,
            full_name: fullName,
          },
        });
        if (error) {
          showFeedback({
            type: "error",
            text: t("errors.user_profile_failed", "Neizdevās saglabāt profilu."),
          });
          return;
        }
      }

      setSavedFirstName(trimmedFirst);
      setSavedLastName(trimmedLast);
      await refreshTeams();
      router.refresh();
      onSave();
      onOpenChange(false);
    } catch {
      showFeedback({
        type: "error",
        text: t("errors.user_profile_failed", "Neizdevās saglabāt profilu."),
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("user_menu.personal_info", "Personīgā informācija")}
      description={t(
        "user_menu.personal_info.description",
        "Atjauno savu vārdu un uzvārdu.",
      )}
      dirty={dirty}
      blocking={pending}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="personal-info-first-name"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("profile.personal.first_name", "Vārds")}
          </label>
          <input
            id="personal-info-first-name"
            type="text"
            autoComplete="given-name"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
            autoFocus
          />
        </div>
        <div>
          <label
            htmlFor="personal-info-last-name"
            className="text-sm font-semibold text-zinc-700"
          >
            {t("profile.personal.last_name", "Uzvārds")}
          </label>
          <input
            id="personal-info-last-name"
            type="text"
            autoComplete="family-name"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {pending
              ? t("actions.saving", "Saglabā…")
              : t("actions.save", "Saglabāt")}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
