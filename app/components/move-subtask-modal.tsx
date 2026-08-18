"use client";

import { AppModal } from "@/app/components/app-modal";
import { useTranslations } from "@/app/components/translations-provider";
import {
  getTaskAncestors,
  getTaskTree,
  isTaskDeleted,
  workItemIcon,
  type WorkTask,
} from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";

export function MoveSubtaskModal({
  open,
  task,
  onOpenChange,
}: {
  open: boolean;
  task: WorkTask | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslations();
  const { tasks, moveSubtask } = useLists();

  const destinations = task
    ? getTaskTree(tasks, task.listId).filter(
        (item) =>
          item.kind === "task" &&
          item.id !== task.parentId &&
          !isTaskDeleted(item),
      )
    : [];

  function handleMove(parentId: string) {
    if (!task) return;
    moveSubtask(task.id, parentId);
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={t("subtasks.move.title", "Pārvietot apakšuzdevumu")}
      description={
        task
          ? t(
              "subtasks.move.description",
              "Izvēlies uzdevumu, uz kuru pārvietot “{name}”.",
              { name: task.title },
            )
          : undefined
      }
    >
      {destinations.length === 0 ? (
        <p className="text-sm text-zinc-500">
          {t("subtasks.move.empty", "Sarakstā nav citu uzdevumu.")}
        </p>
      ) : (
        <div className="max-h-80 space-y-1 overflow-y-auto">
          {destinations.map((item) => {
            const depth = getTaskAncestors(tasks, item).length;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleMove(item.id)}
                style={{ paddingLeft: `${0.75 + depth * 1}rem` }}
                className="flex w-full items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-left text-sm font-medium text-zinc-800 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <i
                  className={`${workItemIcon(item)} w-4 text-center text-[12px] text-zinc-400`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
              </button>
            );
          })}
        </div>
      )}
    </AppModal>
  );
}
