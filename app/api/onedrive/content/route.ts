import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { backfillTextFileContent } from "@/app/lib/cloud-storage/backfill-text-content";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { downloadTeamOneDriveFile } from "@/app/lib/onedrive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { contentDispositionForFile } from "@/app/lib/security/file-bytes";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const [onedriveEnabled, filesEnabled] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.onedrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  if (!onedriveEnabled || !filesEnabled) {
    return NextResponse.json(
      { ok: false, error: "errors.onedrive_module_disabled" },
      { status: 404 },
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "errors.auth_required" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "errors.db_not_configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const kind = searchParams.get("kind");
  const id = searchParams.get("id")?.trim() ?? "";
  if ((kind !== "list" && kind !== "task") || !id) {
    return NextResponse.json(
      { ok: false, error: "errors.onedrive_upload_failed" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let listId = "";
  let teamId = "";
  let oneDriveFileId = "";
  let mimeType = "";
  let fileName = "file";
  let hasContent = false;

  if (kind === "list") {
    const { data, error } = await admin
      .from("list_files")
      .select("team_id, list_id, onedrive_file_id, mime_type, name, has_content")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.onedrive_file_id || !data.list_id) {
      return NextResponse.json(
        { ok: false, error: "errors.onedrive_upload_failed" },
        { status: 404 },
      );
    }
    listId = String(data.list_id);
    teamId = String(data.team_id);
    oneDriveFileId = String(data.onedrive_file_id);
    mimeType = String(data.mime_type || "");
    fileName = String(data.name ?? "file");
    hasContent = Boolean(data.has_content);
  } else {
    const { data, error } = await admin
      .from("task_files")
      .select("team_id, task_id, onedrive_file_id, mime_type, name, has_content")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.onedrive_file_id || !data.task_id) {
      return NextResponse.json(
        { ok: false, error: "errors.onedrive_upload_failed" },
        { status: 404 },
      );
    }
    const { data: task } = await admin
      .from("work_tasks")
      .select("list_id")
      .eq("id", data.task_id)
      .maybeSingle();
    if (!task?.list_id) {
      return NextResponse.json(
        { ok: false, error: "errors.onedrive_upload_failed" },
        { status: 404 },
      );
    }
    listId = String(task.list_id);
    teamId = String(data.team_id);
    oneDriveFileId = String(data.onedrive_file_id);
    mimeType = String(data.mime_type || "");
    fileName = String(data.name ?? "file");
    hasContent = Boolean(data.has_content);
  }

  const access = await assertListAccess(listId, "view");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: 403 });
  }

  try {
    const downloaded = await downloadTeamOneDriveFile({
      teamId,
      oneDriveFileId,
    });
    const storedMime = mimeType.trim().toLowerCase();
    const resolvedMime =
      (storedMime.startsWith("text/") ? mimeType : "") ||
      mimeType ||
      downloaded.mimeType ||
      "application/octet-stream";
    const asDownload = searchParams.get("download") === "1";
    const bytes = Buffer.from(downloaded.bytes);
    if (!hasContent) {
      void backfillTextFileContent({
        kind,
        fileId: id,
        fileName,
        mimeType: resolvedMime,
        bytes,
      });
    }
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": resolvedMime,
        "Content-Disposition": contentDispositionForFile(
          fileName,
          resolvedMime,
          asDownload,
        ),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    logError("OneDrive content fetch failed", err);
    return NextResponse.json(
      { ok: false, error: "errors.onedrive_upload_failed" },
      { status: 500 },
    );
  }
}
