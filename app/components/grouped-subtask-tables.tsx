"use client";

import { SubtaskTable } from "@/app/components/subtask-table";
import type { WorkTask } from "@/app/lib/lists";

export function GroupedSubtaskTables({
  listId,
  tasks,
  onOpenTask,
  includeClosed = false,
  embedded = true,
}: {
  listId: string;
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
  includeClosed?: boolean;
  embedded?: boolean;
}) {
  return (
    <SubtaskTable
      listId={listId}
      tasks={tasks}
      onOpenTask={onOpenTask}
      embedded={embedded}
      view={includeClosed ? "with-archive" : "active"}
      groupByStatus
      mergeStatusByLabel
    />
  );
}
