import { NextResponse } from "next/server";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { isFrontendModuleEnabled } from "@/app/lib/frontend-modules/repository";
import { GOOGLE_DRIVE_UPLOAD_MAX_BYTES } from "@/app/lib/google-drive/env";
import { assertTeamMember } from "@/app/lib/google-drive/repository";
import { uploadTeamFileToGoogleDrive } from "@/app/lib/google-drive/uploader";

export const runtime = "nodejs";

function parsePathParts(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

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

  const form = await request.formData();
  const teamId = String(form.get("teamId") ?? "").trim();
  const file = form.get("file");
  if (!teamId || !(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ ok: false, error: "errors.google_drive_upload_failed" }, { status: 400 });
  }
  if (file.size > GOOGLE_DRIVE_UPLOAD_MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "errors.google_drive_file_too_large" }, { status: 400 });
  }

  const member = await assertTeamMember(teamId, user.id);
  if (!member.ok) {
    return NextResponse.json({ ok: false, error: member.error }, { status: 403 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  try {
    const result = await uploadTeamFileToGoogleDrive({
      teamId,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      bytes,
      pathParts: parsePathParts(form.get("pathParts")),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Google Drive upload failed", error);
    return NextResponse.json({ ok: false, error: "errors.google_drive_upload_failed" }, { status: 500 });
  }
}
