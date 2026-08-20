import type { SupabaseClient } from "@supabase/supabase-js";

export type ExtensionBrowseList = {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
};

export type ExtensionBrowseItem = {
  id: string;
  title: string;
  kind: "folder" | "task";
  listId: string;
  parentId: string | null;
  hasChildren: boolean;
  hasSubtasks: boolean;
};

export type ExtensionBrowseSubtask = {
  id: string;
  title: string;
  listId: string;
  parentId: string;
};

export async function listExtensionLists(
  supabase: SupabaseClient,
): Promise<ExtensionBrowseList[]> {
  const { data: lists, error } = await supabase
    .from("work_lists")
    .select("id, name, team_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error || !lists?.length) return [];

  const teamIds = [...new Set(lists.map((row) => row.team_id).filter(Boolean))];
  const { data: teams } = teamIds.length
    ? await supabase.from("teams").select("id, name").in("id", teamIds)
    : { data: [] as { id: string; name: string }[] };
  const teamName = new Map(
    (teams ?? []).map((row) => [row.id, row.name as string]),
  );

  return lists.map((row) => ({
    id: row.id as string,
    name: (row.name as string) || "(bez nosaukuma)",
    teamId: row.team_id as string,
    teamName: teamName.get(row.team_id as string) ?? "",
  }));
}

export async function listExtensionTreeItems(
  supabase: SupabaseClient,
  listId: string,
  parentId: string | null,
): Promise<ExtensionBrowseItem[]> {
  let query = supabase
    .from("work_tasks")
    .select("id, title, kind, list_id, parent_id")
    .eq("list_id", listId)
    .in("kind", ["folder", "task"])
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (parentId) {
    query = query.eq("parent_id", parentId);
  } else {
    query = query.is("parent_id", null);
  }

  const { data: items, error } = await query;
  if (error || !items?.length) return [];

  const ids = items.map((row) => row.id as string);
  const [{ data: childRows }, { data: subtaskRows }] = await Promise.all([
    supabase
      .from("work_tasks")
      .select("parent_id")
      .in("parent_id", ids)
      .in("kind", ["folder", "task"])
      .is("deleted_at", null)
      .is("archived_at", null),
    supabase
      .from("work_tasks")
      .select("parent_id")
      .in("parent_id", ids)
      .eq("kind", "subtask")
      .is("deleted_at", null)
      .is("archived_at", null),
  ]);

  const hasChildren = new Set(
    (childRows ?? []).map((row) => row.parent_id as string),
  );
  const hasSubtasks = new Set(
    (subtaskRows ?? []).map((row) => row.parent_id as string),
  );

  return items.map((row) => {
    const id = row.id as string;
    const kind = row.kind === "folder" ? "folder" : "task";
    return {
      id,
      title: (row.title as string) || "(bez nosaukuma)",
      kind,
      listId: row.list_id as string,
      parentId: (row.parent_id as string | null) ?? null,
      hasChildren: hasChildren.has(id),
      hasSubtasks: kind === "task" && hasSubtasks.has(id),
    };
  });
}

export async function listExtensionSubtasksForTask(
  supabase: SupabaseClient,
  parentTaskId: string,
): Promise<ExtensionBrowseSubtask[]> {
  const { data, error } = await supabase
    .from("work_tasks")
    .select("id, title, list_id, parent_id")
    .eq("parent_id", parentTaskId)
    .eq("kind", "subtask")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error || !data?.length) return [];

  return data.map((row) => ({
    id: row.id as string,
    title: (row.title as string) || "(bez nosaukuma)",
    listId: row.list_id as string,
    parentId: row.parent_id as string,
  }));
}
