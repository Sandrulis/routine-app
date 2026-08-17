import { TaskDetailPage } from "@/app/components/task-detail-page";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ listId: string; taskId: string }>;
}) {
  const { listId, taskId } = await params;
  return <TaskDetailPage listId={listId} taskId={taskId} />;
}
