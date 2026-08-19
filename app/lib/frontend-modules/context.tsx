"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { KNOWN_FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";

type FrontendModulesContextValue = {
  enabledKeys: Set<string>;
  isEnabled: (moduleKey: string) => boolean;
};

const FrontendModulesContext = createContext<FrontendModulesContextValue | null>(
  null,
);

export function FrontendModulesProvider({
  enabledKeys,
  children,
}: {
  enabledKeys: string[];
  children: ReactNode;
}) {
  const value = useMemo<FrontendModulesContextValue>(() => {
    const keys = new Set(enabledKeys);
    return {
      enabledKeys: keys,
      isEnabled: (moduleKey: string) => keys.has(moduleKey),
    };
  }, [enabledKeys]);

  return (
    <FrontendModulesContext.Provider value={value}>
      {children}
    </FrontendModulesContext.Provider>
  );
}

export function useFrontendModules(): FrontendModulesContextValue {
  const context = useContext(FrontendModulesContext);
  if (context) return context;
  const fallback = new Set<string>(KNOWN_FRONTEND_MODULE_KEYS);
  return {
    enabledKeys: fallback,
    isEnabled: (moduleKey: string) => fallback.has(moduleKey),
  };
}
