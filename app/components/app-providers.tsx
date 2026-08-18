"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { ListsProvider } from "@/app/lib/lists-store";
import { TeamProvider } from "@/app/lib/team-store";
import { AdminProvider } from "@/app/lib/users/use-is-admin";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <TeamProvider>
      <AdminProvider>
        <ListsProvider>
          <AppShell>{children}</AppShell>
        </ListsProvider>
      </AdminProvider>
    </TeamProvider>
  );
}
