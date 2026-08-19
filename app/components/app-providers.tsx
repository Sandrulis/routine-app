"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { FileTypesProvider } from "@/app/lib/file-types-context";
import { ListsProvider } from "@/app/lib/lists-store";
import { TaskStatusesProvider } from "@/app/lib/task-statuses";
import { TeamProvider } from "@/app/lib/team-store";
import { AdminProvider } from "@/app/lib/users/use-is-admin";
import type {
  FileTypeExtensionSummary,
  TaskStatusSummary,
} from "@/app/lib/site-admin/types";

export function AppProviders({
  children,
  taskStatuses = [],
  fileTypeExtensions = [],
}: {
  children: ReactNode;
  taskStatuses?: TaskStatusSummary[];
  fileTypeExtensions?: FileTypeExtensionSummary[];
}) {
  return (
    <TeamProvider>
      <AdminProvider>
        <TaskStatusesProvider statuses={taskStatuses}>
          <FileTypesProvider extensions={fileTypeExtensions}>
            <ListsProvider>
              <AppShell>{children}</AppShell>
            </ListsProvider>
          </FileTypesProvider>
        </TaskStatusesProvider>
      </AdminProvider>
    </TeamProvider>
  );
}
