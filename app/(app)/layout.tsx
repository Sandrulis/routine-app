import type { ReactNode } from "react";
import { AppProviders } from "@/app/components/app-providers";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import {
  listFileTypeExtensions,
  listTaskStatuses,
} from "@/app/lib/site-admin/repository";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureCurrentUserProfile();
  const [taskStatuses, fileTypeExtensions, enabledFrontendModuleKeys] =
    await Promise.all([
      listTaskStatuses(),
      listFileTypeExtensions(),
      getEnabledFrontendModuleKeys(),
    ]);

  return (
    <AppProviders
      taskStatuses={taskStatuses}
      fileTypeExtensions={fileTypeExtensions}
      enabledFrontendModuleKeys={[...enabledFrontendModuleKeys]}
    >
      {children}
    </AppProviders>
  );
}
