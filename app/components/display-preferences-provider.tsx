"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  formatDisplayDate,
  formatDisplayDateTime,
} from "@/app/lib/format-display-date";
import {
  DEFAULT_SITE_DISPLAY_PREFERENCES,
  type EffectiveDisplaySettings,
} from "@/app/lib/site-admin/display-preferences";

type DisplayPreferencesContextValue = {
  preferences: EffectiveDisplaySettings;
  timeZone: string;
  formatDate: (value: string) => string;
  formatDateTime: (value: string) => string;
};

const DisplayPreferencesContext = createContext<DisplayPreferencesContextValue | null>(
  null,
);

export function DisplayPreferencesProvider({
  preferences = {
    ...DEFAULT_SITE_DISPLAY_PREFERENCES,
    timeZone: "Europe/Riga",
  },
  children,
}: {
  preferences?: EffectiveDisplaySettings;
  children: ReactNode;
}) {
  const value = useMemo<DisplayPreferencesContextValue>(
    () => ({
      preferences,
      timeZone: preferences.timeZone,
      formatDate: (value) =>
        formatDisplayDate(value, preferences, preferences.timeZone),
      formatDateTime: (value) =>
        formatDisplayDateTime(value, preferences, preferences.timeZone),
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
    const fallback: EffectiveDisplaySettings = {
      ...DEFAULT_SITE_DISPLAY_PREFERENCES,
      timeZone: "Europe/Riga",
    };
    return {
      preferences: fallback,
      timeZone: fallback.timeZone,
      formatDate: (value: string) => formatDisplayDate(value),
      formatDateTime: (value: string) => formatDisplayDateTime(value),
    };
  }
  return context;
}
