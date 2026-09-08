"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/app/components/app-nav";
import { GlobalAnnouncementsBanner } from "@/app/components/global-announcements-banner";
import { OpenPaidSeatBanner } from "@/app/components/open-paid-seat-banner";
import { PendingTeamInviteModal } from "@/app/components/pending-team-invite-modal";
import { TeamBillingMemberPaywall } from "@/app/components/team-billing-member-paywall";
import { TeamPlanInactiveBanner } from "@/app/components/team-plan-inactive-banner";
import { TeamSubscriptionEndingBanner } from "@/app/components/team-subscription-ending-banner";
import { PageBreadcrumb } from "@/app/components/page-breadcrumb";
import { SiteFooter } from "@/app/components/site-footer";
import { StripeInvalidKeyBanner } from "@/app/components/stripe-invalid-key-banner";
import { UserTodoRail } from "@/app/components/user-todo-rail";
import { useTranslations } from "@/app/components/translations-provider";
import { useTeamBillingLiveSync } from "@/app/lib/billing/use-team-billing-live-sync";
import { AccountDeletionReactivatedToast } from "@/app/components/account-deletion-reactivated-toast";
import type { SiteAnnouncementSummary } from "@/app/lib/announcements/types";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { SIDEBAR_EXPANDED_MEDIA } from "@/app/lib/sidebar-layout";
import { useUserTodos } from "@/app/lib/use-user-todos";
import { TODO_RAIL_COLLAPSED_STORAGE_KEY } from "@/app/lib/user-todos";

function TeamBillingLiveSync() {
  useTeamBillingLiveSync();
  return null;
}

function persistTodoCollapsed(collapsed: boolean) {
  try {
    window.localStorage.setItem(
      TODO_RAIL_COLLAPSED_STORAGE_KEY,
      collapsed ? "1" : "0",
    );
  } catch {
    /* ignore quota / private mode */
  }
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
  const { isEnabled } = useFrontendModules();
  const { user, isReady: sessionReady } = useAuthSession();
  const todoEnabled = isEnabled(FRONTEND_MODULE_KEYS.todo);
  const todos = useUserTodos(todoEnabled && sessionReady ? user?.id ?? null : null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [todoOpen, setTodoOpen] = useState(false);
  const [todoCollapsed, setTodoCollapsed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setTodoOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setTodoCollapsed(
        window.localStorage.getItem(TODO_RAIL_COLLAPSED_STORAGE_KEY) === "1",
      );
    } catch {
      setTodoCollapsed(false);
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia(SIDEBAR_EXPANDED_MEDIA);
    function onChange() {
      if (media.matches) {
        setMenuOpen(false);
        setTodoOpen(false);
      }
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen && !todoOpen) return;
    if (window.matchMedia(SIDEBAR_EXPANDED_MEDIA).matches) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      setTodoOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen, todoOpen]);

  function hideTodoRail() {
    setTodoOpen(false);
    if (window.matchMedia(SIDEBAR_EXPANDED_MEDIA).matches) {
      setTodoCollapsed(true);
      persistTodoCollapsed(true);
    }
  }

  function showTodoRail() {
    if (window.matchMedia(SIDEBAR_EXPANDED_MEDIA).matches) {
      setTodoCollapsed(false);
      persistTodoCollapsed(false);
      return;
    }
    setMenuOpen(false);
    setTodoOpen((open) => !open);
  }

  return (
    <div
      className={`min-h-dvh bg-zinc-100 ${
        todoEnabled && !todoCollapsed ? "has-todo-rail" : ""
      }`}
    >
      <TeamBillingLiveSync />
      <AccountDeletionReactivatedToast />
      <PendingTeamInviteModal />
      {menuOpen || todoOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-zinc-900/40 xl:hidden"
          aria-label={t("actions.close", "Aizvērt")}
          onClick={() => {
            setMenuOpen(false);
            setTodoOpen(false);
          }}
        />
      ) : null}
      <AppNav
        mobileOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <UserTodoRail
        collapsed={todoCollapsed}
        mobileOpen={todoOpen}
        onClose={hideTodoRail}
        sessionReady={sessionReady}
        todos={todos}
      />
      <div className="flex min-h-dvh flex-col pl-[var(--app-sidebar-width-expanded)] pr-[var(--app-todo-rail-width-expanded)]">
        <PageBreadcrumb
          menuOpen={menuOpen}
          onOpenMenu={() => {
            setTodoOpen(false);
            setMenuOpen(true);
          }}
          todoOpen={todoOpen}
          todoEnabled={todoEnabled}
          todoCollapsed={todoCollapsed}
          todoActiveCount={todos.activeItems.length}
          onOpenTodo={showTodoRail}
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
