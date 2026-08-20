import { MAX_STORED_FILE_BYTES } from "@/app/lib/list-files";
import {
  DEFAULT_FILE_TYPE_EXTENSIONS,
  isAllowedFileName,
  mimeFromFileName,
} from "@/app/lib/file-types";
import { logError } from "@/app/lib/security/log-error";
import { looksLikeHtml, mimeMatchesBytes } from "@/app/lib/security/file-bytes";
import type { FileTypeExtensionSummary } from "@/app/lib/site-admin/types";
import {
  createActivity,
  createTaskFileId,
  type TaskFile,
} from "@/app/lib/task-activity";
import { GOOGLE_DRIVE_UPLOAD_MAX_BYTES } from "@/app/lib/google-drive/env";
import { uploadTeamFileToGoogleDrive } from "@/app/lib/google-drive/uploader";
import type { User, SupabaseClient } from "@supabase/supabase-js";

/** Extension uploads follow Drive max (25 MB); DB content stays ≤ 1.5 MB. */
export const EXTENSION_UPLOAD_MAX_BYTES = GOOGLE_DRIVE_UPLOAD_MAX_BYTES;

export type ExtensionSubtaskHit = {
  id: string;
  title: string;
  listId: string;
  listName: string;
  parentId: string | null;
  parentTitle: string | null;
  teamId: string;
  teamName: string;
};

