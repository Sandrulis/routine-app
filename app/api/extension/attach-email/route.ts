import { getExtensionAuth } from "@/app/lib/extension/auth";
import {
  attachFilesToSubtask,
  buildEmailFile,
  loadFileTypeCatalog,
} from "@/app/lib/extension/attach";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { loadExtensionSessionFlags } from "@/app/lib/extension/session-payload";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

function isFormFile(value: FormDataEntryValue): value is File {
  return typeof value !== "string" && typeof value.arrayBuffer === "function";
}

function attachmentFileName(value: File, fallback: string) {
  const fromFile = value.name?.trim() || "";
  return fromFile || fallback;
}

function decodeBase64ToBytes(value: string): Uint8Array {
  const cleaned = value.replace(/\s/g, "");
  if (!cleaned) return new Uint8Array();
  try {
    return new Uint8Array(Buffer.from(cleaned, "base64"));
  } catch {
    return new Uint8Array();
  }
}

function normalizeAttachment(
  name: string,
  mimeType: string,
  bytes: Uint8Array,
): { name: string; mimeType: string; bytes: Uint8Array } | null {
  if (bytes.length <= 0) return null;
  let fileName = name.trim() || "attachment";
  const mime = mimeType.trim() || "application/octet-stream";
  if (mime.toLowerCase() === "application/pdf" && !fileName.toLowerCase().endsWith(".pdf")) {
    fileName = `${fileName}.pdf`;
  }
  return { name: fileName, mimeType: mime, bytes };
}

function bytesFromFormValue(value: FormDataEntryValue): Promise<Uint8Array> | Uint8Array {
  if (typeof value === "string") return decodeBase64ToBytes(value);
  if (typeof value.arrayBuffer === "function") {
    return value.arrayBuffer().then((buffer) => new Uint8Array(buffer));
  }
  return new Uint8Array();
}

function readJsonAttachments(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  const files: { name: string; mimeType: string; bytes: Uint8Array }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as { name?: unknown; mimeType?: unknown; data?: unknown };
    const parsed = normalizeAttachment(
      String(row.name || "attachment"),
      String(row.mimeType || "application/octet-stream"),
      decodeBase64ToBytes(String(row.data || "")),
    );
    if (parsed) files.push(parsed);
  }
  return files;
}

async function readAttachmentFiles(form: FormData) {
  const files: { name: string; mimeType: string; bytes: Uint8Array }[] = [];
  const names = form.getAll("attachmentName").map((value) => String(value));
  const mimes = form.getAll("attachmentMime").map((value) => String(value));
  const payloads = form.getAll("attachmentB64");
  const encodedCount = Math.max(names.length, mimes.length, payloads.length);
  for (let index = 0; index < encodedCount; index += 1) {
    const bytes = await bytesFromFormValue(payloads[index] || "");
    const parsed = normalizeAttachment(
      names[index] || "attachment",
      mimes[index] || "application/octet-stream",
      bytes,
    );
    if (parsed) files.push(parsed);
  }
  if (files.length > 0) return files;

  for (const [key, value] of form.entries()) {
    if (key !== "attachment" && key !== "attachments") continue;
    if (!isFormFile(value)) continue;
    const parsed = normalizeAttachment(
      attachmentFileName(value, "attachment"),
      value.type || "application/octet-stream",
      new Uint8Array(await value.arrayBuffer()),
    );
    if (parsed) files.push(parsed);
  }
  return files;
}

type AttachEmailInput = {
  taskId: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  body: string;
  bodyHtml: string;
  permalink: string;
  attachments: { name: string; mimeType: string; bytes: Uint8Array }[];
};

async function parseAttachEmailRequest(request: Request): Promise<AttachEmailInput | null> {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      const json = (await request.json()) as Record<string, unknown>;
      return {
        taskId: String(json.taskId ?? "").trim(),
        subject: String(json.subject ?? ""),
        from: String(json.from ?? ""),
        to: String(json.to ?? ""),
        date: String(json.date ?? ""),
        body: String(json.body ?? ""),
        bodyHtml: String(json.bodyHtml ?? ""),
        permalink: String(json.permalink ?? ""),
        attachments: readJsonAttachments(json.attachments),
      };
    } catch {
      return null;
    }
  }

  try {
    const form = await request.formData();
    return {
      taskId: String(form.get("taskId") ?? "").trim(),
      subject: String(form.get("subject") ?? ""),
      from: String(form.get("from") ?? ""),
      to: String(form.get("to") ?? ""),
      date: String(form.get("date") ?? ""),
      body: String(form.get("body") ?? ""),
      bodyHtml: String(form.get("bodyHtml") ?? ""),
      permalink: String(form.get("permalink") ?? ""),
      attachments: await readAttachmentFiles(form),
    };
  } catch {
    return null;
  }
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

  const limited = await consumeRateLimit(
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

  const flags = await loadExtensionSessionFlags(auth.supabase);
  if (!flags.gmailPluginEnabled) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_plugin_disabled" },
      { status: 403 },
    );
  }
  if (!flags.fileUploadEnabled) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_uploads_disabled" },
      { status: 403 },
    );
  }

  let input: AttachEmailInput | null;
  try {
    input = await parseAttachEmailRequest(request);
  } catch {
    input = null;
  }
  if (!input) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_invalid_body" },
      { status: 400 },
    );
  }

  const taskId = input.taskId;
  if (!taskId) {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_task_required" },
      { status: 400 },
    );
  }

  const emailFile = buildEmailFile({
    subject: input.subject,
    from: input.from,
    to: input.to,
    date: input.date,
    body: input.body,
    bodyHtml: input.bodyHtml,
    permalink: input.permalink,
  });
  const catalog = await loadFileTypeCatalog(auth.supabase);

  const result = await attachFilesToSubtask({
    supabase: auth.supabase,
    user: auth.user,
    taskId,
    files: [emailFile, ...input.attachments],
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
