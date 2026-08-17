import { ListDetailPage } from "@/app/components/list-detail-page";

export default async function ListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  return <ListDetailPage listId={listId} />;
}
