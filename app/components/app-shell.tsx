"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/app/components/app-nav";
import { GlobalAnnouncementsBanner } from "@/app/components/global-announcements-banner";
import { OpenPaidSeatBanner } from "@/app/components/open-paid-seat-banner";
import { TeamBillingMemberPaywall } from "@/app/components/team-billing-member-paywall";
import { TeamPlanInactiveBanner } from "@/app/components/team-plan-inactive-banner";
import { TeamSubscriptionEndingBanner } from "@/app/components/team-subscription-ending-banner";
import { PageBreadcrumb } from "@/app/components/page-breadcrumb";
import { SiteFooter } from "@/app/components/site-footer";
import { StripeInvalidKeyBanner } from "@/app/components/stripe-invalid-key-banner";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeamBillingLiveSync } from "@/app/lib/billing/use-team-billing-live-sync";
import { AccountDeletionReactivatedToast } from "@/app/components/account-deletion-reactivated-toast";
import type { SiteAnnouncementSummary } from "@/app/lib/announcements/types";

function TeamBillingLiveSync() {
  useTeamBillingLiveSync();
  return null;
}

export function AppShell({
  children,
  stripeKeyInvalid = false,
  announcements = [],
}: {
  children: ReactNode;
  stripeKeyInvalid?: boolean;
  announcements?: SiteAnnouncementSummary[];
}) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    function onChange() {
      if (media.matches) setMenuOpen(false);
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="min-h-dvh bg-zinc-100">
      <TeamBillingLiveSync />
      <AccountDeletionReactivatedToast />
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-900/40 lg:hidden"
          aria-label={t("actions.close", "Aizvērt")}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <AppNav mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-h-dvh flex-col pl-[var(--app-sidebar-width-expanded)]">
        <PageBreadcrumb
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <GlobalAnnouncementsBanner announcements={announcements} />
        <StripeInvalidKeyBanner visible={stripeKeyInvalid} />
        <TeamPlanInactiveBanner />
        <TeamSubscriptionEndingBanner />
        <OpenPaidSeatBanner />
        <TeamBillingMemberPaywall>
          <div className="flex-1">{children}</div>
        </TeamBillingMemberPaywall>
        <SiteFooter variant="app" />
      </div>
    </div>
  );
}
