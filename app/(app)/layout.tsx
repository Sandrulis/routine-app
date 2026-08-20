import type { ReactNode } from "react";
import { AppProviders } from "@/app/components/app-providers";
import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import {
  listFileTypeExtensions,
  listTaskStatuses,
} from "@/app/lib/site-admin/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureCurrentUserProfile();

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    if ((await getMfaGate(supabase)) === "verify") {
      return (
        <div className="min-h-screen bg-zinc-50">
          <MfaVerifyModal open mode="login" />
        </div>
      );
    }
  }

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