function bytesToDataUrl(mimeType: string, bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function sanitizeFileBase(name: string): string {
  const cleaned = name
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  return cleaned || "email";
}

export function buildEmailTextFile(input: {
  subject: string;
  from: string;
  to?: string;
  date?: string;
  body: string;
  permalink?: string;
}): { name: string; mimeType: string; bytes: Uint8Array } {
  const subject = input.subject.trim() || "(bez temata)";
  const lines = [
    `Subject: ${subject}`,
    `From: ${input.from.trim() || "(nezināms)"}`,
    input.to?.trim() ? `To: ${input.to.trim()}` : null,
    input.date?.trim() ? `Date: ${input.date.trim()}` : null,
    input.permalink?.trim() ? `URL: ${input.permalink.trim()}` : null,
    "",
    input.body.trim() || "(tukšs saturs)",
  ].filter((line): line is string => line !== null);

  const text = lines.join("\n");
  const encoder = new TextEncoder();
  return {
    name: `${sanitizeFileBase(subject)}.txt`,
    mimeType: "text/plain",
    bytes: encoder.encode(text),
  };
}

export async function loadFileTypeCatalog(
  supabase: SupabaseClient,
): Promise<FileTypeExtensionSummary[]> {
  const { data, error } = await supabase
    .from("file_type_extensions")
    .select("extension, mime_type, icon, color, sort_order")
    .order("sort_order", { ascending: true });
  if (error || !data?.length) return DEFAULT_FILE_TYPE_EXTENSIONS;
  return data.map((row) => ({
    extension: String(row.extension),
    mimeType: String(row.mime_type),
    icon: String(row.icon),
    color: String(row.color),
    sortOrder: Number(row.sort_order) || 0,
  }));
}

export async function searchExtensionSubtasks(
  supabase: SupabaseClient,
  query: string,
  limit = 25,
): Promise<ExtensionSubtaskHit[]> {
  const q = query.trim();
  let taskQuery = supabase
    .from("work_tasks")
    .select("id, title, list_id, parent_id, team_id")
    .eq("kind", "subtask")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    taskQuery = taskQuery.ilike("title", `%${q}%`);
  }

  const { data: tasks, error } = await taskQuery;
  if (error || !tasks?.length) return [];

  const listIds = [...new Set(tasks.map((t) => t.list_id).filter(Boolean))];
  const teamIds = [...new Set(tasks.map((t) => t.team_id).filter(Boolean))];
  const parentIds = [
    ...new Set(tasks.map((t) => t.parent_id).filter((id): id is string => Boolean(id))),
  ];

  const [listsRes, teamsRes, parentsRes] = await Promise.all([
    listIds.length
      ? supabase.from("work_lists").select("id, name").in("id", listIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    teamIds.length
      ? supabase.from("teams").select("id, name").in("id", teamIds)
      : Promise.resolve({ data: [] as { id: string; name: string }[] }),
    parentIds.length
      ? supabase.from("work_tasks").select("id, title").in("id", parentIds)
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const listName = new Map(
    (listsRes.data ?? []).map((row) => [row.id, row.name as string]),
  );
  const teamName = new Map(
    (teamsRes.data ?? []).map((row) => [row.id, row.name as string]),
  );
  const parentTitle = new Map(
    (parentsRes.data ?? []).map((row) => [row.id, row.title as string]),
  );

  return tasks.map((task) => ({
    id: task.id as string,
    title: (task.title as string) || "(bez nosaukuma)",
    listId: task.list_id as string,
    listName: listName.get(task.list_id as string) ?? "",
    parentId: (task.parent_id as string | null) ?? null,
    parentTitle: task.parent_id
      ? (parentTitle.get(task.parent_id as string) ?? null)
      : null,
    teamId: task.team_id as string,
    teamName: teamName.get(task.team_id as string) ?? "",
  }));
}

/** Same folder chain as in-app `googleDrivePathForTaskFile` (list → ancestors → subtask). */
async function drivePathPartsForSubtask(
  supabase: SupabaseClient,
  task: {
    id: string;
    title: string;
    list_id: string;
    parent_id: string | null;
  },
): Promise<string[]> {
  const { data: list } = await supabase
    .from("work_lists")
    .select("name")
    .eq("id", task.list_id)
    .maybeSingle();

  const parts: string[] = [(list?.name as string | undefined)?.trim() || "list"];

  const titlesById = new Map<string, string>();
  let parentId = task.parent_id;
  const guard = new Set<string>();
  while (parentId && !guard.has(parentId)) {
    guard.add(parentId);
    const { data: parent } = await supabase
      .from("work_tasks")
      .select("id, title, parent_id")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent) break;
    titlesById.set(parent.id as string, String(parent.title || "").trim());
    parentId = (parent.parent_id as string | null) ?? null;
  }

  // Ancestors root → leaf (excluding the subtask itself).
  const chain = [...guard].reverse();
  for (const id of chain) {
    const title = titlesById.get(id);
    if (title) parts.push(title);
  }

  const selfTitle = task.title.trim();
  if (selfTitle) parts.push(selfTitle);
  return parts;
}

export async function attachFilesToSubtask(input: {
  supabase: SupabaseClient;
  user: User;
  taskId: string;
  files: { name: string; mimeType: string; bytes: Uint8Array }[];
  catalog: FileTypeExtensionSummary[];
}): Promise<{
  ok: true;
  attached: { id: string; name: string }[];
  skipped: { name: string; reason: string }[];
} | { ok: false; error: string; status: number }> {
  const { data: task, error: taskError } = await input.supabase
    .from("work_tasks")
    .select("id, team_id, list_id, parent_id, title, kind, deleted_at, archived_at")
    .eq("id", input.taskId)
    .maybeSingle();

  if (taskError || !task) {
    return { ok: false, error: "errors.not_found", status: 404 };
  }
  if (task.kind !== "subtask") {
    return { ok: false, error: "errors.extension_not_subtask", status: 400 };
  }
  if (task.deleted_at || task.archived_at) {
    return { ok: false, error: "errors.extension_subtask_unavailable", status: 400 };
  }

  const teamId = task.team_id as string;
  const pathParts = await drivePathPartsForSubtask(input.supabase, {
    id: task.id as string,
    title: String(task.title || ""),
    list_id: task.list_id as string,
    parent_id: (task.parent_id as string | null) ?? null,
  });

  const attached: { id: string; name: string }[] = [];
  const skipped: { name: string; reason: string }[] = [];

  for (const file of input.files) {
    const name = file.name.trim() || "file";
    if (!isAllowedFileName(name, input.catalog)) {
      skipped.push({ name, reason: "errors.extension_file_type" });
      continue;
    }
    if (file.bytes.length <= 0) {
      skipped.push({ name, reason: "errors.extension_file_empty" });
      continue;
    }
    if (file.bytes.length > EXTENSION_UPLOAD_MAX_BYTES) {
      skipped.push({ name, reason: "errors.extension_file_too_large" });
      continue;
    }

    const mimeType =
      file.mimeType.trim() ||
      mimeFromFileName(name, input.catalog) ||
      "application/octet-stream";
    if (
      !mimeMatchesBytes(name, mimeType, file.bytes) ||
      (looksLikeHtml(file.bytes) &&
        !name.toLowerCase().endsWith(".html") &&
        !name.toLowerCase().endsWith(".htm") &&
        !name.toLowerCase().endsWith(".txt"))
    ) {
      skipped.push({ name, reason: "errors.file_type_mismatch" });
      continue;
    }

    // Mirror in-app addTaskFile: Drive first, then optional server content.
    let googleDriveFileId: string | null = null;
    let storeOnServer = true;
    try {
      const driveResult = await uploadTeamFileToGoogleDrive({
        teamId,
        fileName: name,
        mimeType,
        bytes: file.bytes,
        pathParts,
      });
      if (driveResult.ok && !driveResult.skipped) {
        googleDriveFileId = driveResult.driveFileId;
        storeOnServer = driveResult.storeOnServer === true;
      }
    } catch (error) {
      logError("extension Drive upload failed", error);
    }

    const canStoreContent =
      storeOnServer && file.bytes.length <= MAX_STORED_FILE_BYTES;
    if (!canStoreContent && !googleDriveFileId) {
      skipped.push({
        name,
        reason:
          file.bytes.length > MAX_STORED_FILE_BYTES
            ? "errors.extension_file_needs_drive"
            : "errors.extension_upload_failed",
      });
      continue;
    }

    const id = createTaskFileId();
    const createdAt = new Date().toISOString();
    const content = canStoreContent ? bytesToDataUrl(mimeType, file.bytes) : null;
    const record: TaskFile = {
      id,
      taskId: input.taskId,
      name,
      mimeType,
      size: file.bytes.length,
      hasContent: Boolean(content),
      googleDriveFileId,
      createdAt,
    };

    // Same columns as insertTaskFile() in work-data.ts (incl. has_content).
    const { error: insertError } = await input.supabase.from("task_files").insert({
      id: record.id,
      team_id: teamId,
      task_id: record.taskId,
      name: record.name,
      mime_type: record.mimeType,
      size: record.size,
      content,
      google_drive_file_id: record.googleDriveFileId,
      has_content: Boolean(content),
      created_at: record.createdAt,
    });
    if (insertError) {
      logError("extension task_files insert failed", insertError);
      skipped.push({ name, reason: "errors.extension_upload_failed" });
      continue;
    }

    const activity = createActivity({
      actorId: input.user.id,
      taskId: input.taskId,
      kind: "file",
      fileName: record.name,
    });
    const { error: activityError } = await input.supabase.from("task_activities").insert({
      id: activity.id,
      team_id: teamId,
      task_id: activity.taskId,
      actor_id: activity.actorId,
      kind: activity.kind,
      file_name: activity.fileName ?? null,
      created_at: activity.at,
    });
    if (activityError) {
      logError("extension task_activities insert failed", activityError);
    }

    attached.push({ id: record.id, name: record.name });
  }

  if (attached.length === 0) {
    return { ok: false, error: "errors.extension_nothing_attached", status: 400 };
  }

  return { ok: true, attached, skipped };
}
