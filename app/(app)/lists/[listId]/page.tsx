import type { Metadata } from "next";
import { ListDetailPage } from "@/app/components/list-detail-page";
import { fetchWorkListName } from "@/app/lib/document-title-server";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listId: string }>;
}): Promise<Metadata> {
  const { listId } = await params;
  const name = await fetchWorkListName(listId);
  return resolvedPageMetadata(name, "lists.detail.missing", "Saraksts nav atrasts");
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  return <ListDetailPage listId={listId} />;
}
