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

const CHECKLIST_TEXT_SAVE_MS = 500;

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
  const textTimerRef = useRef<number | null>(null);
  const editingTextRef = useRef(false);
  const pendingRef = useRef<TaskChecklist | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const [local, setLocal] = useState(list);
  const lockStructure = disabled || structureLocked;

  useEffect(() => {
    if (editingTextRef.current || pendingRef.current) return;
    setLocal(list);
  }, [list]);

  useEffect(() => {
    if (local.items.length > itemCountRef.current) {
      const input = lastItemRef.current;
      if (input) {
        input.focus();
        const length = input.value.length;
        input.setSelectionRange(length, length);
      }
    }
    itemCountRef.current = local.items.length;
  }, [local.items.length]);

  useEffect(() => {
    return () => {
      if (textTimerRef.current) window.clearTimeout(textTimerRef.current);
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) onChangeRef.current(pending);
    };
  }, []);

  function commitNow(next: TaskChecklist) {
    if (textTimerRef.current) {
      window.clearTimeout(textTimerRef.current);
      textTimerRef.current = null;
    }
    pendingRef.current = null;
    setLocal(next);
    onChange(next);
  }

  function commitText(next: TaskChecklist) {
    setLocal(next);
    pendingRef.current = next;
    if (textTimerRef.current) window.clearTimeout(textTimerRef.current);
    textTimerRef.current = window.setTimeout(() => {
      textTimerRef.current = null;
      editingTextRef.current = false;
      const pending = pendingRef.current;
      pendingRef.current = null;
      if (pending) onChange(pending);
    }, CHECKLIST_TEXT_SAVE_MS);
  }

  function flushText() {
    editingTextRef.current = false;
    if (textTimerRef.current) {
      window.clearTimeout(textTimerRef.current);
      textTimerRef.current = null;
    }
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    onChange(pending);
  }

  function updateItem(
    itemId: string,
    patch: Partial<TaskChecklist["items"][number]>,
    persistNow = true,
  ) {
    const next = {
      ...local,
      items: local.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    };
    if (persistNow) commitNow(next);
    else commitText(next);
  }

  function removeItem(itemId: string) {
    commitNow({
      ...local,
      items: local.items.filter((item) => item.id !== itemId),
    });
  }

  function addItem(title: string) {
    commitNow({
      ...local,
      items: [
        ...local.items,
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
          value={local.title}
          readOnly={lockStructure}
          onFocus={() => {
            editingTextRef.current = true;
          }}
          onChange={(event) => {
            editingTextRef.current = true;
            commitText({ ...local, title: event.target.value });
          }}
          onBlur={() => {
            if (lockStructure) return;
            flushText();
          }}
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
        {local.items.map((item, index) => (
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
              ref={index === local.items.length - 1 ? lastItemRef : undefined}
              value={item.title}
              readOnly={lockStructure}
              onFocus={() => {
                editingTextRef.current = true;
              }}
              onChange={(event) => {
                editingTextRef.current = true;
                updateItem(item.id, { title: event.target.value }, false);
              }}
              onBlur={() => {
                if (lockStructure) return;
                const latest = pendingRef.current ?? local;
                const latestItem = latest.items.find((row) => row.id === item.id);
                if (!latestItem?.title.trim()) {
                  pendingRef.current = null;
                  if (textTimerRef.current) {
                    window.clearTimeout(textTimerRef.current);
                    textTimerRef.current = null;
                  }
                  editingTextRef.current = false;
                  commitNow({
                    ...latest,
                    items: latest.items.filter((row) => row.id !== item.id),
                  });
                  return;
                }
                flushText();
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
  defaultExpanded = false,
  forceCollapsed = false,
}: {
  checklists: TaskChecklist[];
  onChange: (checklists: TaskChecklist[]) => void;
  disabled?: boolean;
  structureLocked?: boolean;
  defaultExpanded?: boolean;
  forceCollapsed?: boolean;
}) {
  const { t } = useTranslations();
  const checklistsRef = useRef(checklists);
  const hasChecklists = checklists.length > 0;
  const [expanded, setExpanded] = useState(
    !forceCollapsed && (hasChecklists || defaultExpanded),
  );

  useEffect(() => {
    checklistsRef.current = checklists;
  }, [checklists]);

  function replaceList(next: TaskChecklist) {
    const merged = checklistsRef.current.map((item) =>
      item.id === next.id ? next : item,
    );
    checklistsRef.current = merged;
    onChange(merged);
  }

  function removeList(listId: string) {
    const merged = checklistsRef.current.filter((item) => item.id !== listId);
    checklistsRef.current = merged;
    onChange(merged);
  }

  function addList() {
    const merged = [...checklistsRef.current, emptyChecklist()];
    checklistsRef.current = merged;
    onChange(merged);
  }
  const progress = checklistProgress(checklists);
  const lockStructure = disabled || structureLocked;
  const isExpanded = !forceCollapsed && expanded;

  useEffect(() => {
    if (forceCollapsed) {
      setExpanded(false);
      return;
    }
    setExpanded(checklists.length > 0);
  }, [checklists.length, forceCollapsed]);

  const chevron = (
    <i
      className={`fas fa-chevron-down text-[10px] text-zinc-400 transition ${
        isExpanded ? "" : "-rotate-90"
      }`}
      aria-hidden="true"
    />
  );
  const title = (
    <span>
      {t("subtasks.checklist.title", "Check List")}
      {!forceCollapsed && progress.total > 0 ? ` ${progress.done}/${progress.total}` : ""}
    </span>
  );

  return (
    <section>
      <button
        type="button"
        disabled={forceCollapsed}
        onClick={() => setExpanded((current) => !current)}
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-700 disabled:cursor-default disabled:opacity-80"
        aria-expanded={isExpanded}
      >
        {chevron}
        {title}
      </button>

      {isExpanded ? (
        <div className="mt-3 space-y-3">
          {checklists.map((list) => (
            <ChecklistCard
              key={list.id}
              list={list}
              disabled={disabled}
              structureLocked={structureLocked}
              onChange={replaceList}
              onRemove={() => removeList(list.id)}
            />
          ))}

          {!lockStructure ? (
            <button
              type="button"
              onClick={addList}
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
