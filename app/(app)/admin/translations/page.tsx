import { AdminTranslationsManager } from "@/app/components/admin-translations-manager";
import {
  listSiteLanguages,
  listSiteTranslations,
} from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminTranslationsPage() {
  await requireAdmin();
  const [languages, translations] = await Promise.all([
    listSiteLanguages(),
    listSiteTranslations(),
  ]);

  return (
    <AdminTranslationsManager translations={translations} languages={languages} />
  );
}
