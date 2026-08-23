"use server";

import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { buildSimpleEmailHtml } from "@/app/lib/email/build-email-html";
import { refreshTaskForwardDeliveryStatuses } from "@/app/lib/email/resend-delivery";
import {
  isResendEnabled,
  sendResendEmail,
} from "@/app/lib/integrations/resend/client";
import { isValidEmailAddress } from "@/app/lib/integrations/resend/from-email";
import { downloadTeamGoogleDriveFile } from "@/app/lib/google-drive/uploader";
import { assertListAccess } from "@/app/lib/lists/assert-list-access";
import { logError } from "@/app/lib/security/log-error";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { createAdminClient } from "@/app/lib/supabase/admin";
import {
  isSupabaseAdminConfigured,
  isSupabaseConfigured,
} from "@/app/lib/supabase/env";
import {
  createActivity,
  type TaskActivity,
} from "@/app/lib/task-activity";

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
  if (/^[A-Za-z0-9+/=\s]+$/.test(trimmed) && trimmed.length > 16) {
    return { base64: trimmed.replace(/\s+/g, "") };
  }
  return null;
}

function bufferToBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64");
}

async function loadStoredTaskFileAttachment(fileId: string): Promise<
  | {
      ok: true;
      filename: string;
      mimeType: string;
      contentBase64: string;
      teamId: string;
      taskId: string;
    }
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

  if (error || !data?.task_id || !data.team_id) {
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

  const teamId = String(data.team_id);
  const taskId = String(data.task_id);
  const driveFileId =
    typeof data.google_drive_file_id === "string"
      ? data.google_drive_file_id.trim()
      : "";

  if (driveFileId) {
    try {
      const downloaded = await downloadTeamGoogleDriveFile({
        teamId,
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
        teamId,
        taskId,
      };
    } catch (err) {
      logError("forwardTaskFile Drive download failed", err);
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
    teamId,
    taskId,
  };
}

async function resolveForwardContext(input: {
  userId: string;
  fileId?: string;
  taskId?: string;
}): Promise<
  | { ok: true; teamId: string; taskId: string; actorId: string }
  | { ok: false; error: string }
  | { ok: true; teamId: null; taskId: null; actorId: null }
> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }
  const admin = createAdminClient();
  let teamId = "";
  let taskId = input.taskId?.trim() ?? "";

  if (input.fileId?.trim()) {
    const { data } = await admin
      .from("task_files")
      .select("team_id, task_id")
      .eq("id", input.fileId.trim())
      .maybeSingle();
    if (data?.team_id && data.task_id) {
      teamId = String(data.team_id);
      taskId = String(data.task_id);
    }
  }

  if (!teamId && taskId) {
    const { data: task } = await admin
      .from("work_tasks")
      .select("team_id, list_id")
      .eq("id", taskId)
      .maybeSingle();
    if (task?.team_id) {
      teamId = String(task.team_id);
    }
    if (task?.list_id) {
      const access = await assertListAccess(String(task.list_id), "view");
      if (!access.ok) {
        return { ok: false, error: access.error };
      }
    }
  }

  if (!teamId || !taskId) {
    return { ok: true, teamId: null, taskId: null, actorId: null };
  }

  const { data: member } = await admin
    .from("team_members")
    .select("id")
    .eq("team_id", teamId)
    .eq("user_id", input.userId)
    .not("user_id", "is", null)
    .maybeSingle();

  if (!member?.id) {
    return { ok: true, teamId: null, taskId: null, actorId: null };
  }

  return {
    ok: true,
    teamId,
    taskId,
    actorId: String(member.id),
  };
}

async function insertForwardActivity(input: {
  teamId: string;
  taskId: string;
  actorId: string;
  fileName: string;
  fileId?: string;
  to: string;
  subject: string;
  body?: string;
  resendEmailId?: string;
}): Promise<TaskActivity | null> {
  const body = (input.body ?? "").trim().slice(0, 4000);
  const activity = createActivity({
    actorId: input.actorId,
    taskId: input.taskId,
    kind: "file_forwarded",
    fileName: input.fileName,
    text: input.subject,
    previousText: input.to,
    metadata: {
      to: input.to,
      subject: input.subject,
      deliveryStatus: "sent",
      ...(body ? { body } : {}),
      ...(input.fileId ? { fileId: input.fileId } : {}),
      ...(input.resendEmailId ? { resendEmailId: input.resendEmailId } : {}),
    },
  });

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("task_activities").insert({
      id: activity.id,
      team_id: input.teamId,
      task_id: activity.taskId,
      actor_id: activity.actorId,
      kind: activity.kind,
      text: activity.text ?? null,
      previous_text: activity.previousText ?? null,
      file_name: activity.fileName ?? null,
      metadata: activity.metadata ?? null,
      created_at: activity.at,
    });
    if (error) {
      logError("forwardTaskFile activity insert failed", error.message);
      return null;
    }
    return activity;
  } catch (error) {
    logError("forwardTaskFile activity insert failed", error);
    return null;
  }
}

export async function forwardTaskFileAction(input: {
  to: string;
  subject: string;
  body: string;
  /** Saved task_files row id. Prefer this over inline content. */
  fileId?: string;
  /** Task id for history when forwarding a pending (unsaved) file. */
  taskId?: string;
  /** Pending / local file (base64). Used when fileId is absent. */
  fileName?: string;
  mimeType?: string;
  contentBase64?: string;
}): Promise<
  | { ok: true; activity: TaskActivity | null }
  | { ok: false; error: string }
> {
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
  let teamId = "";
  let taskId = input.taskId?.trim() ?? "";

  const fileId = input.fileId?.trim() ?? "";
  if (fileId) {
    const loaded = await loadStoredTaskFileAttachment(fileId);
    if (!loaded.ok) return loaded;
    attachment = {
      filename: loaded.filename,
      mimeType: loaded.mimeType,
      contentBase64: loaded.contentBase64,
    };
    teamId = loaded.teamId;
    taskId = loaded.taskId;
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

  const context = await resolveForwardContext({
    userId: user.id,
    fileId: fileId || undefined,
    taskId: taskId || undefined,
  });
  if (!context.ok) {
    return { ok: false, error: context.error };
  }

  let activity: TaskActivity | null = null;
  if (context.teamId && context.taskId && context.actorId) {
    activity = await insertForwardActivity({
      teamId: context.teamId,
      taskId: context.taskId,
      actorId: context.actorId,
      fileName: attachment.filename,
      fileId: fileId || undefined,
      to,
      subject,
      body,
      resendEmailId: sent.id,
    });
  }

  return { ok: true, activity };
}

export async function refreshForwardDeliveryStatusesAction(
  taskId: string,
): Promise<{ ok: true; activities: TaskActivity[] } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "errors.auth_required" };
  }
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const trimmed = taskId.trim();
  if (!trimmed) {
    return { ok: true, activities: [] };
  }

  if (!isSupabaseAdminConfigured()) {
    return { ok: false, error: "errors.db_not_configured" };
  }

  const admin = createAdminClient();
  const { data: task } = await admin
    .from("work_tasks")
    .select("list_id")
    .eq("id", trimmed)
    .maybeSingle();

  if (!task?.list_id) {
    return { ok: false, error: "errors.files_forward_missing" };
  }

  const access = await assertListAccess(String(task.list_id), "view");
  if (!access.ok) {
    return { ok: false, error: access.error };
  }

  const activities = await refreshTaskForwardDeliveryStatuses(trimmed);
  return { ok: true, activities };
}
