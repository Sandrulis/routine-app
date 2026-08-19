import type { Metadata } from "next";
import { AdminLanguagesForm } from "@/app/components/admin-languages-form";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { listSiteLanguages } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.languages", "Valodas");
}

export default async function AdminLanguagesPage() {
  await requireAdmin();
  const languages = await listSiteLanguages();

  return <AdminLanguagesForm initialLanguages={languages} />;
}
