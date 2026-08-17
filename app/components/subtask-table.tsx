"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from "@/app/components/drag-handle";
import { StatusControl } from "@/app/components/status-control";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import {
  formatDisplayDateDdMmYy,
  todayIsoDate,
} from "@/app/lib/format-display-date";
import { useLists } from "@/app/lib/lists-store";
import { useTeam } from "@/app/lib/team-store";
import type { WorkTask } from "@/app/lib/lists";

export { statusClassName } from "@/app/components/status-control";

export function DateCell({
  value,
  emptyLabel,
  onChange,
}: {
  value: string | null;
  emptyLabel: string;
  onChange: (next: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    const input = inputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
      } else {
        input.focus();
      }
    } catch {
      input.focus();
    }
  }

  return (
    <div className="relative inline-flex min-h-8 min-w-[7.5rem] items-center">
      <span className="pointer-events-none">
        {value ? (
          <span
            className={`text-[13px] ${
              value < todayIsoDate() ? "text-red-600" : "text-zinc-700"
            }`}
          >
            {formatDisplayDateDdMmYy(value)}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-zinc-300">
            <i className="far fa-calendar-plus text-[12px]" aria-hidden="true" />
            <span className="sr-only">{emptyLabel}</span>
          </span>
        )}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value ?? ""}
        aria-label={emptyLabel}
        data-app-modal-ignore-backdrop=""
        onMouseDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          openPicker();
        }}
        onChange={(event) => onChange(event.target.value || null)}
        className="absolute inset-0 z-10 w-full min-w-[7.5rem] cursor-pointer opacity-[0.01]"
      />
    </div>
  );
}

export function AssigneeCell({
  task,
  assigneeIds,
  onChange,
}: {
  task?: WorkTask;
  assigneeIds?: string[];
  onChange?: (next: string[]) => void;
}) {
  const { t } = useTranslations();
  const { members } = useTeam();
  const { updateTask } = useLists();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const ids = assigneeIds ?? task?.assigneeIds ?? [];
  const assigned = members.filter((member) => ids.includes(member.id));

  useEffect(() => {
    if (!open) return;

    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointer);
    return () => document.removeEventListener("mousedown", handlePointer);
  }, [open]);

  function toggleMember(memberId: string) {
    const next = ids.includes(memberId)
      ? ids.filter((id) => id !== memberId)
      : [...ids, memberId];
    if (onChange) {
      onChange(next);
      return;
    }
    if (task) updateTask(task.id, { assigneeIds: next });
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-label={t("todo.fields.assignee", "Atbildīgais")}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex min-h-8 items-center"
      >
        {assigned.length > 0 ? (
          <span className="flex items-center -space-x-1.5">
            {assigned.map((member) => (
              <UserAvatar key={member.id} member={member} size="xs" />
            ))}
          </span>
        ) : (
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
            <i className="fas fa-user-plus text-[10px]" aria-hidden="true" />
          </span>
        )}
      </button>
      {open ? (
        <div className="absolute top-full left-0 z-20 mt-1 w-52 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg">
          {members.map((member) => {
            const selected = ids.includes(member.id);
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleMember(member.id)}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] ${
                  selected ? "bg-zinc-100 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                <UserAvatar member={member} size="xs" />
                <span className="min-w-0 flex-1 truncate">{member.name}</span>
                {selected ? (
                  <i className="fas fa-check text-[10px] text-emerald-600" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

export function SubtaskTable({
  tasks,
  onOpenTask,
  embedded = false,
}: {
  listId: string;
  tasks: WorkTask[];
  onOpenTask: (task: WorkTask) => void;
  embedded?: boolean;
}) {
  const { t } = useTranslations();
  const { updateTask, reorderTasks } = useLists();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorderTasks(arrayMove(tasks.map((task) => task.id), oldIndex, newIndex));
  }

  if (tasks.length === 0) {
    return (
      <div
        className={
          embedded
            ? "px-1 py-3 text-sm text-zinc-400"
            : "rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-12 text-center text-sm text-zinc-500"
        }
      >
        {t("subtasks.empty", "Šim uzdevumam vēl nav apakšuzdevumu.")}
      </div>
    );
  }

  return (
    <div
      className={
        embedded
          ? "overflow-x-auto"
          : "overflow-x-auto rounded-2xl border border-zinc-200 bg-white"
      }
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-[12px] font-medium text-zinc-400">
              <th className={`${embedded ? "w-8 px-1" : "w-10 px-2"} py-2.5`} />
              <th className={`${embedded ? "px-1" : "px-2"} py-2.5 font-medium`}>
                {t("tasks.fields.title", "Nosaukums")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("todo.fields.assignee", "Atbildīgais")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("tasks.fields.start_date", "Sākums")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("todo.fields.due_date", "Termiņš")}
              </th>
              <th className="px-3 py-2.5 font-medium">
                {t("subtasks.table.status", "Statuss")}
              </th>
            </tr>
          </thead>
          <SortableContext
            items={tasks.map((task) => task.id)}
            strategy={verticalListSortingStrategy}
          >
            <tbody>
              {tasks.map((task) => (
                <SortableSubtaskRow
                  key={task.id}
                  task={task}
                  onOpenTask={onOpenTask}
                  onUpdate={updateTask}
                  dragLabel={t("subtasks.drag", "Mainīt secību")}
                />
              ))}
            </tbody>
          </SortableContext>
        </table>
      </DndContext>
    </div>
  );
}

function SortableSubtaskRow({
  task,
  onOpenTask,
  onUpdate,
  dragLabel,
}: {
  task: WorkTask;
  onOpenTask: (task: WorkTask) => void;
  onUpdate: (
    taskId: string,
    patch: Partial<Pick<WorkTask, "status" | "startDate" | "dueDate">>,
  ) => void;
  dragLabel: string;
}) {
  const { t } = useTranslations();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  return (
    <tr
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/80 ${
        isDragging ? "relative z-10 bg-white shadow-sm" : ""
      }`}
    >
      <td className="px-2 py-2.5">
        <DragHandle
          label={dragLabel}
          attributes={attributes}
          listeners={listeners}
        />
      </td>
      <td className="px-2 py-2.5">
        <button
          type="button"
          onClick={() => onOpenTask(task)}
          className="text-left font-medium text-zinc-900 hover:text-blue-700"
        >
          {task.title}
        </button>
      </td>
      <td className="px-3 py-2.5">
        <AssigneeCell task={task} />
      </td>
      <td className="px-3 py-2.5">
        <DateCell
          value={task.startDate}
          emptyLabel={t("tasks.fields.start_date", "Sākums")}
          onChange={(startDate) => onUpdate(task.id, { startDate })}
        />
      </td>
      <td className="px-3 py-2.5">
        <DateCell
          value={task.dueDate}
          emptyLabel={t("todo.fields.due_date", "Termiņš")}
          onChange={(dueDate) => onUpdate(task.id, { dueDate })}
        />
      </td>
      <td className="px-3 py-2.5">
        <StatusControl
          status={task.status}
          onChange={(status) => onUpdate(task.id, { status })}
        />
      </td>
    </tr>
  );
}
