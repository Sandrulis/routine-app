"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  COOKIE_CONSENT_COOKIE,
  isCookieCategoryAllowed,
  parseCookieConsent,
} from "@/app/lib/consent/cookie-consent";
import { readCookie, writeCookie } from "@/app/lib/cookies";

export const STATUS_GROUP_SORT_COOKIE = "routine-app-status-group-sort";
const LEGACY_STORAGE_KEY = "routine-app-status-group-sort";

export type StatusGroupSortDirection = "asc" | "desc";

const listeners = new Set<() => void>();
let sessionDirection: StatusGroupSortDirection | null = null;
let legacyChecked = false;

function isDirection(value: string | null): value is StatusGroupSortDirection {
  return value === "asc" || value === "desc";
}

function persistCookie(next: StatusGroupSortDirection) {
  const consent = parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
  if (!isCookieCategoryAllowed(consent, "preferences")) return;
  writeCookie(STATUS_GROUP_SORT_COOKIE, next);
}

function emitStatusGroupSortChange() {
  for (const listener of listeners) listener();
}

function hydrateLegacyStorage() {
  if (legacyChecked || typeof window === "undefined") return;
  legacyChecked = true;
  if (isDirection(readCookie(STATUS_GROUP_SORT_COOKIE))) return;
  const stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  if (!isDirection(stored)) return;
  sessionDirection = stored;
  persistCookie(stored);
  emitStatusGroupSortChange();
}

export function readStatusGroupSortDirection(): StatusGroupSortDirection {
  if (sessionDirection) return sessionDirection;
  const fromCookie = readCookie(STATUS_GROUP_SORT_COOKIE);
  return isDirection(fromCookie) ? fromCookie : "asc";
}

export function setStatusGroupSortDirection(next: StatusGroupSortDirection) {
  sessionDirection = next;
  persistCookie(next);
  emitStatusGroupSortChange();
}

function subscribeStatusGroupSort(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  hydrateLegacyStorage();
  return () => {
    listeners.delete(onStoreChange);
  };
}

export function useStatusGroupSortDirection() {
  const direction = useSyncExternalStore(
    subscribeStatusGroupSort,
    readStatusGroupSortDirection,
    () => "asc" as const,
  );
  const setDirection = useCallback((next: StatusGroupSortDirection) => {
    setStatusGroupSortDirection(next);
  }, []);
  return [direction, setDirection] as const;
}
