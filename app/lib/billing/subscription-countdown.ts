export type SubscriptionCountdownParts = {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  expired: boolean;
};

export function subscriptionCountdownParts(
  endIso: string | null | undefined,
  nowMs = Date.now(),
): SubscriptionCountdownParts {
  if (!endIso?.trim()) {
    return { months: 0, days: 0, hours: 0, minutes: 0, expired: true };
  }
  const end = Date.parse(endIso);
  if (!Number.isFinite(end) || end <= nowMs) {
    return { months: 0, days: 0, hours: 0, minutes: 0, expired: true };
  }

  let remaining = end - nowMs;
  const minuteMs = 60_000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;
  const monthMs = 30 * dayMs;

  const months = Math.floor(remaining / monthMs);
  remaining -= months * monthMs;
  const days = Math.floor(remaining / dayMs);
  remaining -= days * dayMs;
  const hours = Math.floor(remaining / hourMs);
  remaining -= hours * hourMs;
  const minutes = Math.floor(remaining / minuteMs);

  return { months, days, hours, minutes, expired: false };
}
