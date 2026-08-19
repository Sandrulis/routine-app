export type TaskChecklistItem = {
  id: string;
  title: string;
  done: boolean;
};

export type TaskChecklist = {
  id: string;
  title: string;
  items: TaskChecklistItem[];
};

export function createChecklistId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `checklist-${crypto.randomUUID()}`;
  }
  return `checklist-${Date.now()}`;
}

export function createChecklistItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `checklist-item-${crypto.randomUUID()}`;
  }
  return `checklist-item-${Date.now()}`;
}

export function emptyChecklist(): TaskChecklist {
  return {
    id: createChecklistId(),
    title: "",
    items: [],
  };
}

function parseItem(value: unknown): TaskChecklistItem | null {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return null;
  }
  const id = String((value as { id: unknown }).id).trim();
  if (!id) return null;
  const title =
    "title" in value && typeof value.title === "string" ? value.title : "";
  const done = "done" in value && value.done === true;
  return { id, title, done };
}

function parseChecklist(value: unknown): TaskChecklist | null {
  if (typeof value !== "object" || value === null || !("id" in value)) {
    return null;
  }
  const id = String((value as { id: unknown }).id).trim();
  if (!id) return null;
  const title =
    "title" in value && typeof value.title === "string" ? value.title : "";
  const items =
    "items" in value && Array.isArray(value.items)
      ? value.items
          .map(parseItem)
          .filter((item): item is TaskChecklistItem => item !== null)
      : [];
  return { id, title, items };
}

export function parseTaskChecklists(value: unknown): TaskChecklist[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(parseChecklist)
    .filter((item): item is TaskChecklist => item !== null);
}

export function normalizeTaskChecklists(
  checklists: TaskChecklist[],
): TaskChecklist[] {
  return checklists.map((list) => ({
    id: list.id,
    title: list.title.trim(),
    items: list.items
      .map((item) => ({
        id: item.id,
        title: item.title.trim(),
        done: item.done,
      }))
      .filter((item) => item.title.length > 0),
  }));
}

export function normalizeTemplateChecklists(
  checklists: TaskChecklist[],
): TaskChecklist[] {
  return normalizeTaskChecklists(checklists).map((list) => ({
    ...list,
    items: list.items.map((item) => ({ ...item, done: false })),
  }));
}

export function templateChecklistsForApply(
  checklists: TaskChecklist[],
): TaskChecklist[] {
  return normalizeTemplateChecklists(checklists).map((list) => ({
    ...list,
    id: createChecklistId(),
    items: list.items.map((item) => ({
      ...item,
      id: createChecklistItemId(),
      done: false,
    })),
  }));
}

export function checklistsEqual(
  left: TaskChecklist[],
  right: TaskChecklist[],
): boolean {
  const a = normalizeTaskChecklists(left);
  const b = normalizeTaskChecklists(right);
  if (a.length !== b.length) return false;
  return a.every((list, index) => {
    const other = b[index];
    if (!other) return false;
    if (list.id !== other.id || list.title !== other.title) return false;
    if (list.items.length !== other.items.length) return false;
    return list.items.every((item, itemIndex) => {
      const otherItem = other.items[itemIndex];
      return (
        Boolean(otherItem) &&
        item.id === otherItem.id &&
        item.title === otherItem.title &&
        item.done === otherItem.done
      );
    });
  });
}

export function namedChecklistItems(checklists: TaskChecklist[]): TaskChecklistItem[] {
  return normalizeTaskChecklists(checklists).flatMap((list) => list.items);
}

export function taskHasIncompleteChecklists(
  checklists: TaskChecklist[] | undefined,
): boolean {
  return namedChecklistItems(checklists ?? []).some((item) => !item.done);
}

export function checklistProgress(checklists: TaskChecklist[]): {
  done: number;
  total: number;
  percent: number;
} {
  const items = namedChecklistItems(checklists);
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  return {
    done,
    total,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
  };
}
