"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  AppModal,
  appModalWidePanelMaxWidthClassName,
} from "@/app/components/app-modal";
import { LoadingState } from "@/app/components/loading-state";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import {
  defaultNotificationPreferences,
  preferenceFallbackForKind,
  preferenceHintForKind,
  preferenceKeyForKind,
  type NotificationPreferenceKind,
  type NotificationPreferences,
} from "@/app/lib/notification-preferences";
import {
  fetchNotificationPreferencesAction,
  saveNotificationPreferencesAction,
} from "@/app/lib/users/actions";

type PreferenceGroup = {
  labelKey: string;
  labelFallback: string;
  icon: string;
  iconColor: string;
  kinds: NotificationPreferenceKind[];
};

const PREFERENCE_GROUPS: PreferenceGroup[] = [
  {
    labelKey: "notifications.settings.group.tasks",
    labelFallback: "Uzdevumi",
    icon: "fa-list-check",
    iconColor: "text-blue-500",
    kinds: ["assigned", "unassigned", "comment", "file", "status_changed", "task_updated"],
  },
  {
    labelKey: "notifications.settings.group.reminders",
    labelFallback: "Atgādinājumi",
    icon: "fa-clock",
    iconColor: "text-amber-500",
    kinds: ["start", "due"],
  },
  {
    labelKey: "notifications.settings.group.team",
    labelFallback: "Komanda",
    icon: "fa-user-group",
    iconColor: "text-violet-500",
    kinds: ["team_invite", "team_invite_rejected"],
  },
];

const KIND_ICONS: Record<NotificationPreferenceKind, string> = {
  assigned: "fa-user-plus",
  unassigned: "fa-user-minus",
  comment: "fa-comment",
  file: "fa-paperclip",
  status_changed: "fa-arrow-right-arrow-left",
  task_updated: "fa-pen",
  due: "fa-bell",
  start: "fa-play",
  team_invite: "fa-envelope",
  team_invite_rejected: "fa-user-xmark",
};

function GroupSection({
  group,
  children,
  t,
}: {
  group: PreferenceGroup;
  children: ReactNode;
  t: (key: string, fallback: string) => string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 px-1">
        <i className={`fas ${group.icon} text-[11px] ${group.iconColor}`} aria-hidden="true" />
        <span className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">
          {t(group.labelKey, group.labelFallback)}
        </span>
      </div>
      <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {children}
      </div>
    </div>
  );
}

function PreferenceRow({
  kind,
  checked,
  disabled,
  onToggle,
  t,
}: {
  kind: NotificationPreferenceKind;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
  t: (key: string, fallback: string) => string;
}) {
  const icon = KIND_ICONS[kind];
  return (
    <div className="flex items-center gap-3 px-3.5 py-3 transition hover:bg-zinc-50/80">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
        <i className={`fas ${icon} text-[12px]`} aria-hidden="true" />
      </span>
      <label htmlFor={`notif-pref-${kind}`} className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium leading-snug text-zinc-900">
          {t(preferenceKeyForKind(kind), preferenceFallbackForKind(kind))}
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-snug text-zinc-400">
          {t(`${preferenceKeyForKind(kind)}.hint`, preferenceHintForKind(kind))}
        </span>
      </label>
      <ToggleSwitch
        checked={checked}
        disabled={disabled}
        label={t(preferenceKeyForKind(kind), preferenceFallbackForKind(kind))}
        onChange={onToggle}
        className="shrink-0"
      />
    </div>
  );
}

export function NotificationSettingsModal({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: () => void;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [busyKind, setBusyKind] = useState<NotificationPreferenceKind | null>(null);

  const pendingSaveRef = useRef<NotificationPreferences | null>(null);
  const isSavingRef = useRef(false);
  const flushRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!open) {
      setPreferences(null);
      setLoading(false);
      setBusyKind(null);
      pendingSaveRef.current = null;
      isSavingRef.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchNotificationPreferencesAction()
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setPreferences(defaultNotificationPreferences());
          showFeedback({
            type: "error",
            text: translateActionError(t, result.error),
          });
          return;
        }
        setPreferences(result.data as NotificationPreferences);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("Failed to load notification preferences", error);
        setPreferences(defaultNotificationPreferences());
        showFeedback({
          type: "error",
          text: t(
            "notifications.settings.load_failed",
            "Neizdevās ielādēt paziņojumu uzstādījumus.",
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

  const flush = useCallback(async () => {
    if (isSavingRef.current) return;

    const snapshot = pendingSaveRef.current;
    if (!snapshot) return;
    pendingSaveRef.current = null;
    isSavingRef.current = true;

    try {
      const result = await saveNotificationPreferencesAction(snapshot);
      if (!result.ok) {
        showFeedback({
          type: "error",
          text: translateActionError(t, result.error),
        });
      } else {
        onSave?.();
      }
    } catch (error) {
      console.error("Failed to save notification preferences", error);
      showFeedback({
        type: "error",
        text: t(
          "notifications.settings.save_failed",
          "Neizdevās saglabāt paziņojumu uzstādījumus.",
        ),
      });
    } finally {
      isSavingRef.current = false;
      setBusyKind(null);
    }

    if (pendingSaveRef.current) {
      flushRef.current();
    }
  }, [onSave, showFeedback, t]);

  flushRef.current = flush;

  const toggleKind = useCallback(
    (kind: NotificationPreferenceKind) => {
      setPreferences((current) => {
        if (!current) return current;
        return { ...current, [kind]: !current[kind] };
      });

      setBusyKind(kind);

      setPreferences((current) => {
        if (current) {
          pendingSaveRef.current = current;
        }
        return current;
      });

      queueMicrotask(() => void flush());
    },
    [flush],
  );

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      panelMaxWidthClassName={appModalWidePanelMaxWidthClassName}
      title={t("notifications.settings.title", "Paziņojumu uzstādījumi")}
      description={t(
        "notifications.settings.description",
        "Izvēlies, par kādiem notikumiem saņemt paziņojumus zvaniņa izvēlnē.",
      )}
    >
      {loading ? (
        <LoadingState compact className="justify-center py-6" />
      ) : preferences ? (
        <div className="space-y-5">
          {PREFERENCE_GROUPS.map((group) => (
            <GroupSection key={group.labelKey} group={group} t={t}>
              {group.kinds.map((kind) => (
                <PreferenceRow
                  key={kind}
                  kind={kind}
                  checked={preferences[kind]}
                  disabled={busyKind !== null}
                  onToggle={() => toggleKind(kind)}
                  t={t}
                />
              ))}
            </GroupSection>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          {t(
            "notifications.settings.load_failed",
            "Neizdevās ielādēt paziņojumu uzstādījumus.",
          )}
        </p>
      )}
    </AppModal>
  );
}
