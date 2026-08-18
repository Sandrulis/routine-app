"use client";

import { useEffect, useRef, useState } from "react";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  checklistProgress,
  createChecklistItemId,
  emptyChecklist,
  type TaskChecklist,
} from "@/app/lib/task-checklists";

function ChecklistCard({
  list,
  disabled,
  structureLocked,
  onChange,
  onRemove,
}: {
  list: TaskChecklist;
  disabled: boolean;
  structureLocked: boolean;
  onChange: (list: TaskChecklist) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslations();
  const lastItemRef = useRef<HTMLInputElement | null>(null);
  const itemCountRef = useRef(list.items.length);
  const lockStructure = disabled || structureLocked;

  useEffect(() => {
    if (list.items.length > itemCountRef.current) {
      const input = lastItemRef.current;
      if (input) {
        input.focus();
        const length = input.value.length;
        input.setSelectionRange(length, length);
      }
    }
    itemCountRef.current = list.items.length;
  }, [list.items.length]);

  function updateItem(
    itemId: string,
    patch: Partial<TaskChecklist["items"][number]>,
  ) {
    onChange({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    });
  }

  function removeItem(itemId: string) {
    onChange({
      ...list,
      items: list.items.filter((item) => item.id !== itemId),
    });
  }

  function addItem(title: string) {
    onChange({
      ...list,
      items: [
        ...list.items,
        { id: createChecklistItemId(), title, done: false },
      ],
    });
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
      <div className="flex items-center gap-2">
        <label htmlFor={`checklist-title-${list.id}`} className="sr-only">
          {t("subtasks.checklist.name_placeholder", "Saraksta nosaukums")}
        </label>
        <input
          id={`checklist-title-${list.id}`}
          value={list.title}
          readOnly={lockStructure}
          onChange={(event) => onChange({ ...list, title: event.target.value })}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          className="min-h-8 w-full bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400"
          placeholder={t(
            "subtasks.checklist.name_placeholder",
            "Saraksta nosaukums",
          )}
        />
        {!lockStructure ? (
          <Tooltip label={t("actions.delete", "Dzēst")} align="end">
            <button
              type="button"
              aria-label={t("actions.delete", "Dzēst")}
              onClick={onRemove}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <i className="fas fa-trash text-[11px]" aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}
      </div>

      <ul className="mt-2 space-y-1">
        {list.items.map((item, index) => (
          <li key={item.id} className="group/item flex items-center gap-2">
            <button
              type="button"
              role="checkbox"
              aria-checked={item.done}
              disabled={disabled}
              onClick={() => updateItem(item.id, { done: !item.done })}
              className={`inline-flex size-5 shrink-0 items-center justify-center rounded border transition disabled:cursor-not-allowed ${
                item.done
                  ? "border-emerald-500 bg-emerald-500 text-white"
                  : "border-zinc-300 bg-white text-transparent hover:border-zinc-400"
              }`}
            >
              <i className="fas fa-check text-[9px]" aria-hidden="true" />
            </button>
            <input
              ref={index === list.items.length - 1 ? lastItemRef : undefined}
              value={item.title}
              readOnly={lockStructure}
              onChange={(event) => {
                updateItem(item.id, { title: event.target.value });
              }}
              onBlur={() => {
                if (lockStructure) return;
                if (!item.title.trim()) removeItem(item.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              className={`min-h-8 w-full bg-transparent text-sm outline-none placeholder:text-zinc-400 ${
                item.done ? "text-zinc-400 line-through" : "text-zinc-800"
              }`}
            />
            {!lockStructure ? (
              <Tooltip label={t("actions.delete", "Dzēst")} align="end">
                <button
                  type="button"
                  aria-label={t("actions.delete", "Dzēst")}
                  onClick={() => removeItem(item.id)}
                  className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-zinc-300 opacity-0 transition group-hover/item:opacity-100 hover:bg-zinc-100 hover:text-zinc-600 focus-visible:opacity-100"
                >
                  <i className="fas fa-xmark text-[11px]" aria-hidden="true" />
                </button>
              </Tooltip>
            ) : null}
          </li>
        ))}
        {!lockStructure ? (
          <li className="flex items-center gap-2">
            <span
              className="inline-flex size-5 shrink-0 items-center justify-center rounded border border-dashed border-zinc-300 bg-white"
              aria-hidden="true"
            />
            <input
              value=""
              onChange={(event) => {
                const title = event.target.value;
                if (!title) return;
                addItem(title);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.preventDefault();
              }}
              className="min-h-8 w-full bg-transparent text-sm text-zinc-800 outline-none placeholder:text-zinc-400"
              placeholder={t(
                "subtasks.checklist.item_placeholder",
                "Jauns punkts",
              )}
            />
          </li>
        ) : null}
      </ul>
    </div>
  );
}

export function TaskChecklists({
  checklists,
  onChange,
  disabled = false,
  structureLocked = false,
}: {
  checklists: TaskChecklist[];
  onChange: (checklists: TaskChecklist[]) => void;
  disabled?: boolean;
  structureLocked?: boolean;
}) {
  const { t } = useTranslations();
  const [expanded, setExpanded] = useState(true);
  const progress = checklistProgress(checklists);
  const lockStructure = disabled || structureLocked;

  return (
    <section>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700"
        aria-expanded={expanded}
      >
        <i
          className={`fas fa-chevron-down text-[10px] text-zinc-400 transition ${
            expanded ? "" : "-rotate-90"
          }`}
          aria-hidden="true"
        />
        <span>
          {t("subtasks.checklist.title", "Check List")}
          {progress.total > 0 ? ` ${progress.done}/${progress.total}` : ""}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3">
          {checklists.map((list) => (
            <ChecklistCard
              key={list.id}
              list={list}
              disabled={disabled}
              structureLocked={structureLocked}
              onChange={(next) =>
                onChange(
                  checklists.map((item) => (item.id === next.id ? next : item)),
                )
              }
              onRemove={() =>
                onChange(checklists.filter((item) => item.id !== list.id))
              }
            />
          ))}

          {!lockStructure ? (
            <button
              type="button"
              onClick={() => onChange([...checklists, emptyChecklist()])}
              className="inline-flex min-h-9 items-center gap-2 rounded-xl px-1 text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              <i className="fas fa-plus text-[11px]" aria-hidden="true" />
              {t("subtasks.checklist.add", "Pievienot sarakstu")}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
