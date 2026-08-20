import type { Metadata } from "next";
import { TaskFileDetailPage } from "@/app/components/task-file-detail-page";
import { fetchTaskFileName } from "@/app/lib/document-title-server";
import { requireFrontendModule } from "@/app/lib/frontend-modules/access";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { resolvedPageMetadata } from "@/app/lib/page-metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listId: string; taskId: string; fileId: string }>;
}): Promise<Metadata> {
  const { fileId } = await params;
  const name = await fetchTaskFileName(fileId);
  return resolvedPageMetadata(name, "files.detail.missing", "Fails nav atrasts");
}

export default async function TaskFilePage({
  params,
}: {
  params: Promise<{ listId: string; taskId: string; fileId: string }>;
}) {
  const { listId, taskId, fileId } = await params;
  await requireFrontendModule(FRONTEND_MODULE_KEYS.fileUpload);
  return (
    <TaskFileDetailPage listId={listId} taskId={taskId} fileId={fileId} />
  );
}
