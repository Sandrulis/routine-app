"use client";

import type { ReactNode } from "react";
import { AppNav } from "@/app/components/app-nav";
import { OpenPaidSeatBanner } from "@/app/components/open-paid-seat-banner";
import { PageBreadcrumb } from "@/app/components/page-breadcrumb";
import { SiteFooter } from "@/app/components/site-footer";
import { StripeInvalidKeyBanner } from "@/app/components/stripe-invalid-key-banner";

export function AppShell({
  children,
  stripeKeyInvalid = false,
}: {
  children: ReactNode;
  stripeKeyInvalid?: boolean;
}) {
  return (
    <div className="min-h-dvh bg-zinc-100">
      <AppNav />
      <div className="flex min-h-dvh flex-col pl-[var(--app-sidebar-width-expanded)]">
        <PageBreadcrumb />
        <StripeInvalidKeyBanner visible={stripeKeyInvalid} />
        <OpenPaidSeatBanner />
        <div className="flex-1">{children}</div>
        <SiteFooter variant="app" />
      </div>
    </div>
  );
}
