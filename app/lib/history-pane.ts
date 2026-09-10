"use client";

import { useCallback, useState } from "react";
import {
  COOKIE_CONSENT_COOKIE,
  isCookieCategoryAllowed,
  parseCookieConsent,
} from "@/app/lib/consent/cookie-consent";
import { readCookie, writeCookie } from "@/app/lib/cookies";

export const HISTORY_PANE_COOKIE = "routine-app-history-pane";

export const HISTORY_PANE_IDS = ["folder", "subtask"] as const;

export type HistoryPaneId = (typeof HISTORY_PANE_IDS)[number];

type HistoryPaneState = Record<HistoryPaneId, boolean>;

const DEFAULT_HISTORY_PANE_STATE: HistoryPaneState = {
  folder: true,
  subtask: true,
};

function isHistoryPaneId(value: string): value is HistoryPaneId {
  return HISTORY_PANE_IDS.includes(value as HistoryPaneId);
}

function readHistoryPaneState(): HistoryPaneState {
  const raw = readCookie(HISTORY_PANE_COOKIE);
  if (!raw) return { ...DEFAULT_HISTORY_PANE_STATE };

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const next = { ...DEFAULT_HISTORY_PANE_STATE };
    for (const id of HISTORY_PANE_IDS) {
      if (parsed[id] === false) next[id] = false;
    }
    return next;
  } catch {
    return { ...DEFAULT_HISTORY_PANE_STATE };
  }
}

export function readHistoryPaneOpen(id: HistoryPaneId): boolean {
  return readHistoryPaneState()[id];
}

export function writeHistoryPaneOpen(id: HistoryPaneId, open: boolean) {
  if (!isHistoryPaneId(id)) return;

  const consent = parseCookieConsent(readCookie(COOKIE_CONSENT_COOKIE));
  if (!isCookieCategoryAllowed(consent, "preferences")) {
    return;
  }

  const current = readHistoryPaneState();
  current[id] = open;
  writeCookie(HISTORY_PANE_COOKIE, JSON.stringify(current));
}

export function useHistoryPaneOpen(id: HistoryPaneId) {
  const [open, setOpenState] = useState(() => readHistoryPaneOpen(id));

  const setOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setOpenState((current) => {
        const value = typeof next === "function" ? next(current) : next;
        if (value !== current) writeHistoryPaneOpen(id, value);
        return value;
      });
    },
    [id],
  );

  return [open, setOpen] as const;
}
