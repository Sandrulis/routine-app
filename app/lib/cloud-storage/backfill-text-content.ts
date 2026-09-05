import { MAX_STORED_FILE_BYTES } from "@/app/lib/list-files";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";

function isPreviewTextFile(name: string, mimeType: string) {
  const mime = mimeType.trim().toLowerCase();
  if (mime.startsWith("text/") || mime === "application/json") return true;
  return /\.(txt|html|htm|csv|json|md|log)$/i.test(name.trim());
}

function bytesToDataUrl(mimeType: string, bytes: Buffer) {
  const mime = mimeType.trim() || "text/plain";
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

/** Persist small text/email bytes so the next preview does not depend on Drive/OneDrive. */
export async function backfillTextFileContent(input: {
  kind: "list" | "task";
  fileId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}) {
  if (!isPreviewTextFile(input.fileName, input.mimeType)) return;
  if (input.bytes.length <= 0 || input.bytes.length > MAX_STORED_FILE_BYTES) return;

  const mime = input.mimeType.trim() || "text/plain";
  const content = bytesToDataUrl(mime, input.bytes);
  const table = input.kind === "list" ? "list_files" : "task_files";

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from(table)
      .update({ content, has_content: true })
      .eq("id", input.fileId)
      .eq("has_content", false);
    if (error) {
      logError(`backfillTextFileContent ${table} failed`, error);
    }
  } catch (error) {
    logError("backfillTextFileContent failed", error);
  }
}
