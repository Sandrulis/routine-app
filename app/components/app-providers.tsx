"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { ListsProvider } from "@/app/lib/lists-store";
import { TaskStatusesProvider } from "@/app/lib/task-statuses";
import { TeamProvider } from "@/app/lib/team-store";
import { AdminProvider } from "@/app/lib/users/use-is-admin";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

export function AppProviders({
  children,
  taskStatuses = [],
}: {
  children: ReactNode;
  taskStatuses?: TaskStatusSummary[];
}) {
  return (
    <TeamProvider>
      <AdminProvider>
        <TaskStatusesProvider statuses={taskStatuses}>
          <ListsProvider>
            <AppShell>{children}</AppShell>
          </ListsProvider>
        </TaskStatusesProvider>
      </AdminProvider>
    </TeamProvider>
  );
}
