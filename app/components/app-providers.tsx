"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { ListsProvider } from "@/app/lib/lists-store";
import { TeamProvider } from "@/app/lib/team-store";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TeamProvider>
      <ListsProvider>
        <AppShell>{children}</AppShell>
      </ListsProvider>
    </TeamProvider>
  );
}
