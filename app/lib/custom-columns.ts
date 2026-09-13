export type CustomTableColumn = {
  id: string;
  name: string;
  sortOrder: number;
};

export type CustomFieldValues = Record<string, string>;

export function createCustomColumnId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `col-${crypto.randomUUID()}`;
  }
  return `col-${Date.now()}`;
}

export function parseCustomColumns(value: unknown): CustomTableColumn[] {
  if (!Array.isArray(value)) return [];
  const columns: CustomTableColumn[] = [];
  const seen = new Set<string>();
  value.forEach((item, index) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    const row = item as Record<string, unknown>;
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const name = typeof row.name === "string" ? row.name.trim() : "";
    if (!id || !name || seen.has(id)) return;
    seen.add(id);
    const sortOrder =
      typeof row.sortOrder === "number" && Number.isFinite(row.sortOrder)
        ? row.sortOrder
        : index;
    columns.push({ id, name, sortOrder });
  });
  return columns.sort((left, right) => left.sortOrder - right.sortOrder);
}

export function parseCustomFields(value: unknown): CustomFieldValues {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result: CustomFieldValues = {};
  for (const [id, fieldValue] of Object.entries(value as Record<string, unknown>)) {
    if (!id.trim()) continue;
    if (typeof fieldValue === "string") result[id] = fieldValue;
    else if (fieldValue == null) result[id] = "";
    else result[id] = String(fieldValue);
  }
  return result;
}

export const BUILTIN_TABLE_COLUMN_IDS = [
  "title",
  "assignee",
  "startDate",
  "dueDate",
  "status",
] as const;

export type BuiltinTableColumnId = (typeof BUILTIN_TABLE_COLUMN_IDS)[number];

export function isBuiltinTableColumnId(
  value: string,
): value is BuiltinTableColumnId {
  return (BUILTIN_TABLE_COLUMN_IDS as readonly string[]).includes(value);
}

export function parseColumnOrder(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (id): id is string => typeof id === "string" && id.trim().length > 0,
  );
}

export function resolveTableColumnOrder(
  stored: string[],
  customColumns: CustomTableColumn[],
): string[] {
  const known = new Set<string>([
    ...BUILTIN_TABLE_COLUMN_IDS,
    ...customColumns.map((column) => column.id),
  ]);
  const ordered = stored.filter((id) => known.has(id));
  const seen = new Set(ordered);
  for (const id of BUILTIN_TABLE_COLUMN_IDS) {
    if (seen.has(id)) continue;
    ordered.push(id);
    seen.add(id);
  }
  for (const column of customColumns) {
    if (seen.has(column.id)) continue;
    ordered.push(column.id);
    seen.add(column.id);
  }
  return ordered;
}

export function moveColumnOrder(
  order: string[],
  activeId: string,
  overId: string,
): string[] {
  const oldIndex = order.indexOf(activeId);
  const newIndex = order.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return order;
  const next = [...order];
  const [moved] = next.splice(oldIndex, 1);
  if (!moved) return order;
  next.splice(newIndex, 0, moved);
  return next;
}

export function syncCustomColumnSortOrder(
  columns: CustomTableColumn[],
  order: string[],
): CustomTableColumn[] {
  return columns
    .map((column) => ({
      ...column,
      sortOrder: order.indexOf(column.id),
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export type ResolvedTableColumn =
  | { id: BuiltinTableColumnId; kind: BuiltinTableColumnId }
  | { id: string; kind: "custom"; column: CustomTableColumn };

export function resolveTableColumns(
  order: string[],
  customColumns: CustomTableColumn[],
): ResolvedTableColumn[] {
  const customById = new Map(customColumns.map((column) => [column.id, column]));
  const resolved: ResolvedTableColumn[] = [];
  for (const id of resolveTableColumnOrder(order, customColumns)) {
    if (isBuiltinTableColumnId(id)) {
      resolved.push({ id, kind: id });
      continue;
    }
    const column = customById.get(id);
    if (!column) continue;
    resolved.push({ id, kind: "custom", column });
  }
  return resolved;
}
