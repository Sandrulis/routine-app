export const ONLINE_THRESHOLD_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const MONTH_MS = 30 * DAY_MS;

export type LastOnlineDisplay =
  | { kind: "online" }
  | { kind: "minutes"; count: number }
  | { kind: "hours"; count: number }
  | { kind: "days"; count: number }
  | { kind: "months"; count: number }
  | { kind: "unknown" };

export function parseLastOnlineAt(value: string | null | undefined): number | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getLastOnlineDisplay(
  lastOnlineAt: string | null | undefined,
  now = Date.now(),
): LastOnlineDisplay {
  const timestamp = parseLastOnlineAt(lastOnlineAt);
  if (timestamp == null) return { kind: "unknown" };

  const elapsed = Math.max(0, now - timestamp);
  if (elapsed <= ONLINE_THRESHOLD_MS) return { kind: "online" };

  if (elapsed < HOUR_MS) {
    return { kind: "minutes", count: Math.floor(elapsed / 60_000) };
  }

  if (elapsed < DAY_MS) {
    return { kind: "hours", count: Math.floor(elapsed / HOUR_MS) };
  }

  if (elapsed < MONTH_MS) {
    return { kind: "days", count: Math.floor(elapsed / DAY_MS) };
  }

  return { kind: "months", count: Math.floor(elapsed / MONTH_MS) };
}
