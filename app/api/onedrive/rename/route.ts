import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { renameTeamOneDriveFile } from "@/app/lib/onedrive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { logError } from "@/app/lib/security/log-error";
import { createAdminClient } from "@/app/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/app/lib/supabase/env";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [onedriveEnabled, filesEnabled] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.onedrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  if (!onedriveEnabled || !filesEnabled) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "errors.auth_required" }, { status: 401 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: false, error: "errors.db_not_configured" }, { status: 503 });
  }

  let body: { kind?: string; id?: string; name?: string };
  try {
    body = (await request.json()) as { kind?: string; id?: string; name?: string };
  } catch {
    return NextResponse.json(
      { ok: false, error: "errors.onedrive_upload_failed" },
      { status: 400 },
    );
  }

  const kind = body.kind;
  const id = body.id?.trim() ?? "";
  const name = body.name?.trim() ?? "";
  if ((kind !== "list" && kind !== "task") || !id || !name) {
    return NextResponse.json(
      { ok: false, error: "errors.onedrive_upload_failed" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  let listId = "";
  let teamId = "";
  let oneDriveFileId = "";

  if (kind === "list") {
    const { data, error } = await admin
      .from("list_files")
      .select("team_id, list_id, onedrive_file_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.team_id || !data.list_id) {
      return NextResponse.json(
        { ok: false, error: "errors.onedrive_upload_failed" },
        { status: 404 },
      );
    }
    listId = String(data.list_id);
    teamId = String(data.team_id);
    oneDriveFileId = String(data.onedrive_file_id ?? "");
  } else {
    const { data, error } = await admin
      .from("task_files")
      .select("team_id, task_id, onedrive_file_id")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.team_id || !data.task_id) {
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
    oneDriveFileId = String(data.onedrive_file_id ?? "");
  }

  const access = await assertListAccess(listId, "edit");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: 403 });
  }

  if (!oneDriveFileId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const result = await renameTeamOneDriveFile({
      teamId,
      oneDriveFileId,
      fileName: name,
    });
    return NextResponse.json(result);
  } catch (err) {
    logError("OneDrive rename failed", err);
    return NextResponse.json(
      { ok: false, error: "errors.onedrive_upload_failed" },
      { status: 500 },
    );
  }
}
