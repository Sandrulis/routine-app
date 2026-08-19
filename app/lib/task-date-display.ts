import { calendarDaysFromToday } from "@/app/lib/format-display-date";
import type { ListStatusGroup } from "@/app/lib/list-statuses";

export type TaskDateFieldKind = "start" | "due";

export type TaskDateRelativeHint = {
  overdue: boolean;
  days: number;
};

/**
 * Relatīvais datuma hints apakšuzdevumam atkarībā no lauka un statusa grupas.
 * - Sākums: not_started → atlicis vai kavē līdz startam; active → tikai kavējums.
 * - Termiņš: closed → tikai kavējums; active / not_started → atlicis vai kavē.
 */
export function taskDateRelativeHint(
  value: string | null,
  fieldKind: TaskDateFieldKind,
  statusGroup: ListStatusGroup,
): TaskDateRelativeHint | null {
  if (!value) return null;
  const days = calendarDaysFromToday(value);
  if (days == null) return null;
  const overdue = days < 0;

  if (fieldKind === "start") {
    if (statusGroup === "not_started") {
      return { overdue, days };
    }
    if (statusGroup === "active" && overdue) {
      return { overdue: true, days };
    }
    return null;
  }

  if (statusGroup === "closed") {
    if (overdue) return { overdue: true, days };
    return null;
  }

  if (statusGroup === "active" || statusGroup === "not_started") {
    return { overdue, days };
  }

  return null;
}
