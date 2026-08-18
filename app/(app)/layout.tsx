import type { ReactNode } from "react";
import { AppProviders } from "@/app/components/app-providers";
import { listTaskStatuses } from "@/app/lib/site-admin/repository";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureCurrentUserProfile();
  const taskStatuses = await listTaskStatuses();

  return <AppProviders taskStatuses={taskStatuses}>{children}</AppProviders>;
}
