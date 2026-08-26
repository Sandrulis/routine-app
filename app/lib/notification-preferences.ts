import type { NotificationKind } from "@/app/lib/notifications";

/** Kinds the user can toggle in notification settings. */
export type NotificationPreferenceKind = NotificationKind;

export const NOTIFICATION_PREFERENCE_KINDS: NotificationPreferenceKind[] = [
  "assigned",
  "unassigned",
  "comment",
  "file",
  "status_changed",
  "task_updated",
  "due",
  "start",
  "team_invite",
  "team_invite_rejected",
  "seat_open",
  "billing_due",
];

export type NotificationPreferences = Record<
  NotificationPreferenceKind,
  boolean
>;

export function defaultNotificationPreferences(): NotificationPreferences {
  return {
    assigned: true,
    unassigned: true,
    comment: true,
    file: true,
    status_changed: true,
    task_updated: true,
    due: true,
    start: true,
    team_invite: true,
    team_invite_rejected: true,
    seat_open: true,
    billing_due: true,
  };
}

export function mergeNotificationPreferences(
  rows: Partial<Record<NotificationPreferenceKind, boolean>>,
): NotificationPreferences {
  const defaults = defaultNotificationPreferences();
  const merged = { ...defaults };
  for (const kind of NOTIFICATION_PREFERENCE_KINDS) {
    if (kind in rows && typeof rows[kind] === "boolean") {
      merged[kind] = rows[kind] as boolean;
    }
  }
  return merged;
}

export function isNotificationKindEnabled(
  preferences: NotificationPreferences | undefined,
  kind: NotificationKind,
): boolean {
  if (!preferences) return true;
  return preferences[kind] ?? true;
}

export function notificationPreferencesEqual(
  left: NotificationPreferences,
  right: NotificationPreferences,
): boolean {
  return NOTIFICATION_PREFERENCE_KINDS.every((kind) => left[kind] === right[kind]);
}

export function preferenceKeyForKind(
  kind: NotificationPreferenceKind,
): string {
  return `notifications.settings.kind.${kind}`;
}

export function preferenceFallbackForKind(
  kind: NotificationPreferenceKind,
): string {
  const fallbacks: Record<NotificationPreferenceKind, string> = {
    assigned: "Piešķirts man uzdevums",
    unassigned: "Noņemts no uzdevuma",
    comment: "Komentārs uz manu uzdevumu",
    file: "Fails pievienots uzdevumam",
    status_changed: "Statusa maiņa uzdevumā",
    task_updated: "Citi uzdevuma labojumi",
    due: "Tuvojošs termiņš",
    start: "Jāuzsāk apakšuzdevums",
    team_invite: "Komandas uzaicinājums",
    team_invite_rejected: "Noraidīts komandas uzaicinājums",
    seat_open: "Brīva apmaksāta vieta",
    billing_due: "Maksas par komandas lietotājiem",
  };
  return fallbacks[kind];
}

export function preferenceHintForKind(
  kind: NotificationPreferenceKind,
): string {
  const hints: Record<NotificationPreferenceKind, string> = {
    assigned: "Kad tevi piešķir uzdevumam vai apakšuzdevumam.",
    unassigned: "Kad tevi noņem no uzdevuma piesaistītajiem.",
    comment: "Kad kāds komentē uzdevumu, kurā esi iesaistīts.",
    file: "Kad pievieno failu uzdevumam, kurā esi iesaistīts.",
    status_changed: "Kad maina statusu uzdevumam, kurā esi iesaistīts.",
    task_updated:
      "Datumi, nosaukums, apraksts, kontrolsaraksts, pārvietošana, izveide.",
    due: "Atgādinājums, ka šodien ir apakšuzdevuma termiņš.",
    start: "Atgādinājums, ka jāuzsāk apakšuzdevums.",
    team_invite: "Kad uzaicina pievienoties komandai.",
    team_invite_rejected: "Kad kāds noraida tavu komandas uzaicinājumu.",
    seat_open: "Kad komandā paliek brīva apmaksāta vieta līdz cikla beigām.",
    billing_due:
      "Kad sistēma ieslēdz maksas plānus un nākamajā mēnesī jāmaksā par lietotājiem virs 1.",
  };
  return hints[kind];
}
