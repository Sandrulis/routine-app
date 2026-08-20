import type { ReactNode } from "react";
import { AdminPanelShell } from "@/app/components/admin-panel-shell";
import { MfaVerifyModal } from "@/app/components/mfa-verify-modal";
import { requireAdminLayout } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { needsMfaVerify } = await requireAdminLayout();

  if (needsMfaVerify) {
    return (
      <AdminPanelShell>
        <MfaVerifyModal open mode="admin" />
      </AdminPanelShell>
    );
  }

  return <AdminPanelShell>{children}</AdminPanelShell>;
}
