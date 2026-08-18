import { AdminTeamsManager } from "@/app/components/admin-teams-manager";
import { listAdminTeams } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await listAdminTeams();

  return <AdminTeamsManager teams={teams} />;
}
