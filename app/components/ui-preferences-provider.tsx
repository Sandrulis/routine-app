"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { deleteCookie, readCookie } from "@/app/lib/cookies";
import { saveUserUiPreferencesAction } from "@/app/lib/users/actions";
import {
  DEFAULT_USER_UI_PREFERENCES,
  STATUS_GROUP_SORT_COOKIE,
  TABLE_COLUMN_VISIBILITY_COOKIE,
  parseStatusGroupSortCookie,
  type StatusGroupSortDirection,
  type UserUiPreferences,
} from "@/app/lib/users/ui-preferences";

type UiPreferencesContextValue = {
  preferences: UserUiPreferences;
  setStatusGroupSort: (next: StatusGroupSortDirection) => void;
  isColumnHidden: (id: string) => boolean;
  setColumnVisible: (id: string, visible: boolean) => void;
  setHiddenTableColumns: (ids: string[]) => void;
};

const UiPreferencesContext = createContext<UiPreferencesContextValue | null>(
  null,
);

function readLegacyLocalSort(): StatusGroupSortDirection | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(STATUS_GROUP_SORT_COOKIE);
    window.localStorage.removeItem(STATUS_GROUP_SORT_COOKIE);
    return parseStatusGroupSortCookie(stored);
  } catch {
    return null;
  }
}

function hasLegacyCookies() {
  return Boolean(
    readCookie(STATUS_GROUP_SORT_COOKIE) ||
      readCookie(TABLE_COLUMN_VISIBILITY_COOKIE),
  );
}

function clearLegacyCookies() {
  deleteCookie(STATUS_GROUP_SORT_COOKIE);
  deleteCookie(TABLE_COLUMN_VISIBILITY_COOKIE);
}

export function UiPreferencesProvider({
  initial = DEFAULT_USER_UI_PREFERENCES,
  children,
}: {
  initial?: UserUiPreferences;
  children: ReactNode;
}) {
  const [preferences, setPreferences] = useState<UserUiPreferences>(initial);
  const migratedRef = useRef(false);

  useEffect(() => {
    if (migratedRef.current) return;
    const localSort = readLegacyLocalSort();
    const cookies = hasLegacyCookies();
    // localStorage only fills an empty account default (asc). An explicit DB
    // value already won on the server and must not be overwritten.
    const nextSort =
      cookies || initial.statusGroupSort !== "asc"
        ? initial.statusGroupSort
        : (localSort ?? initial.statusGroupSort);
    if (!cookies && !localSort) {
      migratedRef.current = true;
      return;
    }
    migratedRef.current = true;
    if (nextSort !== initial.statusGroupSort) {
      setPreferences((current) => ({ ...current, statusGroupSort: nextSort }));
    }
    void saveUserUiPreferencesAction({
      statusGroupSort: nextSort,
      hiddenTableColumns: initial.hiddenTableColumns,
    });
    clearLegacyCookies();
  }, [initial]);

  const persist = useCallback((patch: Partial<UserUiPreferences>) => {
    setPreferences((current) => {
      const next = { ...current, ...patch };
      void saveUserUiPreferencesAction(patch);
      return next;
    });
  }, []);

  const setStatusGroupSort = useCallback(
    (next: StatusGroupSortDirection) => {
      persist({ statusGroupSort: next });
    },
    [persist],
  );

  const isColumnHidden = useCallback(
    (id: string) => preferences.hiddenTableColumns.includes(id),
    [preferences.hiddenTableColumns],
  );

  const setColumnVisible = useCallback(
    (id: string, visible: boolean) => {
      setPreferences((current) => {
        const hidden = current.hiddenTableColumns;
        const nextHidden = visible
          ? hidden.filter((item) => item !== id)
          : hidden.includes(id)
            ? hidden
            : [...hidden, id];
        if (
          nextHidden.length === hidden.length &&
          nextHidden.every((item, index) => item === hidden[index])
        ) {
          return current;
        }
        void saveUserUiPreferencesAction({ hiddenTableColumns: nextHidden });
        return { ...current, hiddenTableColumns: nextHidden };
      });
    },
    [],
  );

  const setHiddenTableColumns = useCallback((ids: string[]) => {
    persist({ hiddenTableColumns: ids });
  }, [persist]);

  const value = useMemo<UiPreferencesContextValue>(
    () => ({
      preferences,
      setStatusGroupSort,
      isColumnHidden,
      setColumnVisible,
      setHiddenTableColumns,
    }),
    [
      isColumnHidden,
      preferences,
      setColumnVisible,
      setHiddenTableColumns,
      setStatusGroupSort,
    ],
  );

  return (
    <UiPreferencesContext.Provider value={value}>
      {children}
    </UiPreferencesContext.Provider>
  );
}

export function useUiPreferences() {
  return useContext(UiPreferencesContext);
}
