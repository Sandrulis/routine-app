import { AdminRolesManager } from "@/app/components/admin-roles-manager";
import {
  listSiteLanguages,
  listSystemDefaultRoles,
} from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdmin();
  const [roles, languages] = await Promise.all([
    listSystemDefaultRoles(),
    listSiteLanguages(),
  ]);

  return <AdminRolesManager roles={roles} languages={languages} />;
}
