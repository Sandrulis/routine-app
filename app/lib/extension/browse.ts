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

/** Status IDs in the closed group (+ legacy "done"). */
async function closedStatusIdsForList(
  supabase: SupabaseClient,
  listId: string,
): Promise<Set<string>> {
  const closed = new Set<string>(["done"]);
  const { data } = await supabase
    .from("list_statuses")
    .select("id")
    .eq("list_id", listId)
    .eq("group_key", "closed");
  for (const row of data ?? []) {
    if (row.id) closed.add(String(row.id));
  }
  return closed;
}

async function closedStatusIdsForParentTask(
  supabase: SupabaseClient,
  parentTaskId: string,
  listId: string,
): Promise<Set<string>> {
  const closed = await closedStatusIdsForList(supabase, listId);
  const { data } = await supabase
    .from("work_task_statuses")
    .select("id")
    .eq("parent_task_id", parentTaskId)
    .eq("group_key", "closed");
  for (const row of data ?? []) {
    if (row.id) closed.add(String(row.id));
  }
  return closed;
}

function isClosedStatus(status: string | null | undefined, closed: Set<string>) {
  if (!status) return false;
  return closed.has(status);
}

export async function listExtensionLists(
  supabase: SupabaseClient,
  teamId?: string | null,
): Promise<ExtensionBrowseList[]> {
  let query = supabase
    .from("work_lists")
    .select("id, name, team_id")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  const trimmedTeam = teamId?.trim() || "";
  if (trimmedTeam) {
    query = query.eq("team_id", trimmedTeam);
  }
  const { data: lists, error } = await query;
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
  const closed = await closedStatusIdsForList(supabase, listId);

  let query = supabase
    .from("work_tasks")
    .select("id, title, kind, list_id, parent_id, status")
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

  const visible = items.filter(
    (row) => !isClosedStatus(row.status as string | null, closed),
  );
  if (!visible.length) return [];

  const ids = visible.map((row) => row.id as string);
  const [{ data: childRows }, { data: subtaskRows }] = await Promise.all([
    supabase
      .from("work_tasks")
      .select("parent_id, status")
      .in("parent_id", ids)
      .in("kind", ["folder", "task"])
      .is("deleted_at", null)
      .is("archived_at", null),
    supabase
      .from("work_tasks")
      .select("parent_id, status")
      .in("parent_id", ids)
      .eq("kind", "subtask")
      .is("deleted_at", null)
      .is("archived_at", null),
  ]);

  const hasChildren = new Set(
    (childRows ?? [])
      .filter((row) => !isClosedStatus(row.status as string | null, closed))
      .map((row) => row.parent_id as string),
  );
  const hasSubtasks = new Set(
    (subtaskRows ?? [])
      .filter((row) => !isClosedStatus(row.status as string | null, closed))
      .map((row) => row.parent_id as string),
  );

  return visible
    .map((row) => {
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
      } satisfies ExtensionBrowseItem;
    })
    .filter((item) => item.kind === "folder" || item.hasSubtasks);
}

export async function listExtensionSubtasksForTask(
  supabase: SupabaseClient,
  parentTaskId: string,
): Promise<ExtensionBrowseSubtask[]> {
  const { data: parent } = await supabase
    .from("work_tasks")
    .select("list_id")
    .eq("id", parentTaskId)
    .maybeSingle();
  const listId = (parent?.list_id as string | undefined) || "";
  const closed = listId
    ? await closedStatusIdsForParentTask(supabase, parentTaskId, listId)
    : new Set<string>(["done"]);

  const { data, error } = await supabase
    .from("work_tasks")
    .select("id, title, list_id, parent_id, status")
    .eq("parent_id", parentTaskId)
    .eq("kind", "subtask")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });
  if (error || !data?.length) return [];

  return data
    .filter((row) => !isClosedStatus(row.status as string | null, closed))
    .map((row) => ({
      id: row.id as string,
      title: (row.title as string) || "(bez nosaukuma)",
      listId: row.list_id as string,
      parentId: row.parent_id as string,
    }));
}
