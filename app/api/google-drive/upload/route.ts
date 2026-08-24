import { NextResponse } from "next/server";
import { parsePathParts } from "@/app/lib/cloud-storage/parse-path-parts";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { GOOGLE_DRIVE_UPLOAD_MAX_BYTES } from "@/app/lib/google-drive/env";
import { uploadTeamFileToGoogleDrive } from "@/app/lib/google-drive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { mimeFromFileName } from "@/app/lib/file-types";
import { logError } from "@/app/lib/security/log-error";
import { looksLikeHtml, mimeMatchesBytes } from "@/app/lib/security/file-bytes";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { requestClientIp } from "@/app/lib/security/client-ip";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const [driveEnabled, filesEnabled] = await Promise.all([
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive),
    isFrontendModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload),
  ]);
  if (!driveEnabled || !filesEnabled) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "errors.auth_required" }, { status: 401 });
  }

  const limited = await consumeRateLimit(
    `drive-upload:${requestClientIp(request)}:${user.id}`,
    40,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return NextResponse.json({ ok: false, error: "errors.auth_rate_limited" }, { status: 429 });
  }

  const form = await request.formData();
  const teamId = String(form.get("teamId") ?? "").trim();
  const listId = String(form.get("listId") ?? "").trim();
  const file = form.get("file");
  if (!teamId || !listId || !(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ ok: false, error: "errors.google_drive_upload_failed" }, { status: 400 });
  }
  if (file.size > GOOGLE_DRIVE_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "errors.google_drive_file_too_large" }, { status: 400 });
  }

  const access = await assertListAccess(listId, "edit");
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.error }, { status: 403 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = mimeFromFileName(file.name) || file.type || "application/octet-stream";
  if (
    !mimeMatchesBytes(file.name, mimeType, bytes) ||
    (looksLikeHtml(bytes) &&
      !file.name.toLowerCase().endsWith(".html") &&
      !file.name.toLowerCase().endsWith(".htm") &&
      !file.name.toLowerCase().endsWith(".txt"))
  ) {
    return NextResponse.json({ ok: false, error: "errors.file_type_mismatch" }, { status: 400 });
  }

  try {
    const result = await uploadTeamFileToGoogleDrive({
      teamId,
      fileName: file.name,
      mimeType,
      bytes,
      pathParts: parsePathParts(form.get("pathParts")),
    });
    return NextResponse.json(result);
  } catch (error) {
    logError("Google Drive upload failed", error);
    return NextResponse.json({ ok: false, error: "errors.google_drive_upload_failed" }, { status: 500 });
  }
}
