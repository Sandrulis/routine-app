"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  COOKIE_CONSENT_COOKIE,
  isCookieCategoryAllowed,
  parseCookieConsent,
} from "@/app/lib/consent/cookie-consent";
import { readCookie, writeCookie } from "@/app/lib/cookies";

export const STATUS_GROUP_COLLAPSED_COOKIE = "routine-app-status-group-collapsed";

const EMPTY_COLLAPSED: string[] = [];
const listeners = new Set<() => void>();
let snapshot: string[] = EMPTY_COLLAPSED;
let snapshotReady = false;

function parseCollapsed(raw: string | null): string[] {
  if (!raw) return EMPTY_COLLAPSED;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return EMPTY_COLLAPSED;
    }
    const collapsed = (parsed as { collapsed?: unknown }).collapsed;
    if (!Array.isArray(collapsed)) return EMPTY_COLLAPSED;
    const next = collapsed.filter(
      (id): id is string =>
        typeof id === "string" && id.trim().length > 0 && id.trim().length <= 120,
    );
    return next.length === 0 ? EMPTY_COLLAPSED : next.slice(0, 200);
  } catch {
    return EMPTY_COLLAPSED;
  }
}

function persistCookie(collapsed: string[]) {
  const consent = parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
  if (!isCookieCategoryAllowed(consent, "preferences")) return;
  writeCookie(
    STATUS_GROUP_COLLAPSED_COOKIE,
    JSON.stringify({ collapsed }),
  );
}

function emitChange() {
  for (const listener of listeners) listener();
}

export function readCollapsedStatusGroupKeys(): string[] {
  if (snapshotReady) return snapshot;
  snapshot = parseCollapsed(readCookie(STATUS_GROUP_COLLAPSED_COOKIE));
  snapshotReady = true;
  return snapshot;
}

export function setCollapsedStatusGroupKeys(collapsed: string[]) {
  const next = collapsed.length === 0 ? EMPTY_COLLAPSED : collapsed;
  snapshot = next;
  snapshotReady = true;
  persistCookie(next);
  emitChange();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function getServerSnapshot() {
  return EMPTY_COLLAPSED;
}

export function useCollapsedStatusGroupKeys() {
  const collapsed = useSyncExternalStore(
    subscribe,
    readCollapsedStatusGroupKeys,
    getServerSnapshot,
  );

  const toggle = useCallback((key: string) => {
    const current = readCollapsedStatusGroupKeys();
    const next = current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key];
    setCollapsedStatusGroupKeys(next);
  }, []);

  const isCollapsed = useCallback(
    (key: string) => collapsed.includes(key),
    [collapsed],
  );

  return { collapsed, toggle, isCollapsed };
}
