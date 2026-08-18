import type { ReactNode } from "react";
import { AppProviders } from "@/app/components/app-providers";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureCurrentUserProfile();
  return <AppProviders>{children}</AppProviders>;
}
