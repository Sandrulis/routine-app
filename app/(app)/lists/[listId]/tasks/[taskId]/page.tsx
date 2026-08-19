import type { Metadata } from "next";
import { TaskDetailPage } from "@/app/components/task-detail-page";
import { fetchWorkTaskTitle } from "@/app/lib/document-title-server";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listId: string; taskId: string }>;
}): Promise<Metadata> {
  const { taskId } = await params;
  const title = await fetchWorkTaskTitle(taskId);
  return resolvedPageMetadata(title, "tasks.detail.missing", "Uzdevums nav atrasts");
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ listId: string; taskId: string }>;
}) {
  const { listId, taskId } = await params;
  return <TaskDetailPage listId={listId} taskId={taskId} />;
}
