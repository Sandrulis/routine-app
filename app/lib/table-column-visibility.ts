"use client";

import { useCallback } from "react";
import { useUiPreferences } from "@/app/components/ui-preferences-provider";
import { DEFAULT_USER_UI_PREFERENCES } from "@/app/lib/users/ui-preferences";

export function useHiddenTableColumnIds() {
  const context = useUiPreferences();
  const hidden =
    context?.preferences.hiddenTableColumns ??
    DEFAULT_USER_UI_PREFERENCES.hiddenTableColumns;

  const isHidden = useCallback(
    (id: string) => hidden.includes(id),
    [hidden],
  );

  const setColumnVisible = useCallback(
    (id: string, visible: boolean) => {
      context?.setColumnVisible(id, visible);
    },
    [context],
  );

  const setHidden = useCallback(
    (next: string[]) => {
      context?.setHiddenTableColumns(next);
    },
    [context],
  );

  return { hidden, setHidden, isHidden, setColumnVisible };
}
