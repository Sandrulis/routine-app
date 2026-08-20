import { getExtensionAuth } from "@/app/lib/extension/auth";
import { searchExtensionSubtasks } from "@/app/lib/extension/attach";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
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
