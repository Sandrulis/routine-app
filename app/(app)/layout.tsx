import type { ReactNode } from "react";
import { AppProviders } from "@/app/components/app-providers";
import {
  listFileTypeExtensions,
  listTaskStatuses,
} from "@/app/lib/site-admin/repository";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureCurrentUserProfile();
  const [taskStatuses, fileTypeExtensions] = await Promise.all([
    listTaskStatuses(),
    listFileTypeExtensions(),
  ]);

  return (
    <AppProviders taskStatuses={taskStatuses} fileTypeExtensions={fileTypeExtensions}>
      {children}
    </AppProviders>
  );
}
