"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { buildSimpleEmailHtml } from "@/app/lib/email/build-email-html";
import {
  isResendEnabled,
  sendResendEmail,
} from "@/app/lib/integrations/resend/client";
import { isValidEmailAddress } from "@/app/lib/integrations/resend/from-email";
import { downloadTeamGoogleDriveFile } from "@/app/lib/google-drive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { logError } from "@/app/lib/security/log-error";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import type { ActionResult } from "@/app/lib/site-admin/types";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";

/** Resend allows ~40MB total; keep headroom for HTML + base64 overhead. */
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;

export async function isResendEnabledAction(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  return isResendEnabled();
}

function dataUrlToBase64(content: string): { base64: string; mimeType?: string } | null {
  const trimmed = content.trim();
  const match = trimmed.match(/^data:([^;]+);base64,([\s\S]+)$/);
  if (match) {
    return { mimeType: match[1]?.trim() || undefined, base64: match[2] };
  }
  // Already raw base64
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 16) {
    return { base64: trimmed.replace(/\s+/g, "") };
  }
  return null;
}

function bufferToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

async function loadStoredTaskFileAttachment(fileId: string): Promise<
  | { ok: true; filename: string; mimeType: string; contentBase64: string }
  | { ok: false; error: string }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("task_files")
    .select("id, name, mime_type, size, content, google_drive_file_id, team_id, task_id")
    .eq("id", fileId)
    .maybeSingle();

  if (error || !data?.task_id) {
    return { ok: false, error: "errors.files_forward_missing" };
  }

  const { data: task } = await admin
    .from("work_tasks")
    .select("list_id")
    .eq("id", data.task_id)
    .maybeSingle();

  if (!task?.list_id) {
    return { ok: false, error: "errors.files_forward_missing" };
  }

  const access = await assertListAccess(String(task.list_id), "view");
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const filename = String(data.name ?? "file").trim() || "file";
  const mimeType = String(data.mime_type || "application/octet-stream");
  const size = Math.max(0, Math.round(Number(data.size) || 0));
  if (size > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: "errors.files_forward_too_large" };
  }

  const driveFileId =
    typeof data.google_drive_file_id === "string"
      ? data.google_drive_file_id.trim()
      : "";

  if (driveFileId) {
    try {
      const downloaded = await downloadTeamGoogleDriveFile({
        teamId: String(data.team_id),
        driveFileId,
      });
      if (downloaded.bytes.byteLength > MAX_ATTACHMENT_BYTES) {
        return { ok: false, error: "errors.files_forward_too_large" };
      }
      return {
        ok: true,
        filename,
        mimeType: mimeType || downloaded.mimeType || "application/octet-stream",
        contentBase64: bufferToBase64(downloaded.bytes),
      };
    } catch (err) {
      logError("forwardTaskFile Drive download failed", err);
      // Fall through to DB content
    }
  }

  const rawContent = typeof data.content === "string" ? data.content : null;
  if (!rawContent) {
    return { ok: false, error: "errors.files_forward_missing" };
  }

  const parsed = dataUrlToBase64(rawContent);
  if (!parsed) {
    return { ok: false, error: "errors.files_forward_missing" };
  }

  const approxBytes = Math.floor((parsed.base64.length * 3) / 4);
  if (approxBytes > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: "errors.files_forward_too_large" };
  }

  return {
    ok: true,
    filename,
    mimeType: parsed.mimeType || mimeType,
    contentBase64: parsed.base64,
  };
}

export async function forwardTaskFileAction(input: {
  to: string;
  subject: string;
  body: string;
  /** Saved task_files row id. Prefer this over inline content. */
  fileId?: string;
  /** Pending / local file (base64). Used when fileId is absent. */
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
}): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  if (!(await isResendEnabled())) {
    return { ok: false, error: "errors.integrations_resend_not_enabled" };
  }

  const to = input.to.trim().toLowerCase();
  if (!to || !isValidEmailAddress(to)) {
    return { ok: false, error: "errors.email_invalid" };
  }

  const subject = input.subject.trim();
  if (!subject) {
    return { ok: false, error: "errors.files_forward_subject_required" };
  }

  const body = input.body.trim();
  const replyTo = user.email?.trim() || undefined;
  if (!replyTo || !isValidEmailAddress(replyTo)) {
    return { ok: false, error: "errors.files_forward_reply_to_missing" };
  }

  let attachment: {
    filename: string;
    mimeType: string;
    contentBase64: string;
  };

  const fileId = input.fileId?.trim() ?? "";
  if (fileId) {
    const loaded = await loadStoredTaskFileAttachment(fileId);
    if (!loaded.ok) return loaded;
    attachment = {
      filename: loaded.filename,
      mimeType: loaded.mimeType,
      contentBase64: loaded.contentBase64,
    };
  } else {
    const fileName = input.fileName?.trim() || "file";
    const contentBase64 = input.contentBase64?.replace(/\s+/g, "") ?? "";
    if (!contentBase64) {
      return { ok: false, error: "errors.files_forward_missing" };
    }
    const approxBytes = Math.floor((contentBase64.length * 3) / 4);
    if (approxBytes > MAX_ATTACHMENT_BYTES) {
      return { ok: false, error: "errors.files_forward_too_large" };
    }
    attachment = {
      filename: fileName,
      mimeType: input.mimeType?.trim() || "application/octet-stream",
      contentBase64,
    };
  }

  const settings = await getSiteSettings();
  const systemName = settings.systemName.trim() || "TASQIN";
  const html = buildSimpleEmailHtml({
    systemName,
    heading: subject,
    bodyText: body,
  });

  const sent = await sendResendEmail({
    to,
    subject,
    html,
    text: body || subject,
    fromName: systemName,
    replyTo,
    attachments: [
      {
        filename: attachment.filename,
        content: attachment.contentBase64,
        contentType: attachment.mimeType,
      },
    ],
  });

  if (!sent.ok) {
    return { ok: false, error: sent.error };
  }

  return { ok: true };
}
