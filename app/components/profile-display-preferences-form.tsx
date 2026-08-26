"use client";

import { useMemo, useState, useTransition } from "react";
import { DisplayPreferencesFields } from "@/app/components/display-preferences-fields";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useUnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { previewDisplayDate } from "@/app/lib/format-display-date";
import {
  EMPTY_USER_DISPLAY_PREFERENCES,
  mergeDisplayPreferences,
  userDisplayPreferencesEqual,
  type SiteDisplayPreferences,
  type UserDisplayPreferences,
} from "@/app/lib/site-admin/display-preferences";
import { saveUserDisplayPreferencesAction } from "@/app/lib/users/actions";

export function ProfileDisplayPreferencesForm({
  systemDefaults,
  systemTimezone,
  initialUserPreferences,
}: {
  systemDefaults: SiteDisplayPreferences;
  systemTimezone: string;
  initialUserPreferences: UserDisplayPreferences;
}) {
  const [preferences, setPreferences] = useState(initialUserPreferences);
  const [savedPreferences, setSavedPreferences] = useState(initialUserPreferences);
  const [isPending, startTransition] = useTransition();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t } = useTranslations();
  const hasChanges = !userDisplayPreferencesEqual(preferences, savedPreferences);
  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty: hasChanges,
  });

  const effectivePreview = useMemo(
    () =>
      previewDisplayDate({
        ...mergeDisplayPreferences(systemDefaults, preferences),
        timeZone: preferences.timezone?.trim() || systemTimezone,
      }),
    [preferences, systemDefaults, systemTimezone],
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (!hasChanges) return;

    startTransition(async () => {
      const result = await saveUserDisplayPreferencesAction(preferences);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setSavedPreferences(preferences);
      showFeedback({
        type: "success",
        text: t("profile.display.feedback.saved", "Personīgie attēlojuma uzstādījumi saglabāti."),
      });
    });
  }

  function handleReset() {
    clearFeedback();
    setPreferences(EMPTY_USER_DISPLAY_PREFERENCES);
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-zinc-200 bg-white px-5 py-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              {t("profile.display.title", "Datumi un laiks")}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {t(
                "profile.display.description",
                "Pielāgo datumu, laika un kalendāra attēlojumu sev. Tukšs lauks nozīmē sistēmas noklusējumu.",
              )}
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={handleReset}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("profile.display.reset", "Atiestatīt uz sistēmas noklusējumu")}
          </button>
        </div>

        <fieldset disabled={isPending} className="mt-5 disabled:opacity-80">
          <DisplayPreferencesFields
            idPrefix="profile-display"
            values={preferences}
            onChange={setPreferences}
            systemDefaults={systemDefaults}
            allowSystemDefault
            disabled={isPending}
            includeTimezone
            systemTimezone={systemTimezone}
          />

          <div className="mt-5 space-y-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
            <p className="font-medium text-zinc-700">
              {t("site_settings.preview.title", "Priekšskatījums")}
            </p>
            <p>
              {t("site_settings.preview.date", "Datums:")} {effectivePreview.date}
            </p>
            <p>
              {t("site_settings.preview.time", "Laiks:")} {effectivePreview.time}
            </p>
            <p>
              {t("site_settings.preview.datetime", "Datums un laiks:")}{" "}
              {effectivePreview.datetime}
            </p>
          </div>

          <div className="mt-5 flex justify-end border-t border-zinc-100 pt-5">
            <button
              type="submit"
              disabled={isPending || !hasChanges}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <i className="fas fa-circle-notch fa-spin text-xs" aria-hidden="true" />
              ) : null}
              {isPending ? t("actions.saving", "Saglabā…") : t("actions.save", "Saglabāt")}
            </button>
          </div>
        </fieldset>
      </form>

      <UnsavedChangesConfirmModal
        open={confirmOpen}
        onStay={stayOnPage}
        onLeave={confirmLeave}
      />
    </>
  );
}
