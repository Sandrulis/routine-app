import type { WorkTask } from "@/app/lib/lists";
import {
  checklistsEqual,
  normalizeTaskChecklists,
  type TaskChecklist,
} from "@/app/lib/task-checklists";
import { createActivity, sameIds, type TaskActivity } from "@/app/lib/task-activity";

export type ChecklistActivityAction =
  | "checklist_added"
  | "checklist_removed"
  | "checklist_renamed"
  | "item_added"
  | "item_removed"
  | "item_renamed"
  | "item_checked"
  | "item_unchecked";

export type ChecklistActivityMetadata = {
  action: ChecklistActivityAction;
  checklistTitle: string;
  itemTitle?: string;
  previousTitle?: string;
};

export type TaskUpdatePatch = Partial<
  Pick<
    WorkTask,
    | "title"
    | "description"
    | "status"
    | "assigneeIds"
    | "startDate"
    | "dueDate"
    | "deletedAt"
    | "checklists"
  >
>;

function buildChecklistActivityEvents(
  taskId: string,
  actorId: string,
  before: TaskChecklist[],
  after: TaskChecklist[],
): TaskActivity[] {
  const events: TaskActivity[] = [];
  const prev = normalizeTaskChecklists(before);
  const next = normalizeTaskChecklists(after);
  const prevById = new Map(prev.map((list) => [list.id, list]));
  const nextById = new Map(next.map((list) => [list.id, list]));

  function push(
    action: ChecklistActivityAction,
    checklistTitle: string,
    extra?: Pick<ChecklistActivityMetadata, "itemTitle" | "previousTitle">,
  ) {
    events.push(
      createActivity({
        actorId,
        taskId,
        kind: "checklist",
        metadata: {
          action,
          checklistTitle,
          ...extra,
        },
      }),
    );
  }

  for (const list of next) {
    const oldList = prevById.get(list.id);
    if (!oldList) {
      if (list.title) {
        push("checklist_added", list.title);
      }
      for (const item of list.items) {
        push("item_added", list.title, { itemTitle: item.title });
      }
      continue;
    }

    if (oldList.title !== list.title) {
      push("checklist_renamed", list.title, {
        previousTitle: oldList.title,
      });
    }

    const oldItems = new Map(oldList.items.map((item) => [item.id, item]));
    const newItems = new Map(list.items.map((item) => [item.id, item]));

    for (const item of list.items) {
      const oldItem = oldItems.get(item.id);
      if (!oldItem) {
        push("item_added", list.title, { itemTitle: item.title });
        continue;
      }
      if (oldItem.title !== item.title) {
        push("item_renamed", list.title, {
          itemTitle: item.title,
          previousTitle: oldItem.title,
        });
      }
      if (oldItem.done !== item.done) {
        push(item.done ? "item_checked" : "item_unchecked", list.title, {
          itemTitle: item.title,
        });
      }
    }

    for (const item of oldList.items) {
      if (!newItems.has(item.id)) {
        push("item_removed", oldList.title, { itemTitle: item.title });
      }
    }
  }

  for (const list of prev) {
    if (!nextById.has(list.id)) {
      push("checklist_removed", list.title);
    }
  }

  return events;
}

export function buildTaskUpdateActivityEvents(
  taskId: string,
  actorId: string,
  existing: WorkTask,
  patch: TaskUpdatePatch,
): TaskActivity[] {
  const events: TaskActivity[] = [];

  if (patch.status && patch.status !== existing.status) {
    events.push(
      createActivity({
        actorId,
        taskId,
        kind: "status",
        fromStatus: existing.status,
        toStatus: patch.status,
      }),
    );
  }

  if (patch.assigneeIds && !sameIds(existing.assigneeIds, patch.assigneeIds)) {
    const added = patch.assigneeIds.filter(
      (id) => !existing.assigneeIds.includes(id),
    );
    const removed = existing.assigneeIds.filter(
      (id) => !patch.assigneeIds!.includes(id),
    );
    for (const assigneeId of added) {
      events.push(
        createActivity({
          actorId,
          taskId,
          kind: "assignee_added",
          assigneeIds: [assigneeId],
        }),
      );
    }
    for (const assigneeId of removed) {
      events.push(
        createActivity({
          actorId,
          taskId,
          kind: "assignee_removed",
          assigneeIds: [assigneeId],
        }),
      );
    }
  }

  if (
    patch.startDate !== undefined &&
    patch.startDate !== existing.startDate
  ) {
    events.push(
      createActivity({
        actorId,
        taskId,
        kind: "start_date",
        fromDateValue: existing.startDate,
        dateValue: patch.startDate,
      }),
    );
  }

  if (patch.dueDate !== undefined && patch.dueDate !== existing.dueDate) {
    events.push(
      createActivity({
        actorId,
        taskId,
        kind: "due_date",
        fromDateValue: existing.dueDate,
        dateValue: patch.dueDate,
      }),
    );
  }

  if (patch.title !== undefined && patch.title !== existing.title) {
    events.push(
      createActivity({
        actorId,
        taskId,
        kind: "title",
        previousText: existing.title,
        text: patch.title,
      }),
    );
  }

  if (
    patch.description !== undefined &&
    patch.description !== existing.description
  ) {
    events.push(
      createActivity({
        actorId,
        taskId,
        kind: "description",
        previousText: existing.description,
        text: patch.description,
      }),
    );
  }

  if (patch.deletedAt !== undefined) {
    if (patch.deletedAt && !existing.deletedAt) {
      events.push(
        createActivity({
          actorId,
          taskId,
          kind: "hidden",
        }),
      );
    } else if (!patch.deletedAt && existing.deletedAt) {
      events.push(
        createActivity({
          actorId,
          taskId,
          kind: "restored",
        }),
      );
    }
  }

  if (
    patch.checklists !== undefined &&
    !checklistsEqual(existing.checklists ?? [], patch.checklists)
  ) {
    events.push(
      ...buildChecklistActivityEvents(
        taskId,
        actorId,
        existing.checklists ?? [],
        patch.checklists,
      ),
    );
  }

  return events;
}

export function buildSubtaskMovedActivity(
  taskId: string,
  actorId: string,
  fromParentId: string | null,
  toParentId: string,
): TaskActivity {
  return createActivity({
    actorId,
    taskId,
    kind: "moved",
    fromParentId,
    toParentId,
  });
}

export function buildFileRemovedActivity(
  taskId: string,
  actorId: string,
  fileName: string,
): TaskActivity {
  return createActivity({
    actorId,
    taskId,
    kind: "file_removed",
    fileName,
  });
}

export function buildFileRenamedActivity(
  taskId: string,
  actorId: string,
  previousName: string,
  fileName: string,
): TaskActivity {
  return createActivity({
    actorId,
    taskId,
    kind: "file_renamed",
    previousText: previousName,
    fileName,
  });
}
