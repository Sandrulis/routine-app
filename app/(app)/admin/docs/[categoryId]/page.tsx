import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { AdminDocsArticles } from "@/app/components/admin-docs-articles";
import { getDocsCategory, listDocsArticles } from "@/app/lib/docs/repository";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";
import { requireAdmin } from "@/app/lib/users/require-admin";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}): Promise<Metadata> {
  const { categoryId } = await params;
  const category = await getDocsCategory(categoryId);
  return resolvedPageMetadata(category?.title, "admin.nav.docs", "Docs");
}

export default async function AdminDocsCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  await requireAdmin();
  const { categoryId } = await params;
  const category = await getDocsCategory(categoryId);
  if (!category) redirect("/admin/docs");
  const articles = await listDocsArticles(category.id);

  return <AdminDocsArticles category={category} articles={articles} />;
}
