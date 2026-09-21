"use client";

import { useCallback } from "react";
import { useUiPreferences } from "@/app/components/ui-preferences-provider";
import {
  DEFAULT_USER_UI_PREFERENCES,
  type StatusGroupSortDirection,
} from "@/app/lib/users/ui-preferences";

export type { StatusGroupSortDirection };

export function useStatusGroupSortDirection() {
  const context = useUiPreferences();
  const direction =
    context?.preferences.statusGroupSort ??
    DEFAULT_USER_UI_PREFERENCES.statusGroupSort;
  const setDirection = useCallback(
    (next: StatusGroupSortDirection) => {
      context?.setStatusGroupSort(next);
    },
    [context],
  );
  return [direction, setDirection] as const;
}
