"use client";

import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import {
  TEAM_ACTION_PERMISSION_GROUPS,
  TEAM_ACTION_PERMISSION_LABELS,
  type TeamActionPermissionKey,
  type TeamPermissionSet,
} from "@/app/lib/team-permissions";

function allEnabled(values: boolean[]): boolean {
  return values.length > 0 && values.every(Boolean);
}

function PermissionGroupHeader({
  title,
  checked,
  disabled,
  onToggle,
}: {
  title: string;
  checked: boolean;
  disabled: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-zinc-100 px-3 py-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {title}
      </h3>
      <ToggleSwitch
        checked={checked}
        disabled={disabled}
        label={title}
        onChange={onToggle}
      />
    </div>
  );
}

export function TeamPermissionFields({
  value,
  disabled = false,
  onActionChange,
}: {
  value: TeamPermissionSet;
  disabled?: boolean;
  /** One or many action keys in a single update (group toggle must be atomic). */
  onActionChange: (
    updates: Partial<Record<TeamActionPermissionKey, boolean>>,
  ) => void;
}) {
  const { t } = useTranslations();

  const sections = TEAM_ACTION_PERMISSION_GROUPS.map((group) => {
    const groupTitle = t(group.titleKey, group.title);
    return {
      key: group.titleKey,
      title: groupTitle,
      checked: allEnabled(group.keys.map((key) => value.actions[key])),
      onToggle: (checked: boolean) => {
        onActionChange(
          Object.fromEntries(
            group.keys.map((key) => [key, checked]),
          ) as Partial<Record<TeamActionPermissionKey, boolean>>,
        );
      },
      items: group.keys.map((key) => {
        const label = TEAM_ACTION_PERMISSION_LABELS[key];
        return {
          key,
          label: t(label.key, label.fallback),
          checked: value.actions[key],
          onChange: (checked: boolean) => onActionChange({ [key]: checked }),
        };
      }),
    };
  });

  const leftColumnKeys = new Set(["team.access.groups.lists"]);
  const leftSections = sections.filter((section) => leftColumnKeys.has(section.key));
  const rightSections = sections.filter((section) => !leftColumnKeys.has(section.key));

  return (
    <div className="grid gap-3 md:grid-cols-2 md:items-start">
      {[leftSections, rightSections].map((columnSections, columnIndex) => (
        <div key={columnIndex} className="space-y-3">
          {columnSections.map((section) => (
            <section
              key={section.key}
              className="overflow-hidden rounded-lg border border-zinc-200"
            >
              <PermissionGroupHeader
                title={section.title}
                checked={section.checked}
                disabled={disabled}
                onToggle={section.onToggle}
              />
              <div className="divide-y divide-zinc-50">
                {section.items.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between gap-3 px-3 py-2 transition hover:bg-zinc-50"
                  >
                    <span className="text-sm text-zinc-700">{item.label}</span>
                    <ToggleSwitch
                      checked={item.checked}
                      disabled={disabled}
                      label={item.label}
                      onChange={item.onChange}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ))}
    </div>
  );
}
