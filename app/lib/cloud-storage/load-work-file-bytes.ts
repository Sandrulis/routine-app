import { backfillTextFileContent } from "@/app/lib/cloud-storage/backfill-text-content";
import { downloadTeamGoogleDriveFile } from "@/app/lib/google-drive/uploader";
import { downloadTeamOneDriveFile } from "@/app/lib/onedrive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { MAX_STORED_FILE_BYTES } from "@/app/lib/list-files";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

const MAX_PREVIEW_BYTES = 25 * 1024 * 1024;

function dataUrlToBytes(content: string): { bytes: Buffer; mimeType?: string } | null {
  const trimmed = content.trim();
  const match = trimmed.match(/^data:([^;,]+)?(?:;charset=[^;,]+)?(;base64)?,([\s\S]*)$/i);
  if (!match) {
    if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 16) {
      try {
        return { bytes: Buffer.from(trimmed.replace(/\s+/g, ""), "base64") };
      } catch {
        return null;
      }
    }
    return { bytes: Buffer.from(trimmed, "utf8"), mimeType: "text/plain" };
  }
  const mimeType = match[1]?.trim() || undefined;
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? "";
  try {
    const bytes = isBase64
      ? Buffer.from(payload.replace(/\s+/g, ""), "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    return { bytes, mimeType };
  } catch {
    return null;
  }
}

export type LoadedWorkFileBytes = {
  fileName: string;
  mimeType: string;
  bytes: Buffer;
  hasContent: boolean;
};

/**
 * Load list/task file bytes for preview/download: DB text content first, then Drive, then OneDrive.
 * Uses admin client (same approach as file forward) — no frontend-module gate.
 */
export async function loadWorkFileBytes(input: {
  kind: "list" | "task";
  fileId: string;
}): Promise<
  | { ok: true; file: LoadedWorkFileBytes }
  | { ok: false; error: string; status: number }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured", status: 503 };
  }

  const admin = createAdminClient();
  let listId = "";
  let teamId = "";
  let fileName = "file";
  let mimeType = "application/octet-stream";
  let hasContent = false;
  let rawContent: string | null = null;
  let driveFileId = "";
  let oneDriveFileId = "";

  if (input.kind === "list") {
    const { data, error } = await admin
      .from("list_files")
      .select(
        "team_id, list_id, name, mime_type, size, content, has_content, google_drive_file_id, onedrive_file_id",
      )
      .eq("id", input.fileId)
      .maybeSingle();
    if (error || !data?.list_id || !data.team_id) {
      return { ok: false, error: "errors.not_found", status: 404 };
    }
    listId = String(data.list_id);
    teamId = String(data.team_id);
    fileName = String(data.name ?? "file");
    mimeType = String(data.mime_type || "application/octet-stream");
    hasContent = Boolean(data.has_content);
    rawContent = typeof data.content === "string" ? data.content : null;
    driveFileId =
      typeof data.google_drive_file_id === "string"
        ? data.google_drive_file_id.trim()
        : "";
    oneDriveFileId =
      typeof data.onedrive_file_id === "string" ? data.onedrive_file_id.trim() : "";
  } else {
    const { data, error } = await admin
      .from("task_files")
      .select(
        "team_id, task_id, name, mime_type, size, content, has_content, google_drive_file_id, onedrive_file_id",
      )
      .eq("id", input.fileId)
      .maybeSingle();
    if (error || !data?.task_id || !data.team_id) {
      return { ok: false, error: "errors.not_found", status: 404 };
    }
    const { data: task } = await admin
      .from("work_tasks")
      .select("list_id")
      .eq("id", data.task_id)
      .maybeSingle();
    if (!task?.list_id) {
      return { ok: false, error: "errors.not_found", status: 404 };
    }
    listId = String(task.list_id);
    teamId = String(data.team_id);
    fileName = String(data.name ?? "file");
    mimeType = String(data.mime_type || "application/octet-stream");
    hasContent = Boolean(data.has_content);
    rawContent = typeof data.content === "string" ? data.content : null;
    driveFileId =
      typeof data.google_drive_file_id === "string"
        ? data.google_drive_file_id.trim()
        : "";
    oneDriveFileId =
      typeof data.onedrive_file_id === "string" ? data.onedrive_file_id.trim() : "";
  }

  const access = await assertListAccess(listId, "view");
  if (!access.ok) {
    return { ok: false, error: access.error, status: 403 };
  }

  if (rawContent && (hasContent || rawContent.length > 0)) {
    const parsed = dataUrlToBytes(rawContent);
    if (parsed && parsed.bytes.length > 0 && parsed.bytes.length <= MAX_PREVIEW_BYTES) {
      return {
        ok: true,
        file: {
          fileName,
          mimeType: parsed.mimeType || mimeType,
          bytes: parsed.bytes,
          hasContent: true,
        },
      };
    }
  }

  if (driveFileId) {
    try {
      const downloaded = await downloadTeamGoogleDriveFile({
        teamId,
        driveFileId,
      });
      if (downloaded.bytes.byteLength > MAX_PREVIEW_BYTES) {
        return { ok: false, error: "errors.extension_file_too_large", status: 413 };
      }
      const bytes = Buffer.from(downloaded.bytes);
      const resolvedMime = mimeType.startsWith("text/")
        ? mimeType
        : downloaded.mimeType || mimeType;
      if (!hasContent && bytes.length <= MAX_STORED_FILE_BYTES) {
        void backfillTextFileContent({
          kind: input.kind,
          fileId: input.fileId,
          fileName,
          mimeType: resolvedMime,
          bytes,
        });
      }
      return {
        ok: true,
        file: {
          fileName,
          mimeType: resolvedMime,
          bytes,
          hasContent: false,
        },
      };
    } catch (error) {
      logError("loadWorkFileBytes Drive failed", error);
    }
  }

  if (oneDriveFileId) {
    try {
      const downloaded = await downloadTeamOneDriveFile({
        teamId,
        oneDriveFileId,
      });
      if (downloaded.bytes.byteLength > MAX_PREVIEW_BYTES) {
        return { ok: false, error: "errors.extension_file_too_large", status: 413 };
      }
      const bytes = Buffer.from(downloaded.bytes);
      const resolvedMime = mimeType.startsWith("text/")
        ? mimeType
        : downloaded.mimeType || mimeType;
      if (!hasContent && bytes.length <= MAX_STORED_FILE_BYTES) {
        void backfillTextFileContent({
          kind: input.kind,
          fileId: input.fileId,
          fileName,
          mimeType: resolvedMime,
          bytes,
        });
      }
      return {
        ok: true,
        file: {
          fileName,
          mimeType: resolvedMime,
          bytes,
          hasContent: false,
        },
      };
    } catch (error) {
      logError("loadWorkFileBytes OneDrive failed", error);
    }
  }

  return { ok: false, error: "errors.not_found", status: 404 };
}
