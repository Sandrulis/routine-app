"use client";

import type { ReactNode } from "react";
import { AdminSubmenu } from "@/app/components/admin-submenu";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";

export function AdminPanelShell({ children }: { children: ReactNode }) {
  const { t } = useTranslations();

  return (
    <SectionPage
      title={t("admin.panel.title", "Administrācijas panelis")}
      subtitle={t(
        "admin.page.subtitle",
        "Sistēmas iestatījumi. Pieejams tikai administratoriem.",
      )}
    >
      <div className="space-y-5">
        <AdminSubmenu />
        {children}
      </div>
    </SectionPage>
  );
}
