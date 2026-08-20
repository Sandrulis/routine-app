import {
  cacheTaskFileContent,
  readTaskFileContent,
} from "@/app/lib/task-activity";
import {
  cacheListFileContent,
  readListFileContent,
} from "@/app/lib/list-files";
import {
  fetchListFileContent,
  fetchTaskFileContent,
} from "@/app/lib/db/work-data";

export async function ensureTaskFileContent(fileId: string): Promise<string | null> {
  const cached = readTaskFileContent(fileId);
  if (cached) return cached;
  const content = await fetchTaskFileContent(fileId);
  cacheTaskFileContent(fileId, content);
  return content;
}

export async function ensureListFileContent(fileId: string): Promise<string | null> {
  const cached = readListFileContent(fileId);
  if (cached) return cached;
  const content = await fetchListFileContent(fileId);
  cacheListFileContent(fileId, content);
  return content;
}
