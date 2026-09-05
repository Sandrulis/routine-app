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
import { logError } from "@/app/lib/security/log-error";

export async function ensureTaskFileContent(fileId: string): Promise<string | null> {
  const cached = readTaskFileContent(fileId);
  if (cached) return cached;
  try {
    const content = await fetchTaskFileContent(fileId);
    cacheTaskFileContent(fileId, content);
    return content;
  } catch (error) {
    logError("ensureTaskFileContent failed", error);
    return null;
  }
}

export async function ensureListFileContent(fileId: string): Promise<string | null> {
  const cached = readListFileContent(fileId);
  if (cached) return cached;
  try {
    const content = await fetchListFileContent(fileId);
    cacheListFileContent(fileId, content);
    return content;
  } catch (error) {
    logError("ensureListFileContent failed", error);
    return null;
  }
}
