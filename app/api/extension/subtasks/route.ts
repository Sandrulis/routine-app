import { getExtensionAuth } from "@/app/lib/extension/auth";
import { searchExtensionSubtasks } from "@/app/lib/extension/attach";
import { createExtensionSubtask } from "@/app/lib/extension/create-subtask";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import { loadExtensionSessionFlags } from "@/app/lib/extension/session-payload";
import { requestClientIp } from "@/app/lib/security/client-ip";
import { consumeRateLimit } from "@/app/lib/security/rate-limit";
import { logError } from "@/app/lib/security/log-error";

export const runtime = "nodejs";

export function OPTIONS(request: Request) {
  return extensionOptionsResponse(request);
}

export async function GET(request: Request) {
  const auth = await getExtensionAuth(request);
  if (!auth) {
    return extensionJson(
      request,
      { ok: false, error: "errors.auth_required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const limitRaw = Number(url.searchParams.get("limit") ?? "25");
  const limit = Number.isFinite(limitRaw)
    ? Math.min(50, Math.max(1, Math.round(limitRaw)))
    : 25;

  try {
    const subtasks = await searchExtensionSubtasks(auth.supabase, q, limit);
    return extensionJson(request, { ok: true, subtasks });
  } catch (error) {
    logError("extension subtasks search failed", error);
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_search_failed" },
      { status: 500 },
    );
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
    `ext-create-subtask:${requestClientIp(request)}:${auth.user.id}`,
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

  let body: Record<string, unknown> = {};
  try {
    const parsed = await request.json();
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      body = parsed as Record<string, unknown>;
    }
  } catch {
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_invalid_body" },
      { status: 400 },
    );
  }

  try {
    const result = await createExtensionSubtask({
      supabase: auth.supabase,
      user: auth.user,
      parentId: String(body.parentId || ""),
      title: String(body.title || ""),
      description: String(body.description || ""),
      startDate: String(body.startDate || ""),
      dueDate: String(body.dueDate || ""),
      assigneeIds: Array.isArray(body.assigneeIds) ? body.assigneeIds : [],
      status: String(body.status || ""),
    });
    if (!result.ok) {
      return extensionJson(
        request,
        { ok: false, error: result.error },
        { status: result.status },
      );
    }
    return extensionJson(request, { ok: true, subtask: result.subtask });
  } catch (error) {
    logError("extension create subtask failed", error);
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_create_failed" },
      { status: 500 },
    );
  }
}
