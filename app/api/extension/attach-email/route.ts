import type { SupabaseClient } from "@supabase/supabase-js";
import { getExtensionAuth } from "@/app/lib/extension/auth";
import {
  attachFilesToSubtask,
  buildEmailTextFile,
  loadFileTypeCatalog,
} from "@/app/lib/extension/attach";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

async function readAttachmentFiles(form: FormData) {
  const files: { name: string; mimeType: string; bytes: Uint8Array }[] = [];
  for (const [key, value] of form.entries()) {
    if (key !== "attachment" && key !== "attachments") continue;
    if (!(value instanceof File) || value.size <= 0) continue;
    files.push({
      name: value.name.trim() || "attachment",
      mimeType: value.type || "application/octet-stream",
      bytes: new Uint8Array(await value.arrayBuffer()),
    });
  }
  return files;
}

async function isFileUploadEnabled(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("site_frontend_modules")
    .select("is_enabled")
    .eq("module_key", FRONTEND_MODULE_KEYS.fileUpload)
    .maybeSingle();
  if (error || !data) return true;
  return data.is_enabled === true;
}

export async function POST(request: Request) {
  const auth = await getExtensionAuth(request);
  if (!auth) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_required" },
      { status: 401 },
    );
  }

  const limited = consumeRateLimit(
    `ext-attach:${requestClientIp(request)}:${auth.user.id}`,
    40,
    15 * 60 * 1000,
  );
  if (!limited.ok) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_rate_limited" },
      { status: 429 },
    );
  }

  const filesEnabled = await isFileUploadEnabled(auth.supabase);
  if (!filesEnabled) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_uploads_disabled" },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_invalid_body" },
      { status: 400 },
    );
  }

  const taskId = String(form.get("taskId") ?? "").trim();
  if (!taskId) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_task_required" },
      { status: 400 },
    );
  }

  const subject = String(form.get("subject") ?? "");
  const from = String(form.get("from") ?? "");
  const to = String(form.get("to") ?? "");
  const date = String(form.get("date") ?? "");
  const body = String(form.get("body") ?? "");
  const permalink = String(form.get("permalink") ?? "");

  const emailFile = buildEmailTextFile({
    subject,
    from,
    to,
    date,
    body,
    permalink,
  });
  const attachments = await readAttachmentFiles(form);
  const catalog = await loadFileTypeCatalog(auth.supabase);

  const result = await attachFilesToSubtask({
    supabase: auth.supabase,
    user: auth.user,
    taskId,
    files: [emailFile, ...attachments],
    catalog,
  });

  if (!result.ok) {
    return extensionJson(
      request,
      { ok: false, error: result.error },
      { status: result.status },
    );
  }

  return extensionJson(request, {
    ok: true,
    attached: result.attached,
    skipped: result.skipped,
  });
}
