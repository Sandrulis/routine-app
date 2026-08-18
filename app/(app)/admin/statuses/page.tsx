import { AdminStatusesManager } from "@/app/components/admin-statuses-manager";
import {
  listSiteLanguages,
  listTaskStatuses,
} from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminStatusesPage() {
  await requireAdmin();
  const [statuses, languages] = await Promise.all([
    listTaskStatuses(),
    listSiteLanguages(),
  ]);

  return <AdminStatusesManager statuses={statuses} languages={languages} />;
}
