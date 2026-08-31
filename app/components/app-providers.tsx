"use client";

import type { ReactNode } from "react";
import { AppShell } from "@/app/components/app-shell";
import { FileViewerProvider } from "@/app/components/file-viewer-provider";
import { TeamScopedFrontendModules } from "@/app/lib/frontend-modules/team-scoped-provider";
import { TeamGoogleDriveProvider } from "@/app/lib/google-drive/context";
import { TeamOneDriveProvider } from "@/app/lib/onedrive/context";
import { PaymentPlansEnabledProvider } from "@/app/lib/payment-plans/context";
import { FileTypesProvider } from "@/app/lib/file-types-context";
import { ListsProvider } from "@/app/lib/lists-store";
import { TemplatesProvider } from "@/app/lib/templates-store";
import { TaskStatusesProvider } from "@/app/lib/task-statuses";
import { TeamProvider } from "@/app/lib/team-store";
import { AdminProvider } from "@/app/lib/users/use-is-admin";
import type {
  FileTypeExtensionSummary,
  TaskStatusSummary,
} from "@/app/lib/site-admin/types";

type PaymentPlanModuleSnapshot = {
  id: string;
  moduleKeys: string[];
  isFree?: boolean;
};

export function AppProviders({
  children,
  taskStatuses = [],
  fileTypeExtensions = [],
  enabledFrontendModuleKeys = [],
  paymentPlansEnabled = false,
  paymentPlans = [],
  stripeKeyInvalid = false,
}: {
  children: ReactNode;
  taskStatuses?: TaskStatusSummary[];
  fileTypeExtensions?: FileTypeExtensionSummary[];
  enabledFrontendModuleKeys?: string[];
  paymentPlansEnabled?: boolean;
  paymentPlans?: PaymentPlanModuleSnapshot[];
  stripeKeyInvalid?: boolean;
}) {
  return (
    <TeamProvider>
      <AdminProvider>
        <PaymentPlansEnabledProvider
          enabled={paymentPlansEnabled}
          freePlanIds={paymentPlans.filter((plan) => plan.isFree).map((plan) => plan.id)}
        >
        <TeamScopedFrontendModules
          globalEnabledKeys={enabledFrontendModuleKeys}
          paymentPlansEnabled={paymentPlansEnabled}
          plans={paymentPlans}
        >
          <TeamGoogleDriveProvider>
          <TeamOneDriveProvider>
          <TaskStatusesProvider statuses={taskStatuses}>
            <FileTypesProvider extensions={fileTypeExtensions}>
              <TemplatesProvider>
                <ListsProvider>
                  <FileViewerProvider>
                    <AppShell stripeKeyInvalid={stripeKeyInvalid}>{children}</AppShell>
                  </FileViewerProvider>
                </ListsProvider>
              </TemplatesProvider>
            </FileTypesProvider>
          </TaskStatusesProvider>
          </TeamOneDriveProvider>
          </TeamGoogleDriveProvider>
        </TeamScopedFrontendModules>
        </PaymentPlansEnabledProvider>
      </AdminProvider>
    </TeamProvider>
  );
}
