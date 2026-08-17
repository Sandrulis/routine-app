"use client";

import type { ReactNode } from "react";
import { AppNav } from "@/app/components/app-nav";
import { PageBreadcrumb } from "@/app/components/page-breadcrumb";
import { SiteFooter } from "@/app/components/site-footer";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-100">
      <AppNav />
      <div className="flex min-h-dvh flex-col pl-[var(--app-sidebar-width-expanded)]">
        <PageBreadcrumb />
        <div className="flex-1">{children}</div>
        <SiteFooter variant="app" />
      </div>
    </div>
  );
}
