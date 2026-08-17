import {
  COOKIE_CONSENT_COOKIE,
  isCookieCategoryAllowed,
  parseCookieConsent,
} from "@/app/lib/consent/cookie-consent";
import { readCookie, writeCookie } from "@/app/lib/cookies";

export const LIST_WINDOW_IDS = ["tasks", "files", "overview"] as const;

export type ListWindowId = (typeof LIST_WINDOW_IDS)[number];

export const DEFAULT_LIST_WINDOW_ORDER: ListWindowId[] = [
  "tasks",
  "files",
  "overview",
];

export const LIST_WINDOW_ORDER_COOKIE = "routine-app-list-window-order";

function isListWindowId(value: unknown): value is ListWindowId {
  return LIST_WINDOW_IDS.includes(value as ListWindowId);
}

export function normalizeWindowOrder(value: unknown): ListWindowId[] {
  const incoming = Array.isArray(value)
    ? value.filter(isListWindowId)
    : [];
  const next = [...incoming];

  for (const id of DEFAULT_LIST_WINDOW_ORDER) {
    if (!next.includes(id)) next.push(id);
  }

  return next.filter(isListWindowId);
}

export function readListWindowOrder(listId: string): ListWindowId[] {
  const raw = readCookie(LIST_WINDOW_ORDER_COOKIE);
  if (!raw) return [...DEFAULT_LIST_WINDOW_ORDER];

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeWindowOrder(parsed[listId]);
  } catch {
    return [...DEFAULT_LIST_WINDOW_ORDER];
  }
}

export function writeListWindowOrder(listId: string, order: ListWindowId[]) {
  const normalized = normalizeWindowOrder(order);
  let current: Record<string, ListWindowId[]> = {};

  try {
    const raw = readCookie(LIST_WINDOW_ORDER_COOKIE);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      current = Object.fromEntries(
        Object.entries(parsed).map(([id, value]) => [
          id,
          normalizeWindowOrder(value),
        ]),
      );
    }
  } catch {
    current = {};
  }

  const consent = parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
  if (!isCookieCategoryAllowed(consent, "preferences")) {
    return;
  }

  current[listId] = normalized;
  writeCookie(LIST_WINDOW_ORDER_COOKIE, JSON.stringify(current));
}
