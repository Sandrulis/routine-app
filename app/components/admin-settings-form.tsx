"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { saveSiteSettingsAction } from "@/app/(app)/admin/actions";
import { BrandingImageField } from "@/app/components/branding-image-field";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ListAppearancePicker } from "@/app/components/list-appearance-picker";
import { ListBadge } from "@/app/components/list-badge";
import { TimezoneSelectField } from "@/app/components/timezone-select-field";
import { useUnsavedChangesGuard } from "@/app/components/unsaved-changes-guard";
import { UnsavedChangesConfirmModal } from "@/app/components/unsaved-changes-confirm-modal";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { previewDisplayDate } from "@/app/lib/format-display-date";
import {
  siteDisplayPreferencesEqual,
  type SiteDateFormat,
  type SiteDateSeparator,
  type SiteTimeFormat,
  type WeekStartDay,
} from "@/app/lib/site-admin/display-preferences";
import type { SiteLanguageSummary, SiteSettingsInput, SiteSettingsSummary } from "@/app/lib/site-admin/types";
import type { SimpleIntegrationStatus } from "@/app/lib/integrations/types";
import Link from "next/link";

const fieldClassName =
  "mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-800";
const hintClassName = "mt-1.5 text-xs text-zinc-500";
const sectionTitleClassName = "text-sm font-semibold text-zinc-900";

const DATE_FORMATS: SiteDateFormat[] = ["Y-m-d", "d-m-Y", "d/m/Y", "m/d/Y", "d.m.Y"];
const DATE_SEPARATOR_LABEL_KEYS: Record<SiteDateSeparator, string> = {
  ".": "site_settings.form.date_separator.dot",
  "-": "site_settings.form.date_separator.dash",
  "/": "site_settings.form.date_separator.slash",
  " ": "site_settings.form.date_separator.space",
};
const DATE_SEPARATORS = Object.keys(DATE_SEPARATOR_LABEL_KEYS) as SiteDateSeparator[];
const TIME_FORMATS: SiteTimeFormat[] = ["24", "12"];
const WEEK_START_DAYS: WeekStartDay[] = ["monday", "sunday"];

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
    legalEmail: settings.legalEmail,
    legalEntityName: settings.legalEntityName,
    legalEntityRegNo: settings.legalEntityRegNo,
    legalEntityAddress: settings.legalEntityAddress,
    sloganValues: mergeSloganValues(languages, settings.sloganValues),
    timezone: settings.timezone,
    displayPreferences: settings.displayPreferences,
    logoUrl: settings.logoUrl,
    faviconUrl: settings.faviconUrl,
    logoColor: settings.logoColor,
  };
}

