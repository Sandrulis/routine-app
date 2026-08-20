"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { LoadingState } from "@/app/components/loading-state";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import {
  fetchCalendarIntegrationAction,
  regenerateCalendarFeedTokenAction,
  saveCalendarIntegrationAction,
} from "@/app/lib/calendar/actions";
import {
  calendarWebcalUrl,
  googleCalendarSubscribeUrl,
} from "@/app/lib/calendar/urls";
import type {
  CalendarIntegrationSummary,
  CalendarProvider,
} from "@/app/lib/calendar/types";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { translateActionError } from "@/app/lib/i18n/action-errors";

function feedHttpsUrl(feedPath: string | null): string {
  if (!feedPath || typeof window === "undefined") return "";
  return `${window.location.origin}${feedPath}`;
}

export function CalendarIntegrationModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { isEnabled } = useFrontendModules();
  const appleAvailable = isEnabled(FRONTEND_MODULE_KEYS.calendarApple);
  const googleAvailable = isEnabled(FRONTEND_MODULE_KEYS.calendarGoogle);
  const [summary, setSummary] = useState<CalendarIntegrationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setSummary(null);
      setLoading(false);
      setBusy(false);
      setRegenerateOpen(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchCalendarIntegrationAction()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setSummary({ enabled: false, provider: null, feedPath: null });
          showFeedback({
            type: "error",
            text: translateActionError(t, result.error),
          });
          return;
        }
        setSummary(result.data);
      })
      .catch(() => {
        if (cancelled) return;
        setSummary({ enabled: false, provider: null, feedPath: null });
        showFeedback({
          type: "error",
          text: t(
            "errors.calendar_load_failed",
            "Neizdevās ielādēt kalendāra integrāciju.",
          ),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, showFeedback, t]);

  const provider = useMemo<CalendarProvider | null>(() => {
    if (!summary) return null;
    if (summary.provider === "apple" && appleAvailable) return "apple";
    if (summary.provider === "google" && googleAvailable) return "google";
    if (appleAvailable && !googleAvailable) return "apple";
    if (googleAvailable && !appleAvailable) return "google";
    return summary.provider;
  }, [appleAvailable, googleAvailable, summary]);

  const httpsUrl = feedHttpsUrl(summary?.feedPath ?? null);
  const webcalUrl = httpsUrl ? calendarWebcalUrl(httpsUrl) : "";

  async function persist(next: {
    enabled: boolean;
    provider: CalendarProvider | null;
  }) {
    setBusy(true);
    const result = await saveCalendarIntegrationAction(next);
    setBusy(false);
    if (!result.ok) {
      showFeedback({
        type: "error",
        text: translateActionError(t, result.error),
      });
      return;
    }
    setSummary(result.data);
  }

  async function copyText(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      showFeedback({
        type: "success",
        text: t("calendar.integration.link_copied", "Kalendāra links nokopēts."),
      });
    } catch {
      showFeedback({
        type: "error",
        text: t("errors.clipboard_failed", "Neizdevās nokopēt linku."),
      });
    }
  }

  const providerCount = (appleAvailable ? 1 : 0) + (googleAvailable ? 1 : 0);
  const providerGridClassName =
    providerCount > 1 ? "grid gap-2 sm:grid-cols-2" : "grid gap-2 grid-cols-1";

  return (
    <>
      <AppModal
        open={open}
        onOpenChange={onOpenChange}
        panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
        title={t("calendar.integration.title", "Kalendāra integrācija")}
        description={t(
          "calendar.integration.description",
          "Parādi savā kalendārā piesaistītos uzdevumus, kuriem ir termiņš.",
        )}
      >
        {loading || !summary ? (
          <LoadingState compact className="justify-center py-6" />
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3.5 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
                <i className="fas fa-calendar-days text-[12px]" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-zinc-900">
                  {t("calendar.integration.enable", "Rādīt uzdevumus kalendārā")}
                </p>
                <p className="mt-0.5 text-[11.5px] leading-snug text-zinc-400">
                  {t(
                    "calendar.integration.enable_hint",
                    "Tikai uzdevumi, kuros esi piesaistīts un kuriem ir termiņš.",
                  )}
                </p>
              </div>
              <ToggleSwitch
                checked={summary.enabled}
                disabled={busy}
                label={t("calendar.integration.enable", "Rādīt uzdevumus kalendārā")}
                onChange={(checked) => {
                  const nextProvider =
                    provider ?? (appleAvailable ? "apple" : googleAvailable ? "google" : null);
                  void persist({ enabled: checked, provider: nextProvider });
                }}
              />
            </div>

            <div>
              <p className="mb-2 px-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
                {t("calendar.integration.choose", "Kurš kalendārs")}
              </p>
              <div className={providerGridClassName}>
                {appleAvailable ? (
                  <ProviderCard
                    selected={provider === "apple"}
                    disabled={busy}
                    icon="fa-apple"
                    title={t("calendar.provider.apple", "Apple Calendar")}
                    hint={t(
                      "calendar.provider.apple.hint",
                      "Abonē ar webcal vai .ics linku.",
                    )}
                    onSelect={() =>
                      void persist({
                        enabled: true,
                        provider: "apple",
                      })
                    }
                  />
                ) : null}
                {googleAvailable ? (
                  <ProviderCard
                    selected={provider === "google"}
                    disabled={busy}
                    icon="fa-google"
                    title={t("calendar.provider.google", "Google Calendar")}
                    hint={t(
                      "calendar.provider.google.hint",
                      "Abonē to pašu .ics plūsmu no URL.",
                    )}
                    onSelect={() =>
                      void persist({
                        enabled: true,
                        provider: "google",
                      })
                    }
                  />
                ) : null}
              </div>
            </div>

            {summary.enabled && summary.feedPath && provider === "apple" ? (
              <FeedBox
                label={t("calendar.integration.apple_link", "Apple .ics links")}
                value={webcalUrl}
                help={t(
                  "calendar.integration.apple_help",
                  "Kalendārs → Fails → Jauna kalendāra abonēšana, vai atver linku, lai pievienotu macOS Kalendāram.",
                )}
                copyLabel={t("actions.copy", "Kopēt")}
                onCopy={() => void copyText(webcalUrl)}
                actionLabel={t("calendar.integration.open_apple", "Atvērt Kalendārā")}
                onAction={() => {
                  window.location.href = webcalUrl;
                }}
                busy={busy}
              />
            ) : null}

            {summary.enabled && summary.feedPath && provider === "google" ? (
              <FeedBox
                label={t("calendar.integration.google_link", "Google .ics links")}
                value={httpsUrl}
                help={t(
                  "calendar.integration.google_help",
                  "Google Calendar → Citi kalendāri → plus → No URL. Google atjauno plūsmu ik pēc dažām stundām. Vietējam http:// localhost Google neabonēs.",
                )}
                copyLabel={t("actions.copy", "Kopēt")}
                onCopy={() => void copyText(httpsUrl)}
                actionLabel={t(
                  "calendar.integration.open_google",
                  "Pievienot Google Calendar",
                )}
                onAction={() => {
                  window.open(googleCalendarSubscribeUrl(httpsUrl), "_blank", "noopener,noreferrer");
                }}
                busy={busy}
              />
            ) : null}

            {summary.feedPath ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => setRegenerateOpen(true)}
                className="text-[12px] text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t(
                  "calendar.integration.regenerate",
                  "Izveidot jaunu linku",
                )}
              </button>
            ) : null}
          </div>
        )}
      </AppModal>

      <ConfirmModal
        open={regenerateOpen}
        onOpenChange={setRegenerateOpen}
        title={t(
          "calendar.integration.regenerate_title",
          "Izveidot jaunu kalendāra linku?",
        )}
        description={t(
          "calendar.integration.regenerate_description",
          "Vecais links pārstās darboties. Kalendārā būs jāabonē jaunais.",
        )}
        confirmLabel={t("calendar.integration.regenerate", "Izveidot jaunu linku")}
        confirmVariant="danger"
        onConfirm={() => {
          setRegenerateOpen(false);
          setBusy(true);
          void regenerateCalendarFeedTokenAction()
            .then((result) => {
              if (!result.ok) {
                showFeedback({
                  type: "error",
                  text: translateActionError(t, result.error),
                });
                return;
              }
              setSummary(result.data);
              showFeedback({
                type: "success",
                text: t(
                  "calendar.integration.regenerated",
                  "Jauns kalendāra links ir gatavs.",
                ),
              });
            })
            .finally(() => setBusy(false));
        }}
      />
    </>
  );
}

