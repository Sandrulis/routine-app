import type { Metadata } from "next";
import { AdminFileTypesManager } from "@/app/components/admin-file-types-manager";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { listFileTypeExtensions } from "@/app/lib/site-admin/repository";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata("admin.nav.file_types", "Failu tipi");
}

export default async function AdminFileTypesPage() {
  await requireAdmin();
  const extensions = await listFileTypeExtensions();

  return <AdminFileTypesManager extensions={extensions} />;
}
