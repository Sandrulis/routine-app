import { FileDetailPage } from "@/app/components/file-detail-page";

export default async function ListFilePage({
  params,
}: {
  params: Promise<{ listId: string; fileId: string }>;
}) {
  const { listId, fileId } = await params;
  return <FileDetailPage listId={listId} fileId={fileId} />;
}