function ProviderCard({
  selected,
  disabled,
  icon,
  title,
  hint,
  onSelect,
}: {
  selected: boolean;
  disabled: boolean;
  icon: string;
  title: string;
  hint: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onSelect}
      className={`rounded-xl border px-3.5 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
        selected
          ? "border-zinc-900 bg-zinc-50 ring-1 ring-zinc-900"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <span className="flex items-center gap-2">
        <i className={`fab ${icon} text-[14px] text-zinc-700`} aria-hidden="true" />
        <span className="text-[13px] font-medium text-zinc-900">{title}</span>
      </span>
      <span className="mt-1 block text-[11.5px] leading-snug text-zinc-400">{hint}</span>
    </button>
  );
}

function FeedBox({
  label,
  value,
  help,
  copyLabel,
  onCopy,
  actionLabel,
  onAction,
  busy,
}: {
  label: string;
  value: string;
  help: string;
  copyLabel: string;
  onCopy: () => void;
  actionLabel: string;
  onAction: () => void;
  busy: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block px-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          readOnly
          value={value}
          className="min-h-9 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-[12px] text-zinc-800 outline-none"
        />
        <button
          type="button"
          disabled={busy || !value}
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-[12px] font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <i className="fas fa-copy text-[11px]" aria-hidden="true" />
          {copyLabel}
        </button>
      </div>
      <button
        type="button"
        disabled={busy || !value}
        onClick={onAction}
        className="inline-flex min-h-9 items-center gap-2 rounded-xl bg-zinc-900 px-3.5 text-[12px] font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {actionLabel}
      </button>
      <p className="text-[11.5px] leading-snug text-zinc-400">{help}</p>
    </div>
  );
}
