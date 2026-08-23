"use client";

import { useEffect } from "react";
import { useAuthSession } from "@/app/lib/auth/auth-session-provider";
import { saveCurrentUserTimezoneAction } from "@/app/lib/users/actions";

const STORAGE_KEY = "routine.timezone";

export function TimezoneSync() {
  const { user, isReady } = useAuthSession();

  useEffect(() => {
    if (!isReady || !user) return;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === timeZone) return;
    } catch {
      // private mode
    }
    void saveCurrentUserTimezoneAction(timeZone).then((result) => {
      if (!result.ok) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, timeZone);
      } catch {
        // ignore
      }
    });
  }, [isReady, user]);

  return null;
}
