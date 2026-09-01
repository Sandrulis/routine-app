import type { Metadata } from "next";
import { AdminDocsCategories } from "@/app/components/admin-docs-categories";
import { isDocsEnabled, listDocsCategories } from "@/app/lib/docs/repository";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.docs", "Docs");
}

export default async function AdminDocsPage() {
  await requireAdmin();
  const { languageCode } = await getServerTranslations();
  const [categories, enabled] = await Promise.all([
    listDocsCategories(languageCode),
    isDocsEnabled(),
  ]);

  return <AdminDocsCategories categories={categories} enabled={enabled} />;
}
