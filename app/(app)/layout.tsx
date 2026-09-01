import type { ReactNode } from "react";
import type { Metadata } from "next";
import { AppProviders } from "@/app/components/app-providers";
import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";
import { listVisibleSiteAnnouncements } from "@/app/lib/announcements/visible";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import { stripeInvalidKeyNoticeForCurrentAdmin } from "@/app/lib/integrations/stripe/notice";
import {
  getPaymentPlansEnabledCached,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import {
  listFileTypeExtensions,
  listTaskStatuses,
} from "@/app/lib/site-admin/repository";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";
import { createClient } from "@/app/lib/supabase/server";
import { ensureCurrentUserProfile } from "@/app/lib/users/ensure-profile";
import { NO_INDEX_ROBOTS } from "@/app/lib/seo/metadata";

export const metadata: Metadata = {
  robots: NO_INDEX_ROBOTS,
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  await ensureCurrentUserProfile();
  if (isSupabaseConfigured()) {
    const { syncPendingTeamInvitesForCurrentUser } = await import("@/app/lib/team/actions");
    await syncPendingTeamInvitesForCurrentUser();
  }

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

  const [
    taskStatuses,
    fileTypeExtensions,
    enabledFrontendModuleKeys,
    paymentPlansEnabled,
    paymentPlans,
    stripeKeyInvalid,
    announcements,
  ] =
    await Promise.all([
      listTaskStatuses(),
      listFileTypeExtensions(),
      getEnabledFrontendModuleKeys(),
      getPaymentPlansEnabledCached(),
      listPaymentPlans(),
      stripeInvalidKeyNoticeForCurrentAdmin(),
      listVisibleSiteAnnouncements(),
    ]);

  return (
    <AppProviders
      taskStatuses={taskStatuses}
      fileTypeExtensions={fileTypeExtensions}
      enabledFrontendModuleKeys={[...enabledFrontendModuleKeys]}
      paymentPlansEnabled={paymentPlansEnabled}
      paymentPlans={paymentPlans.map((plan) => ({
        id: plan.id,
        moduleKeys: plan.moduleKeys,
        isFree: plan.isFree,
      }))}
      stripeKeyInvalid={stripeKeyInvalid}
      announcements={announcements}
    >
      {children}
    </AppProviders>
  );
}
