"use client";

import { useMemo, useState, useTransition } from "react";
import { saveSiteSettingsAction } from "@/app/(app)/admin/actions";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { formatDisplayDateDdMmYy } from "@/app/lib/format-display-date";
import type { SiteLanguageSummary, SiteSettingsInput, SiteSettingsSummary } from "@/app/lib/site-admin/types";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";

function emptyValues(languages: SiteLanguageSummary[]): Record<string, string> {
  return Object.fromEntries(languages.map((language) => [language.code, ""]));
}

function mergeSloganValues(
  languages: SiteLanguageSummary[],
  values: Record<string, string>,
): Record<string, string> {
  const next = emptyValues(languages);
  for (const [code, value] of Object.entries(values)) {
    next[code] = value;
  }
  return next;
}

function toInput(
  settings: SiteSettingsSummary,
  languages: SiteLanguageSummary[],
): SiteSettingsInput {
  return {
    systemName: settings.systemName,
    sloganValues: mergeSloganValues(languages, settings.sloganValues),
  };
}

export function AdminSettingsForm({
  initialSettings,
  languages,
}: {
  initialSettings: SiteSettingsSummary;
  languages: SiteLanguageSummary[];
}) {
  const [settings, setSettings] = useState(() => toInput(initialSettings, languages));
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [editLang, setEditLang] = useState(
    () => languages.find((language) => language.isDefault)?.code ?? languages[0]?.code ?? "lv",
  );
  const [isPending, startTransition] = useTransition();
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t, languageCode } = useTranslations();
  const savedInput = useMemo(
    () => toInput(savedSettings, languages),
    [savedSettings, languages],
  );
  const hasChanges =
    settings.systemName !== savedInput.systemName ||
    JSON.stringify(settings.sloganValues) !== JSON.stringify(savedInput.sloganValues);

  const previewSlogan =
    settings.sloganValues[languageCode]?.trim() ||
    settings.sloganValues[editLang]?.trim() ||
    "—";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (!hasChanges) return;

    startTransition(async () => {
      const result = await saveSiteSettingsAction(settings);
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setSavedSettings({
        systemName: settings.systemName,
        sloganValues: settings.sloganValues,
        updatedAt: new Date().toISOString(),
      });
      showFeedback({
        type: "success",
        text: t("site_settings.feedback.saved", "Sistēmas uzstādījumi saglabāti."),
      });
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
      >
        <fieldset disabled={isPending} className="space-y-5 disabled:opacity-80">
          <div>
            <label htmlFor="systemName" className={labelClassName}>
              {t("site_settings.form.system_name", "Sistēmas nosaukums")}
            </label>
            <input
              id="systemName"
              value={settings.systemName}
              onChange={(event) =>
                setSettings((current) => ({ ...current, systemName: event.target.value }))
              }
              className={fieldClassName}
              placeholder={t("app.name", "Routine")}
            />
          </div>

          <div>
            <label htmlFor="slogan" className={labelClassName}>
              {t("site_settings.form.slogan", "Slogans")}
              {languages.length > 1 ? (
                <span className="ml-1 font-mono text-xs uppercase text-zinc-400">
                  ({editLang})
                </span>
              ) : null}
            </label>
            <p className="mt-1 text-xs text-zinc-500">
              {t(
                "site_settings.form.slogan_hint",
                "Norādi sloganu katrai sistēmas valodai.",
              )}
            </p>
            {languages.length > 1 ? (
              <div
                role="tablist"
                aria-label={t("admin.nav.languages", "Valodas")}
                className="mt-2 flex flex-wrap gap-2"
              >
                {languages.map((language) => {
                  const active = language.code === editLang;
                  return (
                    <button
                      key={language.code}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setEditLang(language.code)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                      }`}
                    >
                      <span>{language.name}</span>
                      <span
                        className={`font-mono text-[11px] uppercase ${
                          active ? "text-zinc-300" : "text-zinc-400"
                        }`}
                      >
                        {language.code}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            <textarea
              id="slogan"
              value={settings.sloganValues[editLang] ?? ""}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  sloganValues: {
                    ...current.sloganValues,
                    [editLang]: event.target.value,
                  },
                }))
              }
              rows={3}
              className={`${fieldClassName} resize-y`}
            />
          </div>

          <div className="flex justify-end border-t border-zinc-100 pt-5">
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

      <aside className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {t("site_settings.preview.title", "Priekšskatījums")}
        </p>
        <div className="mt-3 min-w-0">
          <h2 className="truncate text-lg font-semibold text-zinc-900">
            {settings.systemName || "—"}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{previewSlogan}</p>
        </div>
        <div className="mt-5 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
          {t(
            "site_settings.preview.description",
            "Šīs vērtības tiek izmantotas pārlūka virsrakstā un lapas apraksta metadatos.",
          )}
        </div>
        {savedSettings.updatedAt ? (
          <p className="mt-4 text-xs text-zinc-400">
            {t("site_settings.preview.last_saved", "Pēdējās saglabātās izmaiņas:")}{" "}
            {formatDisplayDateDdMmYy(savedSettings.updatedAt) || "—"}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
