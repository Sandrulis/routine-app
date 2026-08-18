import { AdminLanguagesForm } from "@/app/components/admin-languages-form";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminLanguagesPage() {
  await requireAdmin();
  const languages = await listSiteLanguages();

  return <AdminLanguagesForm initialLanguages={languages} />;
}
