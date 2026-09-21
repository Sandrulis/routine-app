export type StatusGroupSortDirection = "asc" | "desc";

export const TABLE_COLUMN_VISIBILITY_COOKIE = "routine-app-table-columns";
export const STATUS_GROUP_SORT_COOKIE = "routine-app-status-group-sort";

export type UserUiPreferences = {
  statusGroupSort: StatusGroupSortDirection;
  hiddenTableColumns: string[];
};

export const DEFAULT_USER_UI_PREFERENCES: UserUiPreferences = {
  statusGroupSort: "asc",
  hiddenTableColumns: [],
};

function isSortDirection(value: unknown): value is StatusGroupSortDirection {
  return value === "asc" || value === "desc";
}

export function parseHiddenTableColumnIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const next = value.filter(
    (id): id is string =>
      typeof id === "string" &&
      id.trim().length > 0 &&
      id.trim().length <= 80,
  );
  return next.slice(0, 80);
}

export function parseStoredUiPreferences(
  value: unknown,
): Partial<UserUiPreferences> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const row = value as Record<string, unknown>;
  const next: Partial<UserUiPreferences> = {};
  if (isSortDirection(row.statusGroupSort)) {
    next.statusGroupSort = row.statusGroupSort;
  }
  if (Array.isArray(row.hiddenTableColumns)) {
    next.hiddenTableColumns = parseHiddenTableColumnIds(row.hiddenTableColumns);
  }
  return next;
}

export function parseUserUiPreferences(value: unknown): UserUiPreferences {
  const stored = parseStoredUiPreferences(value);
  return {
    statusGroupSort:
      stored.statusGroupSort ?? DEFAULT_USER_UI_PREFERENCES.statusGroupSort,
    hiddenTableColumns:
      stored.hiddenTableColumns ??
      DEFAULT_USER_UI_PREFERENCES.hiddenTableColumns,
  };
}

export function parseStatusGroupSortCookie(
  raw: string | null | undefined,
): StatusGroupSortDirection | null {
  return isSortDirection(raw) ? raw : null;
}

export function parseHiddenTableColumnsCookie(
  raw: string | null | undefined,
): string[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const hidden = (parsed as { hidden?: unknown }).hidden;
    if (!Array.isArray(hidden)) return null;
    return parseHiddenTableColumnIds(hidden);
  } catch {
    return null;
  }
}

export function mergeUiPreferencesWithCookies(
  stored: Partial<UserUiPreferences>,
  sortCookie: string | null | undefined,
  columnsCookie: string | null | undefined,
): UserUiPreferences {
  const fromSort = parseStatusGroupSortCookie(sortCookie);
  const fromColumns = parseHiddenTableColumnsCookie(columnsCookie);
  return {
    statusGroupSort:
      stored.statusGroupSort ??
      fromSort ??
      DEFAULT_USER_UI_PREFERENCES.statusGroupSort,
    hiddenTableColumns:
      stored.hiddenTableColumns ??
      fromColumns ??
      DEFAULT_USER_UI_PREFERENCES.hiddenTableColumns,
  };
}
