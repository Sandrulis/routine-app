import type { ReactNode } from "react";
import { AdminPanelShell } from "@/app/components/admin-panel-shell";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminPanelShell>{children}</AdminPanelShell>;
}
