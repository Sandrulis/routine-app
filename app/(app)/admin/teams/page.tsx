import type { Metadata } from "next";
import { AdminTeamsManager } from "@/app/components/admin-teams-manager";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { listAdminTeams } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.teams", "Komandas");
}

export default async function AdminTeamsPage() {
  await requireAdmin();
  const teams = await listAdminTeams();

  return <AdminTeamsManager teams={teams} />;
}
