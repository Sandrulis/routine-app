"use client";

import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import {
  TEAM_ACTION_PERMISSION_GROUPS,
  TEAM_ACTION_PERMISSION_LABELS,
  TEAM_NAV_PERMISSION_KEYS,
  TEAM_NAV_PERMISSION_LABELS,
  type TeamActionPermissionKey,
  type TeamNavPermissionKey,
  type TeamPermissionSet,
} from "@/app/lib/team-permissions";

function allEnabled(values: boolean[]): boolean {
  return values.length > 0 && values.every(Boolean);
}

function PermissionGroupHeader({
  title,
  checked,
  disabled,
  toggleLabel,
  onToggle,
}: {
  title: string;
  checked: boolean;
  disabled: boolean;
  toggleLabel: string;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-zinc-800">{title}</h3>
      <ToggleSwitch
        checked={checked}
        disabled={disabled}
        label={toggleLabel}
        onChange={onToggle}
      />
    </div>
  );
}

export function TeamPermissionFields({
  value,
  disabled = false,
  onNavChange,
  onActionChange,
}: {
  value: TeamPermissionSet;
  disabled?: boolean;
  onNavChange: (key: TeamNavPermissionKey, enabled: boolean) => void;
  onActionChange: (key: TeamActionPermissionKey, enabled: boolean) => void;
}) {
  const { t } = useTranslations();

  function groupToggleLabel(section: string) {
    return t("team.access.toggle_all", "Visas pieejas: {section}", { section });
  }

  const navTitle = t("team.access.nav", "Sadaļas");

  return (
    <div className="space-y-5">
      <section className="space-y-3">
        <PermissionGroupHeader
          title={navTitle}
          checked={allEnabled(TEAM_NAV_PERMISSION_KEYS.map((key) => value.nav[key]))}
          disabled={disabled}
          toggleLabel={groupToggleLabel(navTitle)}
          onToggle={(checked) => {
            for (const key of TEAM_NAV_PERMISSION_KEYS) {
              onNavChange(key, checked);
            }
          }}
        />
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
          {TEAM_NAV_PERMISSION_KEYS.map((key) => {
            const label = TEAM_NAV_PERMISSION_LABELS[key];
            return (
              <div
                key={key}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <span className="text-sm text-zinc-800">
                  {t(label.key, label.fallback)}
                </span>
                <ToggleSwitch
                  checked={value.nav[key]}
                  disabled={disabled}
                  label={t(label.key, label.fallback)}
                  onChange={(checked) => onNavChange(key, checked)}
                />
              </div>
            );
          })}
        </div>
      </section>

      {TEAM_ACTION_PERMISSION_GROUPS.map((group) => {
        const groupTitle = t(group.titleKey, group.title);
        return (
          <section key={group.titleKey} className="space-y-3">
            <PermissionGroupHeader
              title={groupTitle}
              checked={allEnabled(group.keys.map((key) => value.actions[key]))}
              disabled={disabled}
              toggleLabel={groupToggleLabel(groupTitle)}
              onToggle={(checked) => {
                for (const key of group.keys) {
                  onActionChange(key, checked);
                }
              }}
            />
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200">
              {group.keys.map((key) => {
                const label = TEAM_ACTION_PERMISSION_LABELS[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <span className="text-sm text-zinc-800">
                      {t(label.key, label.fallback)}
                    </span>
                    <ToggleSwitch
                      checked={value.actions[key]}
                      disabled={disabled}
                      label={t(label.key, label.fallback)}
                      onChange={(checked) => onActionChange(key, checked)}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
