import { AdminUsersManager } from "@/app/components/admin-users-manager";
import { listAdminUsers } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireAdmin();
  const users = await listAdminUsers();

  return <AdminUsersManager users={users} currentUserId={user.id} />;
}
