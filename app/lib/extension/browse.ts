import type { SupabaseClient } from "@supabase/supabase-js";
import {
  mapListStatusRow,
  mapWorkTaskStatusRow,
  resolveStatusCatalogs,
  sortTasksLikeNavTree,
} from "@/app/lib/list-statuses";
import { parseIdList, parseStatusGroupMap } from "@/app/lib/lists";
import type { TaskStatusSummary } from "@/app/lib/site-admin/types";

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

export type ExtensionStatusOption = {
  id: string;
  label: string;
  color: string;
  groupKey: "not_started" | "active" | "closed";
};

function asStatusGroupKey(
  value: string,
): ExtensionStatusOption["groupKey"] {
  if (value === "not_started" || value === "active" || value === "closed") {
    return value;
  }
  return "active";
}

function extensionStatusLabel(
  status: TaskStatusSummary,
  languageCode: string,
): string {
  const labels = status.labels ?? {};
  return (
    String(labels[languageCode] || "").trim() ||
    String(labels.lv || "").trim() ||
    String(status.label || "").trim() ||
    status.id
  );
}

function defaultStatusId(catalog: TaskStatusSummary[]): string {
  return (
    catalog.find((row) => row.groupKey === "not_started")?.id ||
    catalog.find((row) => row.id === "todo")?.id ||
    catalog[0]?.id ||
    "todo"
  );
}

function mapExtensionStatuses(
  catalog: TaskStatusSummary[],
  languageCode: string,
): { statuses: ExtensionStatusOption[]; defaultStatus: string } {
  return {
    statuses: catalog.map((row) => ({
      id: row.id,
      label: extensionStatusLabel(row, languageCode),
      color: row.color || "#71717a",
      groupKey: asStatusGroupKey(row.groupKey),
    })),
    defaultStatus: defaultStatusId(catalog),
  };
}

async function loadExtensionStatusCatalog(
  supabase: SupabaseClient,
  parentTaskId: string,
): Promise<{ listId: string; catalog: TaskStatusSummary[] } | null> {
  const { data: parent } = await supabase
    .from("work_tasks")
    .select(
      "list_id, hidden_status_ids, status_order, status_group_overrides",
    )
    .eq("id", parentTaskId)
    .maybeSingle();
  const listId = (parent?.list_id as string | undefined) || "";
  if (!listId || !parent) return null;

  const [{ data: listRow }, system, { data: listStatusRows }, { data: taskStatusRows }] =
    await Promise.all([
      supabase
        .from("work_lists")
        .select("hidden_status_ids, status_order, status_group_overrides")
        .eq("id", listId)
        .maybeSingle(),
      loadSystemStatuses(supabase),
      supabase
        .from("list_statuses")
        .select("id, list_id, label, labels, color, icon, sort_order, group_key")
        .eq("list_id", listId)
        .order("sort_order", { ascending: true }),
      supabase
        .from("work_task_statuses")
        .select(
          "id, parent_task_id, list_id, label, labels, color, icon, sort_order, group_key",
        )
        .eq("parent_task_id", parentTaskId)
        .order("sort_order", { ascending: true }),
    ]);

  const listStatuses = (listStatusRows ?? []).map(mapListStatusRow);
  const workTaskStatuses = (taskStatusRows ?? []).map(mapWorkTaskStatusRow);
  const { visible: catalog } = resolveStatusCatalogs(system, listStatuses, {
    listId,
    parentTaskId,
    workTaskStatuses,
    list: {
      hiddenStatusIds: parseIdList(listRow?.hidden_status_ids),
      statusOrder: parseIdList(listRow?.status_order),
      statusGroupOverrides: parseStatusGroupMap(
        listRow?.status_group_overrides,
      ),
    },
    parentTask: {
      hiddenStatusIds: parseIdList(parent.hidden_status_ids),
      statusOrder: parseIdList(parent.status_order),
      statusGroupOverrides: parseStatusGroupMap(
        parent.status_group_overrides,
      ),
    },
  });

  return { listId, catalog };
}

export async function listExtensionStatusesForTask(
  supabase: SupabaseClient,
  parentTaskId: string,
  languageCode: string,
): Promise<{ statuses: ExtensionStatusOption[]; defaultStatus: string }> {
  const loaded = await loadExtensionStatusCatalog(supabase, parentTaskId);
  if (!loaded || loaded.catalog.length === 0) {
    return { statuses: [], defaultStatus: "todo" };
  }
  return mapExtensionStatuses(loaded.catalog, languageCode);
}

async function loadSystemStatuses(
  supabase: SupabaseClient,
): Promise<TaskStatusSummary[]> {
  const { data } = await supabase
    .from("task_statuses")
    .select("id, labels, label, color, sort_order, group_key")
    .order("sort_order", { ascending: true });
  return (data ?? []).map((row) => {
    const labels =
      row.labels && typeof row.labels === "object" && !Array.isArray(row.labels)
        ? (row.labels as Record<string, string>)
        : {};
    const groupKey =
      row.group_key === "not_started" ||
      row.group_key === "active" ||
      row.group_key === "done" ||
      row.group_key === "closed"
        ? row.group_key
        : "active";
    return {
      id: String(row.id),
      labels,
      label: String(row.label ?? ""),
      color: String(row.color ?? "#71717a"),
      icon: null,
      sortOrder: Number(row.sort_order) || 0,
      groupKey,
    };
  });
}

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
    .filter((item) => item.kind === "folder" || item.kind === "task");
}

export async function listExtensionSubtasksForTask(
  supabase: SupabaseClient,
  parentTaskId: string,
): Promise<ExtensionBrowseSubtask[]> {
  const loaded = await loadExtensionStatusCatalog(supabase, parentTaskId);
  if (!loaded) return [];

  const { data } = await supabase
    .from("work_tasks")
    .select("id, title, list_id, parent_id, status, sort_order")
    .eq("parent_id", parentTaskId)
    .eq("kind", "subtask")
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("sort_order", { ascending: true })
    .order("title", { ascending: true });

  if (!data?.length) return [];

  const catalog = loaded.catalog;
  const closed = new Set(
    catalog.filter((status) => status.groupKey === "closed").map((s) => s.id),
  );
  closed.add("done");

  const active = data
    .filter((row) => !isClosedStatus(row.status as string | null, closed))
    .map((row) => ({
      id: row.id as string,
      title: (row.title as string) || "(bez nosaukuma)",
      listId: row.list_id as string,
      parentId: row.parent_id as string,
      status: String(row.status ?? "todo"),
      sortOrder: Number(row.sort_order) || 0,
    }));

  return sortTasksLikeNavTree(active, catalog).map(
    ({ id, title, listId: taskListId, parentId }) => ({
      id,
      title,
      listId: taskListId,
      parentId,
    }),
  );
}
