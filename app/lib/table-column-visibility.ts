"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  COOKIE_CONSENT_COOKIE,
  isCookieCategoryAllowed,
  parseCookieConsent,
} from "@/app/lib/consent/cookie-consent";
import { readCookie, writeCookie } from "@/app/lib/cookies";

export const TABLE_COLUMN_VISIBILITY_COOKIE = "routine-app-table-columns";

const EMPTY_HIDDEN: string[] = [];
const listeners = new Set<() => void>();
let snapshot: string[] = EMPTY_HIDDEN;
let snapshotReady = false;

function parseHidden(raw: string | null): string[] {
  if (!raw) return EMPTY_HIDDEN;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return EMPTY_HIDDEN;
    }
    const hidden = (parsed as { hidden?: unknown }).hidden;
    if (!Array.isArray(hidden)) return EMPTY_HIDDEN;
    const next = hidden.filter(
      (id): id is string => typeof id === "string" && id.trim().length > 0,
    );
    return next.length === 0 ? EMPTY_HIDDEN : next;
  } catch {
    return EMPTY_HIDDEN;
  }
}

function persistCookie(hidden: string[]) {
  const consent = parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
  if (!isCookieCategoryAllowed(consent, "preferences")) return;
  writeCookie(TABLE_COLUMN_VISIBILITY_COOKIE, JSON.stringify({ hidden }));
}

function emitChange() {
  for (const listener of listeners) listener();
}

export function readHiddenTableColumnIds(): string[] {
  if (snapshotReady) return snapshot;
  snapshot = parseHidden(readCookie(TABLE_COLUMN_VISIBILITY_COOKIE));
  snapshotReady = true;
  return snapshot;
}

export function setHiddenTableColumnIds(hidden: string[]) {
  const next = hidden.length === 0 ? EMPTY_HIDDEN : hidden;
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
  return EMPTY_HIDDEN;
}

export function useHiddenTableColumnIds() {
  const hidden = useSyncExternalStore(
    subscribe,
    readHiddenTableColumnIds,
    getServerSnapshot,
  );
  const setHidden = useCallback((next: string[]) => {
    setHiddenTableColumnIds(next);
  }, []);

  const isHidden = useCallback(
    (id: string) => hidden.includes(id),
    [hidden],
  );

  const setColumnVisible = useCallback(
    (id: string, visible: boolean) => {
      const current = readHiddenTableColumnIds();
      const next = visible
        ? current.filter((item) => item !== id)
        : current.includes(id)
          ? current
          : [...current, id];
      if (next === current) return;
      if (
        next.length === current.length &&
        next.every((item, index) => item === current[index])
      ) {
        return;
      }
      setHiddenTableColumnIds(next);
    },
    [],
  );

  return { hidden, setHidden, isHidden, setColumnVisible };
}
