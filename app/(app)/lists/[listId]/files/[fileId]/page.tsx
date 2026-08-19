import type { Metadata } from "next";
import { FileDetailPage } from "@/app/components/file-detail-page";
import { fetchListFileName } from "@/app/lib/document-title-server";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listId: string; fileId: string }>;
}): Promise<Metadata> {
  const { fileId } = await params;
  const name = await fetchListFileName(fileId);
  return resolvedPageMetadata(name, "files.detail.missing", "Fails nav atrasts");
}

export default async function ListFilePage({
  params,
}: {
  params: Promise<{ listId: string; fileId: string }>;
}) {
  const { listId, fileId } = await params;
  return <FileDetailPage listId={listId} fileId={fileId} />;
}
