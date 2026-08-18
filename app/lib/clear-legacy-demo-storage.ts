const CLEARED_FLAG = "routine-app-cleared-demo-v2";

const LEGACY_DEMO_MEMBER_IDS = new Set(["anna", "kristaps", "janis", "marta"]);

const UNSCOPED_DEMO_KEYS = [
  "routine-app-work-lists",
  "routine-app-work-tasks-v3",
  "routine-app-task-activity",
  "routine-app-task-files",
  "routine-app-list-files",
  "routine-app-team-members",
  "routine-app-teams",
  "routine-app-current-team-id",
  "routine-app-notifications",
  "routine-app-team-todo-list",
  "routine-app-projects",
];

export function isLegacyDemoMemberId(id: string | null | undefined): boolean {
  return Boolean(id && LEGACY_DEMO_MEMBER_IDS.has(id));
}

export function clearLegacyDemoStorage() {
  if (typeof window === "undefined") return;

  try {
    if (window.localStorage.getItem(CLEARED_FLAG)) return;

    for (const key of UNSCOPED_DEMO_KEYS) {
      window.localStorage.removeItem(key);
    }

    const extra: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key) continue;
      if (
        key.startsWith("routine-app-task-file-content:task-file-") ||
        key.startsWith("routine-app-list-file-content:file-")
      ) {
        extra.push(key);
      }
    }
    for (const key of extra) {
      window.localStorage.removeItem(key);
    }

    window.localStorage.setItem(CLEARED_FLAG, "1");
  } catch {
    // ignore quota / private mode
  }
}
