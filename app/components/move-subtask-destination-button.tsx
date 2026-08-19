"use client";

import { TaskLocationPath } from "@/app/components/task-location-path";
import {
  getSubtaskLocationSegments,
  workItemIcon,
  type WorkList,
  type WorkTask,
} from "@/app/lib/lists";

export function MoveSubtaskDestinationButton({
  item,
  tasks,
  lists,
  originListId,
  onSelect,
}: {
  item: WorkTask;
  tasks: WorkTask[];
  lists: WorkList[];
  originListId: string;
  onSelect: (parentId: string) => void;
}) {
  const listName = lists.find((list) => list.id === item.listId)?.name ?? null;
  const segments = getSubtaskLocationSegments(tasks, item, listName, {
    includeListName: item.listId !== originListId,
  });

  return (
    <button
      type="button"
      role="menuitem"
      onClick={() => onSelect(item.id)}
      className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] text-zinc-700 transition hover:bg-zinc-100"
    >
      <i
        className={`${workItemIcon(item)} mt-0.5 w-4 shrink-0 text-center text-[12px] text-zinc-400`}
        aria-hidden="true"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate">{item.title}</span>
        {segments.length > 0 ? (
          <TaskLocationPath
            segments={segments}
            align="left"
            interactive={false}
            className="mt-0.5"
          />
        ) : null}
      </span>
    </button>
  );
}
