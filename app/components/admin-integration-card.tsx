"use client";

import { ToggleSwitch } from "@/app/components/toggle-switch";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";

type AdminIntegrationCardProps = {
  panelId: string;
  title: string;
  description: string;
  configured: boolean;
  configuredAccountEmail?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  enabled?: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  enabledAriaLabel?: string;
  isBusy: boolean;
  children: React.ReactNode;
};

export function AdminIntegrationCard({
  panelId,
  title,
  description,
  configured,
  configuredAccountEmail = "",
  expanded,
  onExpandedChange,
  enabled,
  onEnabledChange,
  enabledAriaLabel,
  isBusy,
  children,
}: AdminIntegrationCardProps) {
  const { t } = useTranslations();
  const panelContentId = `${panelId}-config-panel`;
  const toggleLabel = expanded
    ? t("nav.collapse", "Sakļaut")
    : t("nav.expand", "Izvērst");
  const enableLockedReason = configured
    ? null
    : t(
        "integrations.enabled.requires_configured",
        "Vispirms pabeidz konfigurāciju, lai ieslēgtu integrāciju.",
      );
  const enableToggle = onEnabledChange ? (
    <ToggleSwitch
      checked={configured && enabled === true}
      disabled={isBusy || !configured}
      label={enabledAriaLabel ?? title}
      onChange={onEnabledChange}
    />
  ) : null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4 p-5 pb-4">
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={panelContentId}
          onClick={() => onExpandedChange(!expanded)}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
        >
          <span
            className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-zinc-500"
            aria-hidden="true"
          >
            <i
              className={`fas fa-chevron-down text-[10px] transition-transform duration-200 ${
                expanded ? "" : "-rotate-90"
              }`}
            />
          </span>
          <span className="min-w-0">
            <span className="block text-base font-semibold text-zinc-900">{title}</span>
            <span className="mt-1 block text-sm text-zinc-600">{description}</span>
          </span>
          <span className="sr-only">{toggleLabel}</span>
        </button>

        {enableToggle ? (
          <div
            className="flex items-center gap-3"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <span className="text-sm text-zinc-600">
              {t("integrations.enabled_label", "Aktīva")}
            </span>
            {enableLockedReason ? (
              <Tooltip label={enableLockedReason} align="end">
                {enableToggle}
              </Tooltip>
            ) : (
              enableToggle
            )}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            configured
              ? "bg-emerald-50 text-emerald-800"
              : "bg-zinc-100 text-zinc-600"
          }`}
        >
          {configured
            ? t("integrations.status.configured", "Konfigurēta")
            : t("integrations.status.not_configured", "Nav konfigurēta")}
        </span>
        {configuredAccountEmail ? (
          <span className="text-sm text-zinc-600">{configuredAccountEmail}</span>
        ) : null}
      </div>

      {expanded ? (
        <div id={panelContentId} className="border-t border-zinc-100 px-5 pb-5 pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
