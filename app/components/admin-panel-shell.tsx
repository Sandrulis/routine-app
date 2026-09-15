"use client";

import type { ReactNode } from "react";
import { AdminSubmenu } from "@/app/components/admin-submenu";
import { SectionPage } from "@/app/components/section-page";
import { useTranslations } from "@/app/components/translations-provider";
import type { AdminNavCounts } from "@/app/lib/site-admin/types";

export function AdminPanelShell({
  children,
  counts,
}: {
  children: ReactNode;
  counts?: AdminNavCounts;
}) {
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
        <AdminSubmenu counts={counts} />
        {children}
      </div>
    </SectionPage>
  );
}
