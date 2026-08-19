"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  formatDisplayDate,
  formatDisplayDateTime,
} from "@/app/lib/format-display-date";
import {
  DEFAULT_SITE_DISPLAY_PREFERENCES,
  type SiteDisplayPreferences,
} from "@/app/lib/site-admin/display-preferences";

type DisplayPreferencesContextValue = {
  preferences: SiteDisplayPreferences;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
};

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(
  null,
);

export function DisplayPreferencesProvider({
  preferences = DEFAULT_SITE_DISPLAY_PREFERENCES,
  children,
}: {
  preferences?: SiteDisplayPreferences;
  children: ReactNode;
}) {
  const value = useMemo<DisplayPreferencesContextValue>(
    () => ({
      preferences,
      formatDate: (value) => formatDisplayDate(value, preferences),
      formatDateTime: (value) => formatDisplayDateTime(value, preferences),
    }),
    [preferences],
  );

  return (
    <DisplayPreferencesContext.Provider value={value}>
      {children}
    </DisplayPreferencesContext.Provider>
  );
}

export function useDisplayPreferences() {
  const context = useContext(DisplayPreferencesContext);
  if (!context) {
    return {
      preferences: DEFAULT_SITE_DISPLAY_PREFERENCES,
      formatDate: (value: string) => formatDisplayDate(value),
      formatDateTime: (value: string) => formatDisplayDateTime(value),
    };
  }
  return context;
}
