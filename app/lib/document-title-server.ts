import { createClient } from "@/app/lib/supabase/server";
import { isSupabaseConfigured } from "@/app/lib/supabase/env";

async function fetchNamedRecord(
  table: "work_lists" | "list_files" | "team_members" | "work_templates",
  id: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.from(table).select("name").eq("id", id).maybeSingle();
    return typeof data?.name === "string" && data.name.trim() ? data.name.trim() : null;
  } catch {
    return null;
  }
}

async function fetchTaskTitleRecord(taskId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("work_tasks")
      .select("title")
      .eq("id", taskId)
      .maybeSingle();
    return typeof data?.title === "string" && data.title.trim() ? data.title.trim() : null;
  } catch {
    return null;
  }
}

export function fetchWorkListName(listId: string) {
  return fetchNamedRecord("work_lists", listId);
}

export function fetchWorkTaskTitle(taskId: string) {
  return fetchTaskTitleRecord(taskId);
}

export function fetchListFileName(fileId: string) {
  return fetchNamedRecord("list_files", fileId);
}

export function fetchTeamMemberName(memberId: string) {
  return fetchNamedRecord("team_members", memberId);
}

export function fetchWorkTemplateName(templateId: string) {
  return fetchNamedRecord("work_templates", templateId);
}
