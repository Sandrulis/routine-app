import { getExtensionAuth } from "@/app/lib/extension/auth";
import {
  listExtensionLists,
  listExtensionStatusesForTask,
  listExtensionSubtasksForTask,
  listExtensionTreeItems,
} from "@/app/lib/extension/browse";
import {
  extensionJson,
  extensionOptionsResponse,
} from "@/app/lib/extension/cors";
import {
  canCreateExtensionSubtask,
  listExtensionAssignees,
} from "@/app/lib/extension/create-subtask";
import { resolveExtensionLanguageCode } from "@/app/lib/extension/i18n";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/language";
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
  const step = (url.searchParams.get("step") || "lists").trim();

  try {
    if (step === "lists") {
      const teamId = (url.searchParams.get("teamId") || "").trim();
      const lists = await listExtensionLists(auth.supabase, teamId || null);
      return extensionJson(request, { ok: true, step: "lists", lists });
    }

    if (step === "items") {
      const listId = (url.searchParams.get("listId") || "").trim();
      if (!listId) {
        return extensionJson(
          request,
          { ok: false, error: "errors.extension_list_required" },
          { status: 400 },
        );
      }
      const parentIdRaw = url.searchParams.get("parentId");
      const parentId =
        parentIdRaw && parentIdRaw.trim() ? parentIdRaw.trim() : null;
      const items = await listExtensionTreeItems(
        auth.supabase,
        listId,
        parentId,
      );
      return extensionJson(request, {
        ok: true,
        step: "items",
        listId,
        parentId,
        items,
      });
    }

    if (step === "assignees") {
      const parentId = (url.searchParams.get("parentId") || "").trim();
      const teamIdParam = (url.searchParams.get("teamId") || "").trim();
      let teamId = teamIdParam;
      if (parentId) {
        const { data: parent } = await auth.supabase
          .from("work_tasks")
          .select("team_id")
          .eq("id", parentId)
          .maybeSingle();
        teamId = String(parent?.team_id || teamId || "");
      }
      const assignees = teamId
        ? await listExtensionAssignees(auth.supabase, teamId)
        : [];
      return extensionJson(request, {
        ok: true,
        step: "assignees",
        teamId,
        assignees,
      });
    }

    if (step === "subtasks") {
      const parentId = (url.searchParams.get("parentId") || "").trim();
      if (!parentId) {
        return extensionJson(
          request,
          { ok: false, error: "errors.extension_task_required" },
          { status: 400 },
        );
      }
      const languageCode =
        (await resolveExtensionLanguageCode(auth.supabase, auth.user.id)) ||
        DEFAULT_LANGUAGE;
      const [subtasks, statusCatalog] = await Promise.all([
        listExtensionSubtasksForTask(auth.supabase, parentId),
        listExtensionStatusesForTask(auth.supabase, parentId, languageCode),
      ]);
      const { data: parent } = await auth.supabase
        .from("work_tasks")
        .select("team_id, list_id")
        .eq("id", parentId)
        .maybeSingle();
      const parentListId = String(parent?.list_id || subtasks[0]?.listId || "");
      const teamId = String(
        parent?.team_id || url.searchParams.get("teamId") || "",
      );
      const [canCreate, assignees] = await Promise.all([
        parentListId
          ? canCreateExtensionSubtask(auth.supabase, parentListId)
          : Promise.resolve(false),
        teamId
          ? listExtensionAssignees(auth.supabase, teamId)
          : Promise.resolve([]),
      ]);
      return extensionJson(request, {
        ok: true,
        step: "subtasks",
        parentId,
        subtasks,
        canCreate,
        assignees,
        statuses: statusCatalog.statuses,
        defaultStatus: statusCatalog.defaultStatus,
      });
    }

    return extensionJson(
      request,
      { ok: false, error: "errors.extension_invalid_body" },
      { status: 400 },
    );
  } catch (error) {
    logError("extension browse failed", error);
    return extensionJson(
      request,
      { ok: false, error: "errors.extension_search_failed" },
      { status: 500 },
    );
  }
}
