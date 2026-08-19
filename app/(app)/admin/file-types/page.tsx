import { AdminFileTypesManager } from "@/app/components/admin-file-types-manager";
import { listFileTypeExtensions } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminFileTypesPage() {
  await requireAdmin();
  const extensions = await listFileTypeExtensions();

  return <AdminFileTypesManager extensions={extensions} />;
}
