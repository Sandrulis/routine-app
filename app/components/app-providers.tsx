"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { FileTypesProvider } from "@/app/lib/file-types-context";
import { FrontendModulesProvider } from "@/app/lib/frontend-modules/context";
import { ListsProvider } from "@/app/lib/lists-store";
import { TemplatesProvider } from "@/app/lib/templates-store";
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
  enabledFrontendModuleKeys = [],
}: {
  children: ReactNode;
  taskStatuses?: TaskStatusSummary[];
  fileTypeExtensions?: FileTypeExtensionSummary[];
  enabledFrontendModuleKeys?: string[];
}) {
  return (
    <TeamProvider>
      <AdminProvider>
        <FrontendModulesProvider enabledKeys={enabledFrontendModuleKeys}>
          <TaskStatusesProvider statuses={taskStatuses}>
            <FileTypesProvider extensions={fileTypeExtensions}>
              <TemplatesProvider>
                <ListsProvider>
                  <AppShell>{children}</AppShell>
                </ListsProvider>
              </TemplatesProvider>
            </FileTypesProvider>
          </TaskStatusesProvider>
        </FrontendModulesProvider>
      </AdminProvider>
    </TeamProvider>
  );
}
