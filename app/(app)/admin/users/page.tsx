import type { Metadata } from "next";
import { AdminUsersManager } from "@/app/components/admin-users-manager";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { listAdminUsers } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.users", "Lietotāji");
}

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await listAdminUsers();

  return <AdminUsersManager users={users} currentUserId={user.id} />;
}
