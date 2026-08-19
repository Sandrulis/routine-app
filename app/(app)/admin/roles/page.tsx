import type { Metadata } from "next";
import { AdminRolesManager } from "@/app/components/admin-roles-manager";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import {
  listSiteLanguages,
  listSystemDefaultRoles,
} from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.roles", "Lomas");
}

export default async function AdminRolesPage() {
  await requireAdmin();
  const [roles, languages] = await Promise.all([
    listSystemDefaultRoles(),
    listSiteLanguages(),
  ]);

  return <AdminRolesManager roles={roles} languages={languages} />;
}