export function AdminSettingsForm({
  initialSettings,
  languages,
  resend,
}: {
  initialSettings: SiteSettingsSummary;
  languages: SiteLanguageSummary[];
  resend: SimpleIntegrationStatus;
}) {
  const [settings, setSettings] = useState(() => toInput(initialSettings, languages));
  const [savedSettings, setSavedSettings] = useState(initialSettings);
  const [resendFromEmail, setResendFromEmail] = useState(resend.clientId);
  const [resendReplyToEmail, setResendReplyToEmail] = useState(resend.replyToEmail);
  const [savedResend, setSavedResend] = useState(resend);
  const [editLang, setEditLang] = useState(
    () => languages.find((language) => language.isDefault)?.code ?? languages[0]?.code ?? "lv",
  );
  const [isPending, startTransition] = useTransition();
  const badgeRef = useRef<HTMLButtonElement>(null);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const { showFeedback, clearFeedback } = useFeedbackToast();
  const { t, languageCode } = useTranslations();
  const { formatDateTime } = useDisplayPreferences();
  const savedInput = useMemo(
    () => toInput(savedSettings, languages),
    [savedSettings, languages],
  );
  const hasChanges =
    settings.systemName !== savedInput.systemName ||
    settings.legalEmail !== savedInput.legalEmail ||
    settings.legalEntityName !== savedInput.legalEntityName ||
    settings.legalEntityRegNo !== savedInput.legalEntityRegNo ||
    settings.legalEntityAddress !== savedInput.legalEntityAddress ||
    settings.timezone !== savedInput.timezone ||
    JSON.stringify(settings.sloganValues) !== JSON.stringify(savedInput.sloganValues) ||
    !siteDisplayPreferencesEqual(settings.displayPreferences, savedInput.displayPreferences) ||
    settings.logoUrl !== savedInput.logoUrl ||
    settings.faviconUrl !== savedInput.faviconUrl ||
    settings.logoColor !== savedInput.logoColor ||
    resendFromEmail.trim() !== savedResend.clientId.trim() ||
    resendReplyToEmail.trim() !== savedResend.replyToEmail.trim();
  const { confirmOpen, stayOnPage, confirmLeave } = useUnsavedChangesGuard({
    isDirty: hasChanges,
  });

  const previewSlogan =
    settings.sloganValues[languageCode]?.trim() ||
    settings.sloganValues[editLang]?.trim() ||
    "—";
  const displayPreview = previewDisplayDate({
    ...settings.displayPreferences,
    timeZone: settings.timezone,
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();
    if (!hasChanges) return;

    startTransition(async () => {
      const result = await saveSiteSettingsAction(
        settings,
        savedResend.configured
          ? { fromEmail: resendFromEmail, replyToEmail: resendReplyToEmail }
          : undefined,
      );
      if (!result.ok) {
        showFeedback({ type: "error", text: translateActionError(t, result.error) });
        return;
      }

      setSavedSettings({
        systemName: settings.systemName,
        legalEmail: settings.legalEmail,
        legalEntityName: settings.legalEntityName,
        legalEntityRegNo: settings.legalEntityRegNo,
        legalEntityAddress: settings.legalEntityAddress,
        sloganValues: settings.sloganValues,
        timezone: settings.timezone,
        displayPreferences: settings.displayPreferences,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        logoColor: settings.logoColor,
        updatedAt: new Date().toISOString(),
      });
      setSavedResend((current) => ({
        ...current,
        clientId: resendFromEmail.trim(),
        replyToEmail: resendReplyToEmail.trim(),
      }));
      showFeedback({
        type: "success",
        text: t("site_settings.feedback.saved", "Sistēmas uzstādījumi saglabāti."),
      });
    });
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-6"
        >
          <fieldset disabled={isPending} className="space-y-8 disabled:opacity-80">
            <div className="space-y-5">
              <div>
                <label htmlFor="systemName" className={labelClassName}>
                  {t("site_settings.form.system_name", "Sistēmas nosaukums")}
                </label>
                <div className="mt-2 flex items-start gap-2">
                  <button
                    ref={badgeRef}
                    type="button"
                    aria-label={t("lists.fields.color", "Krāsa")}
                    aria-expanded={appearanceOpen}
                    onClick={() => setAppearanceOpen((current) => !current)}
                    className="shrink-0 rounded-xl ring-offset-2 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-400"
                  >
                    <ListBadge
                      name={settings.systemName.trim() || t("app.name", "{SYSTEM_NAME}")}
                      icon={null}
                      color={settings.logoColor}
                      logoUrl={settings.logoUrl}
                      size="lg"
                    />
                  </button>
                  <input
                    id="systemName"
                    value={settings.systemName}
                    onChange={(event) =>
                      setSettings((current) => ({ ...current, systemName: event.target.value }))
                    }
                    className="min-h-11 w-full flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                    placeholder={t("app.name", "{SYSTEM_NAME}")}
                  />
                </div>
                <p className={hintClassName}>
                  {t(
                    "site_settings.form.logo_color_hint",
                    "Ja logotips nav augšupielādēts, avatārs rāda sistēmas iniciāļus ar izvēlēto fonu.",
                  )}
                </p>
                <ListAppearancePicker
                  open={appearanceOpen}
                  triggerRef={badgeRef}
                  name={settings.systemName.trim() || t("app.name", "{SYSTEM_NAME}")}
                  icon={null}
                  color={settings.logoColor}
                  showIcons={false}
                  onIconChange={() => undefined}
                  onColorChange={(logoColor) =>
                    setSettings((current) => ({ ...current, logoColor }))
                  }
                  onClose={() => setAppearanceOpen(false)}
                />
              </div>

              <div>
                <label htmlFor="legalEmail" className={labelClassName}>
                  {t("site_settings.form.legal_email", "Juridiskais e-pasts")}
                </label>
                <input
                  id="legalEmail"
                  type="email"
                  autoComplete="email"
                  value={settings.legalEmail}
                  onChange={(event) =>
                    setSettings((current) => ({ ...current, legalEmail: event.target.value }))
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
                <p className={hintClassName}>
                  {t(
                    "site_settings.form.legal_email_hint",
                    "Šo adresi rāda privātuma politikā saziņai par datu apstrādi un noteikumos.",
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="legalEntityName" className={labelClassName}>
                  {t("site_settings.form.legal_entity_name", "Juridiskās personas nosaukums")}
                </label>
                <input
                  id="legalEntityName"
                  type="text"
                  value={settings.legalEntityName}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      legalEntityName: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                />
                <p className={hintClassName}>
                  {t(
                    "site_settings.form.legal_entity_name_hint",
                    "Piem., SIA nosaukums. Rāda privātuma politikā kā datu pārzini.",
                  )}
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="legalEntityRegNo" className={labelClassName}>
                    {t("site_settings.form.legal_entity_reg_no", "Reģistrācijas numurs")}
                  </label>
                  <input
                    id="legalEntityRegNo"
                    type="text"
                    value={settings.legalEntityRegNo}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        legalEntityRegNo: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
                <div>
                  <label htmlFor="legalEntityAddress" className={labelClassName}>
                    {t("site_settings.form.legal_entity_address", "Juridiskā adrese")}
                  </label>
                  <input
                    id="legalEntityAddress"
                    type="text"
                    value={settings.legalEntityAddress}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        legalEntityAddress: event.target.value,
                      }))
                    }
                    className="mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                <div>
                  <p className={sectionTitleClassName}>
                    {t("site_settings.form.resend_title", "Resend e-pasts")}
                  </p>
                  <p className={hintClassName}>
                    {t(
                      "site_settings.form.resend_hint",
                      "Vēstules tiek sūtītas no From adreses; atbildes saņem Reply-To adrese.",
                    )}
                  </p>
                </div>
                {savedResend.configured ? null : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {t(
                      "site_settings.form.resend_disabled",
                      "Resend nav konfigurēts, tāpēc e-pasti netiek sūtīti.",
                    )}{" "}
                    <Link
                      href="/admin/integrations"
                      className="font-semibold underline underline-offset-2"
                    >
                      {t("admin.nav.integrations", "Integrācijas")}
                    </Link>
                  </p>
                )}
                <div>
                  <label htmlFor="resendFromEmail" className={labelClassName}>
                    {t("integrations.resend.from_email", "From e-pasts")}
                  </label>
                  <input
                    id="resendFromEmail"
                    type="email"
                    value={resendFromEmail}
                    onChange={(event) => setResendFromEmail(event.target.value)}
                    disabled={!savedResend.configured}
                    placeholder="no-reply@tasqin.com"
                    className="mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <p className={hintClassName}>
                    {t(
                      "integrations.resend.from_hint",
                      "No šīs adreses sistēma sūta vēstules. Tai jābūt verificētā Resend domēnā.",
                    )}
                  </p>
                </div>
                <div>
                  <label htmlFor="resendReplyToEmail" className={labelClassName}>
                    {t("integrations.resend.reply_to", "Reply-To e-pasts")}
                  </label>
                  <input
                    id="resendReplyToEmail"
                    type="email"
                    value={resendReplyToEmail}
                    onChange={(event) => setResendReplyToEmail(event.target.value)}
                    disabled={!savedResend.configured}
                    placeholder="tasqin.com@gmail.com"
                    className="mt-2 min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100 disabled:cursor-not-allowed disabled:bg-zinc-100"
                    autoComplete="email"
                    spellCheck={false}
                  />
                  <p className={hintClassName}>
                    {t(
                      "integrations.resend.reply_to_hint",
                      "Atbildes uz vēstulēm iet uz šo adresi. Var būt Gmail vai cita publiska pastkaste.",
                    )}
                  </p>
                </div>
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

              <div className="grid items-start gap-5 sm:grid-cols-2">
                <BrandingImageField
                  id="systemLogo"
                  label={t("site_settings.form.logo", "Logotips")}
                  hint={t(
                    "site_settings.form.logo_hint",
                    "PNG, SVG, JPG vai WEBP līdz 1.5 MB. Rādās galvenē.",
                  )}
                  value={settings.logoUrl}
                  onChange={(logoUrl) =>
                    setSettings((current) => ({ ...current, logoUrl }))
                  }
                />
                <BrandingImageField
                  id="systemFavicon"
                  label={t("site_settings.form.favicon", "Favicon")}
                  hint={t(
                    "site_settings.form.favicon_hint",
                    "ICO, PNG vai SVG līdz 1.5 MB. Ja nav favicon, pārlūka cilnē lieto logotipu vai iniciāļu avatāru.",
                  )}
                  value={settings.faviconUrl}
                  onChange={(faviconUrl) =>
                    setSettings((current) => ({ ...current, faviconUrl }))
                  }
                />
              </div>
            </div>

            <div className="space-y-5 border-t border-zinc-100 pt-5">
              <div>
                <h3 className={sectionTitleClassName}>
                  {t("site_settings.form.display.title", "Datumi un laiks")}
                </h3>
                <p className="mt-1 text-xs text-zinc-500">
                  {t(
                    "site_settings.form.display.description",
                    "Noklusējuma formāts visā sistēmā: datumi, laiks un kalendāra nedēļas sākums.",
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="weekStartDay" className={labelClassName}>
                  {t("site_settings.form.week_start_day", "Nedēļas sākuma diena")}
                </label>
                <select
                  id="weekStartDay"
                  value={settings.displayPreferences.weekStartDay}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      displayPreferences: {
                        ...current.displayPreferences,
                        weekStartDay: event.target.value as WeekStartDay,
                      },
                    }))
                  }
                  className={fieldClassName}
                >
                  {WEEK_START_DAYS.map((value) => (
                    <option key={value} value={value}>
                      {t(`site_settings.form.week_start_day.${value}`, value)}
                    </option>
                  ))}
                </select>
                <p className={hintClassName}>
                  {t(
                    "site_settings.form.week_start_day_hint",
                    "Izvēlies, kura diena sākas nedēļa kalendāros.",
                  )}
                </p>
              </div>

              <div className="grid items-start gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="dateFormat" className={labelClassName}>
                    {t("site_settings.form.date_format", "Datuma formāts")}
                  </label>
                  <select
                    id="dateFormat"
                    value={settings.displayPreferences.dateFormat}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        displayPreferences: {
                          ...current.displayPreferences,
                          dateFormat: event.target.value as SiteDateFormat,
                        },
                      }))
                    }
                    className={fieldClassName}
                  >
                    {DATE_FORMATS.map((value) => (
                      <option key={value} value={value}>
                        {t(`site_settings.form.date_format.${value}`, value)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="dateSeparator" className={labelClassName}>
                    {t("site_settings.form.date_separator", "Datuma atdalītājs")}
                  </label>
                  <select
                    id="dateSeparator"
                    value={settings.displayPreferences.dateSeparator}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        displayPreferences: {
                          ...current.displayPreferences,
                          dateSeparator: event.target.value as SiteDateSeparator,
                        },
                      }))
                    }
                    className={fieldClassName}
                  >
                    {DATE_SEPARATORS.map((value) => (
                      <option key={value} value={value}>
                        {t(DATE_SEPARATOR_LABEL_KEYS[value], value)}
                      </option>
                    ))}
                  </select>
                  <p className={hintClassName}>
                    {t(
                      "site_settings.form.date_separator_hint",
                      "Atdalītājs starp datuma daļām attēlojumā.",
                    )}
                  </p>
                </div>
              </div>

              <div className="grid items-start gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="timeFormat" className={labelClassName}>
                    {t("site_settings.form.time_format", "Laika formāts")}
                  </label>
                  <select
                    id="timeFormat"
                    value={settings.displayPreferences.timeFormat}
                    onChange={(event) =>
                      setSettings((current) => ({
                        ...current,
                        displayPreferences: {
                          ...current.displayPreferences,
                          timeFormat: event.target.value as SiteTimeFormat,
                        },
                      }))
                    }
                    className={fieldClassName}
                  >
                    {TIME_FORMATS.map((value) => (
                      <option key={value} value={value}>
                        {t(`site_settings.form.time_format.${value}`, value)}
                      </option>
                    ))}
                  </select>
                  <p className={hintClassName}>
                    {t(
                      "site_settings.form.time_format_hint",
                      "Izvēlies starp 12 stundu (AM/PM) vai 24 stundu pulksteni.",
                    )}
                  </p>
                </div>

                <TimezoneSelectField
                  id="siteTimezone"
                  label={t("site_settings.form.timezone", "Servera laika josla")}
                  hint={t(
                    "site_settings.form.timezone_hint",
                    "Noklusējuma laika josla visai sistēmai un lietotājiem, kam nav sava iestatījuma.",
                  )}
                  value={settings.timezone}
                  onChange={(timezone) =>
                    setSettings((current) => ({
                      ...current,
                      timezone,
                    }))
                  }
                  disabled={isPending}
                />
              </div>
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
          <div className="mt-3 flex min-w-0 items-center gap-3">
            <ListBadge
              name={settings.systemName.trim() || t("app.name", "{SYSTEM_NAME}")}
              icon={null}
              color={settings.logoColor}
              logoUrl={settings.logoUrl || settings.faviconUrl}
              size="md"
            />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-zinc-900">
                {settings.systemName || "—"}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{previewSlogan}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-600">
            <p>
              <span className="font-medium text-zinc-700">
                {t("site_settings.preview.date", "Datums:")}
              </span>{" "}
              {displayPreview.date}
            </p>
            <p>
              <span className="font-medium text-zinc-700">
                {t("site_settings.preview.time", "Laiks:")}
              </span>{" "}
              {displayPreview.time}
            </p>
            <p>
              <span className="font-medium text-zinc-700">
                {t("site_settings.preview.datetime", "Datums un laiks:")}
              </span>{" "}
              {displayPreview.datetime}
            </p>
          </div>
          <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-xs text-zinc-500">
            {t(
              "site_settings.preview.description",
              "Šīs vērtības tiek izmantotas pārlūka virsrakstā, cilnes ikonā un lapas apraksta metadatos.",
            )}
          </div>
          {savedSettings.updatedAt ? (
            <p className="mt-4 text-xs text-zinc-400">
              {t("site_settings.preview.last_saved", "Pēdējās saglabātās izmaiņas:")}{" "}
              {formatDateTime(savedSettings.updatedAt) || "—"}
            </p>
          ) : null}
        </aside>
      </div>

      <UnsavedChangesConfirmModal
        open={confirmOpen}
        onStay={stayOnPage}
        onLeave={confirmLeave}
      />
    </>
  );
}
