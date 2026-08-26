import type { Metadata } from "next";
import { AdminPaymentPlansForm } from "@/app/components/admin-payment-plans-form";
import { listFrontendModules } from "@/app/lib/frontend-modules/repository";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { isStripeEnabled } from "@/app/lib/integrations/stripe/client";
import {
  getEarlyBirdSettings,
  getTrialSettings,
  isPaymentPlansEnabled,
  listPaymentPlans,
} from "@/app/lib/payment-plans/repository";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.payment_plans", "Maksas plāni");
}

export default async function AdminPaymentPlansPage() {
  await requireAdmin();
  const [enabled, stripeEnabled, plans, modules, languages, trial, earlyBird] =
    await Promise.all([
      isPaymentPlansEnabled(),
      isStripeEnabled(),
      listPaymentPlans(),
      listFrontendModules(),
      listSiteLanguages(),
      getTrialSettings(),
      getEarlyBirdSettings(),
    ]);

  return (
    <AdminPaymentPlansForm
      initialEnabled={enabled}
      stripeEnabled={stripeEnabled}
      initialPlans={plans}
      initialTrial={trial}
      initialEarlyBird={earlyBird}
      modules={modules}
      languages={languages}
    />
  );
}
