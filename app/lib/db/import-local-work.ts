import {
  insertActivity,
  insertList,
  insertListFile,
  insertMember,
  insertNotifications,
  insertTask,
  insertTaskFile,
  insertTeam,
  replaceTeamTodos,
  sortTasksForInsert,
} from "@/app/lib/db/work-data";
import { createClient } from "@/app/lib/supabase/client";
import {
  LISTS_STORAGE_KEY,
  TASKS_STORAGE_KEY,
  normalizeStoredLists,
  normalizeStoredTasks,
  scopedStorageKey,
} from "@/app/lib/lists";
import {
  LIST_FILES_STORAGE_KEY,
  normalizeStoredFiles,
  type ListFile,
} from "@/app/lib/list-files";
import {
  NOTIFICATIONS_STORAGE_KEY,
  normalizeStoredNotifications,
} from "@/app/lib/notifications";
import {
  TASK_ACTIVITY_STORAGE_KEY,
  TASK_FILES_STORAGE_KEY,
  normalizeStoredActivities,
  normalizeStoredTaskFiles,
} from "@/app/lib/task-activity";
import {
  currentTeamIdStorageKey,
  membersStorageKey,
  normalizeStoredMembersByTeam,
  normalizeStoredTeams,
  teamsStorageKey,
  type TeamMember,
  type WorkTeam,
} from "@/app/lib/team";
import {
  TODO_STORAGE_KEY,
  normalizeStoredItems,
} from "@/app/lib/team-todo";

const IMPORT_FLAG = "routine-app-db-import-v1";

function readJson(key: string): unknown {
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function fileContent(prefix: string, id: string): string | null {
  try {
    return window.localStorage.getItem(`${prefix}${id}`);
  } catch {
    return null;
  }
}

export async function importLocalWorkIfNeeded(
  userId: string,
  owner: TeamMember,
): Promise<boolean> {
  const flag = `${IMPORT_FLAG}:${userId}`;
  if (window.localStorage.getItem(flag)) return false;

  const storedTeams = normalizeStoredTeams(readJson(teamsStorageKey(userId)));
  const storedMembers = normalizeStoredMembersByTeam(
    readJson(membersStorageKey(userId)),
  );
  if (!storedTeams || storedTeams.length === 0) {
    window.localStorage.setItem(flag, "1");
    return false;
  }

  const { data: existing, error } = await createClient()
    .from("teams")
    .select("id")
    .limit(1);
  if (error) throw error;
  if (existing && existing.length > 0) {
    window.localStorage.setItem(flag, "1");
    return false;
  }

  for (const team of storedTeams) {
    const members = storedMembers?.[team.id] ?? [owner];
    const ownerMember =
      members.find((member) => member.id === owner.id || member.userId === owner.id) ??
      owner;
    await insertTeam(team, { ...ownerMember, ...owner, id: owner.id }, userId);

    for (const member of members) {
      if (member.id === owner.id || member.userId === owner.id) continue;
      try {
        await insertMember(team.id, member);
      } catch {
        // skip duplicate emails
      }
    }

    await importTeamWorkspace(userId, team, members);
  }

  window.localStorage.setItem(flag, "1");
  return true;
}

async function importTeamWorkspace(
  userId: string,
  team: WorkTeam,
  members: TeamMember[],
) {
  const teamId = team.id;
  const memberIds = new Set(members.map((member) => member.id));
  const lists =
    normalizeStoredLists(
      readJson(scopedStorageKey(LISTS_STORAGE_KEY, userId, teamId)),
    ) ?? [];
  const tasks =
    normalizeStoredTasks(
      readJson(scopedStorageKey(TASKS_STORAGE_KEY, userId, teamId)),
    ) ?? [];
  const activities =
    normalizeStoredActivities(
      readJson(scopedStorageKey(TASK_ACTIVITY_STORAGE_KEY, userId, teamId)),
    ) ?? [];
  const taskFiles =
    normalizeStoredTaskFiles(
      readJson(scopedStorageKey(TASK_FILES_STORAGE_KEY, userId, teamId)),
    ) ?? [];
  const listFiles: ListFile[] =
    normalizeStoredFiles(readJson(LIST_FILES_STORAGE_KEY))?.filter((file) =>
      lists.some((list) => list.id === file.listId),
    ) ?? [];
  const notifications =
    normalizeStoredNotifications(
      readJson(scopedStorageKey(NOTIFICATIONS_STORAGE_KEY, userId, teamId)),
    ) ?? [];
  const todos =
    normalizeStoredItems(
      readJson(scopedStorageKey(TODO_STORAGE_KEY, userId, teamId)),
    ) ?? [];

  for (const list of lists) {
    await insertList(teamId, list);
  }
  for (const task of sortTasksForInsert(tasks)) {
    await insertTask(teamId, {
      ...task,
      assigneeIds: task.assigneeIds.filter((id) => memberIds.has(id)),
    });
  }
  for (const activity of activities) {
    try {
      await insertActivity(teamId, activity);
    } catch {
      // task may have been skipped
    }
  }
  for (const file of taskFiles) {
    await insertTaskFile(
      teamId,
      file,
      fileContent("routine-app-task-file-content:", file.id),
    );
  }
  for (const file of listFiles) {
    await insertListFile(
      teamId,
      file,
      fileContent("routine-app-list-file-content:", file.id),
    );
  }
  if (notifications.length > 0) {
    await insertNotifications(teamId, notifications);
  }
  if (todos && todos.length > 0) {
    await replaceTeamTodos(teamId, todos);
  }
}

export function readStoredCurrentTeamId(userId: string, teamIds: string[]): string {
  const stored = window.localStorage.getItem(currentTeamIdStorageKey(userId));
  if (stored && teamIds.includes(stored)) return stored;
  return teamIds[0] ?? "";
}
