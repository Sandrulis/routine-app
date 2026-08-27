"use client";

import { createContext, useContext, type ReactNode } from "react";

const DocsEnabledContext = createContext(false);

export function DocsEnabledProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return (
    <DocsEnabledContext.Provider value={enabled}>{children}</DocsEnabledContext.Provider>
  );
}

export function useDocsEnabled() {
  return useContext(DocsEnabledContext);
}
