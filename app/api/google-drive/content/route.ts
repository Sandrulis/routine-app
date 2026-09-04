import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { openTeamGoogleDriveFile } from "@/app/lib/google-drive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { contentDispositionForFile } from "@/app/lib/security/file-bytes";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const [driveEnabled, filesEnabled] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  if (!driveEnabled || !filesEnabled) {
    return NextResponse.json(
      { ok: false, error: "errors.google_drive_module_disabled" },
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
      { ok: false, error: "errors.google_drive_upload_failed" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let listId = "";
  let teamId = "";
  let driveFileId = "";
  let mimeType = "";
  let fileName = "file";

  if (kind === "list") {
    const { data, error } = await admin
      .from("list_files")
      .select("team_id, list_id, google_drive_file_id, mime_type, name")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.google_drive_file_id || !data.list_id) {
      return NextResponse.json(
        { ok: false, error: "errors.google_drive_upload_failed" },
        { status: 404 },
      );
    }
    listId = String(data.list_id);
    teamId = String(data.team_id);
    driveFileId = String(data.google_drive_file_id);
    mimeType = String(data.mime_type || "");
    fileName = String(data.name ?? "file");
  } else {
    const { data, error } = await admin
      .from("task_files")
      .select("team_id, task_id, google_drive_file_id, mime_type, name")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.google_drive_file_id || !data.task_id) {
      return NextResponse.json(
        { ok: false, error: "errors.google_drive_upload_failed" },
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
        { ok: false, error: "errors.google_drive_upload_failed" },
        { status: 404 },
      );
    }
    listId = String(task.list_id);
    teamId = String(data.team_id);
    driveFileId = String(data.google_drive_file_id);
    mimeType = String(data.mime_type || "");
    fileName = String(data.name ?? "file");
  }

  const access = await assertListAccess(listId, "view");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: 403 });
  }

  const asDownload = searchParams.get("download") === "1";

  try {
    const opened = await openTeamGoogleDriveFile({
      teamId,
      driveFileId,
      preferPdf: !asDownload,
    });
    const resolvedMime = opened.mimeType || mimeType || "application/octet-stream";
    const headers = {
      "Content-Type": resolvedMime,
      "Content-Disposition": contentDispositionForFile(
        fileName,
        resolvedMime,
        asDownload,
      ),
      "Cache-Control": "private, no-store",
    };
    if (!opened.response.body) {
      const bytes = await opened.response.arrayBuffer();
      return new NextResponse(Buffer.from(bytes), { status: 200, headers });
    }
    return new NextResponse(opened.response.body, { status: 200, headers });
  } catch (err) {
    logError("Google Drive content fetch failed", err);
    return NextResponse.json(
      { ok: false, error: "errors.google_drive_upload_failed" },
      { status: 500 },
    );
  }
}
