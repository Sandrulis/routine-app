"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
} from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DragHandle } from "@/app/components/drag-handle";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import {
  checklistActiveSpentMs,
  checklistProgress,
  checklistTimerOwnedBy,
  createChecklistItemId,
  emptyChecklist,
  formatSpentDuration,
  pauseChecklistItemTimer,
  startChecklistItemTimer,
  stopChecklistItemTimer,
  type ChecklistActor,
  type TaskChecklist,
  type TaskChecklistItem,
} from "@/app/lib/task-checklists";

const CHECKLIST_TEXT_SAVE_MS = 500;

type DragBinding = {
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  isDragging: boolean;
};

function reorderById<T extends { id: string }>(
  items: T[],
  activeId: string,
  overId: string,
): T[] | null {
  const oldIndex = items.findIndex((item) => item.id === activeId);
  const newIndex = items.findIndex((item) => item.id === overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return null;
  return arrayMove(items, oldIndex, newIndex);
}

function VerticalSortable({
  as: Component = "div",
  ids,
  className,
  onReorder,
  children,
}: {
  as?: "div" | "ul";
  ids: string[];
  className?: string;
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <Component className={className}>{children}</Component>
      </SortableContext>
    </DndContext>
  );
}

function SortableChecklistShell({
  id,
  children,
}: {
  id: string;
  children: (binding: DragBinding) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative z-10" : undefined}
    >
      {children({ attributes, listeners, isDragging })}
    </div>
  );
}

function SortableChecklistItem({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: (binding: DragBinding) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`${className}${isDragging ? " relative z-10 rounded-lg bg-white shadow-sm" : ""}`}
    >
      {children({ attributes, listeners, isDragging })}
    </li>
  );
}

function ReorderGrip({
  label,
  binding,
}: {
  label: string;
  binding: DragBinding;
}) {
  return (
    <span
      className="inline-flex shrink-0"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DragHandle
        label={label}
        attributes={binding.attributes}
        listeners={binding.listeners}
      />
    </span>
  );
}

function ChecklistTimeSummary({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 text-right">
      <div className="text-[11px] font-medium leading-none text-zinc-500">{label}</div>
      <div className="mt-0.5 text-[10px] leading-none tabular-nums text-zinc-400">{value}</div>
    </div>
  );
}

function ChecklistTimeBar({
  item,
  disabled,
  actor,
  onChange,
}: {
  item: TaskChecklistItem;
  disabled: boolean;
  actor?: ChecklistActor | null;
  onChange: (item: TaskChecklistItem) => void;
}) {
  const { t } = useTranslations();
  const { formatDateTime } = useDisplayPreferences();
  const running = Boolean(item.activeTimer?.runningSince);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const finished = (item.timeLogs ?? []).at(-1) ?? null;
  const canControl = checklistTimerOwnedBy(item.activeTimer, actor);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [running]);

  const elapsed = item.activeTimer
    ? checklistActiveSpentMs(item.activeTimer, nowMs)
    : 0;

  if (!item.activeTimer && finished) {
    return (
      <div className="flex shrink-0 items-center gap-3">
        {finished.actorName ? (
          <span className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full bg-zinc-100 px-2.5 text-[12px] font-medium text-zinc-700">
            {finished.actorName}
          </span>
        ) : null}
        <ChecklistTimeSummary
          label={t("subtasks.checklist.time.started", "Uzsāka")}
          value={formatDateTime(finished.startedAt)}
        />
        <ChecklistTimeSummary
          label={t("subtasks.checklist.time.ended", "Beidza")}
          value={formatDateTime(finished.endedAt)}
        />
        <ChecklistTimeSummary
          label={t("subtasks.checklist.time.spent", "Kopā")}
          value={formatSpentDuration(finished.spentMs)}
        />
      </div>
    );
  }

  return (
    <>
      {item.activeTimer?.actorName ? (
        <span className="inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full bg-zinc-100 px-2.5 text-[12px] font-medium text-zinc-700">
          {item.activeTimer.actorName}
        </span>
      ) : null}
      {!disabled && (!item.activeTimer || (!running && canControl)) ? (
        <button
          type="button"
          onClick={() => onChange(startChecklistItemTimer(item, new Date().toISOString(), actor))}
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-2 text-[11px] font-semibold text-white transition hover:bg-emerald-700"
        >
          <i className="fas fa-play text-[9px]" aria-hidden="true" />
          {t("subtasks.checklist.time.start", "Sākt")}
        </button>
      ) : null}
      {!disabled && running && canControl ? (
        <button
          type="button"
          onClick={() => onChange(pauseChecklistItemTimer(item, Date.now(), actor))}
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-amber-500 px-2 text-[11px] font-semibold text-white transition hover:bg-amber-600"
        >
          <i className="fas fa-pause text-[9px]" aria-hidden="true" />
          {t("subtasks.checklist.time.pause", "Pauzēt")}
        </button>
      ) : null}
      {!disabled && item.activeTimer && canControl ? (
        <button
          type="button"
          onClick={() =>
            onChange({ ...stopChecklistItemTimer(item, new Date().toISOString(), Date.now(), actor), done: true })
          }
          className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-zinc-800 px-2 text-[11px] font-semibold text-white transition hover:bg-zinc-900"
        >
          <i className="fas fa-stop text-[9px]" aria-hidden="true" />
          {t("subtasks.checklist.time.stop", "Apturēt")}
        </button>
      ) : null}
      {item.activeTimer && !running && !canControl ? (
        <span className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg bg-amber-100 px-2 text-[11px] font-semibold text-amber-800">
          <i className="fas fa-pause text-[9px]" aria-hidden="true" />
          {t("subtasks.checklist.time.paused", "Pauzēts")}
        </span>
      ) : null}
      {item.activeTimer ? (
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-zinc-600">
          {formatSpentDuration(elapsed)}
        </span>
      ) : null}
    </>
  );
}

function ChecklistCard({
  list,
  disabled,
  structureLocked,
  listDrag = null,
  timeTracking = false,
  actor = null,
  onChange,
  onRemove,
  onSnapshot,
}: {
  list: TaskChecklist;
  disabled: boolean;
  structureLocked: boolean;
  listDrag?: DragBinding | null;
  timeTracking?: boolean;
  actor?: ChecklistActor | null;
  onChange: (list: TaskChecklist) => void;
  onRemove: () => void;
  onSnapshot: (list: TaskChecklist) => void;
}) {
  const { t } = useTranslations();
  const lastItemRef = useRef<HTMLInputElement | null>(null);
  const itemCountRef = useRef(list.items.length);
  const textTimerRef = useRef<number | null>(null);
  const editingTextRef = useRef(false);
  const pendingRef = useRef<TaskChecklist | null>(null);
  const onChangeRef = useRef(onChange);
  const onSnapshotRef = useRef(onSnapshot);
  onChangeRef.current = onChange;
  onSnapshotRef.current = onSnapshot;
  const [local, setLocal] = useState(list);
  const lockStructure = disabled || structureLocked;
  const canReorderItems = !lockStructure && local.items.length > 1;
  const dragLabel = t("subtasks.drag", "Mainīt secību");

  useEffect(() => {
    if (editingTextRef.current || pendingRef.current) return;
    setLocal(list);
  }, [list]);

  useEffect(() => {
    onSnapshotRef.current(local);
  }, [local]);

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

  function latestList() {
    return pendingRef.current ?? local;
  }

  function updateItem(
    itemId: string,
    patch: Partial<TaskChecklist["items"][number]>,
    persistNow = true,
  ) {
    const source = latestList();
    const next = {
      ...source,
      items: source.items.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    };
    if (persistNow) commitNow(next);
    else commitText(next);
  }

  function removeItem(itemId: string) {
    const source = latestList();
    commitNow({
      ...source,
      items: source.items.filter((item) => item.id !== itemId),
    });
  }

  function addItem(title: string) {
    const source = latestList();
    commitNow({
      ...source,
      items: [
        ...source.items,
        { id: createChecklistItemId(), title, done: false, timeLogs: [], activeTimer: null },
      ],
    });
  }

  function reorderItems(activeId: string, overId: string) {
    const source = latestList();
    const items = reorderById(source.items, activeId, overId);
    if (!items) return;
    commitNow({ ...source, items });
  }

  function renderItem(
    item: TaskChecklistItem,
    index: number,
    binding: DragBinding | null,
  ) {
    return (
      <>
        {binding ? <ReorderGrip label={dragLabel} binding={binding} /> : null}
        <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          disabled={disabled || (Boolean(item.activeTimer?.actorId) && !checklistTimerOwnedBy(item.activeTimer, actor))}
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
          className={`min-h-8 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 ${
            item.done ? "text-zinc-400 line-through" : "text-zinc-800"
          }`}
        />
        {timeTracking ? (
          <ChecklistTimeBar
            item={item}
            disabled={disabled}
            actor={actor}
            onChange={(next) =>
              updateItem(item.id, {
                done: next.done,
                activeTimer: next.activeTimer,
                timeLogs: next.timeLogs,
              })
            }
          />
        ) : null}
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
        </div>
        </div>
      </>
    );
  }

  const addRow = !lockStructure ? (
    <li className="flex items-center gap-2">
      {canReorderItems ? (
        <span className="inline-block w-6 shrink-0" aria-hidden="true" />
      ) : null}
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
        placeholder={t("subtasks.checklist.item_placeholder", "Jauns punkts")}
      />
    </li>
  ) : null;

  const itemRows = local.items.map((item, index) =>
    canReorderItems ? (
      <SortableChecklistItem
        key={item.id}
        id={item.id}
        className="group/item flex items-start gap-2"
      >
        {(binding) => renderItem(item, index, binding)}
      </SortableChecklistItem>
    ) : (
      <li key={item.id} className="group/item flex items-start gap-2">
        {renderItem(item, index, null)}
      </li>
    ),
  );

  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-3${
        listDrag?.isDragging ? " shadow-md" : ""
      }`}
    >
      <div className="flex items-center gap-2">
        {listDrag ? <ReorderGrip label={dragLabel} binding={listDrag} /> : null}
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
            commitText({ ...latestList(), title: event.target.value });
          }}
          onBlur={() => {
            if (lockStructure) return;
            flushText();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          className="min-h-8 min-w-0 flex-1 bg-transparent text-sm font-semibold text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400"
          placeholder={t(
            "subtasks.checklist.name_placeholder",
            "Saraksta nosaukums",
          )}
        />
        {local.items.some((item) => item.title.trim()) ? (
          <span className="shrink-0 text-[12px] font-medium tabular-nums text-zinc-400">
            {local.items.filter((item) => item.title.trim() && item.done).length}
            {" / "}
            {local.items.filter((item) => item.title.trim()).length}
          </span>
        ) : null}
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

      {canReorderItems ? (
        <VerticalSortable
          as="ul"
          ids={local.items.map((item) => item.id)}
          className="mt-2 space-y-1"
          onReorder={reorderItems}
        >
          {itemRows}
          {addRow}
        </VerticalSortable>
      ) : (
        <ul className="mt-2 space-y-1">
          {itemRows}
          {addRow}
        </ul>
      )}
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
  timeTracking = false,
  actor = null,
}: {
  checklists: TaskChecklist[];
  onChange: (checklists: TaskChecklist[]) => void;
  disabled?: boolean;
  structureLocked?: boolean;
  defaultExpanded?: boolean;
  forceCollapsed?: boolean;
  timeTracking?: boolean;
  actor?: ChecklistActor | null;
}) {
  const { t } = useTranslations();
  const checklistsRef = useRef(checklists);
  const liveRef = useRef(new Map<string, TaskChecklist>());
  const hasChecklists = checklists.length > 0;
  const [expanded, setExpanded] = useState(
    !forceCollapsed && (hasChecklists || defaultExpanded),
  );
  const rememberList = useCallback((list: TaskChecklist) => {
    liveRef.current.set(list.id, list);
  }, []);

  useEffect(() => {
    checklistsRef.current = checklists;
  }, [checklists]);

  function listsNow() {
    return checklistsRef.current.map(
      (list) => liveRef.current.get(list.id) ?? list,
    );
  }

  function replaceList(next: TaskChecklist) {
    liveRef.current.set(next.id, next);
    const merged = checklistsRef.current.map((item) =>
      item.id === next.id ? next : item,
    );
    checklistsRef.current = merged;
    onChange(merged);
  }

  function removeList(listId: string) {
    liveRef.current.delete(listId);
    const merged = checklistsRef.current.filter((item) => item.id !== listId);
    checklistsRef.current = merged;
    onChange(merged);
  }

  function addList() {
    const merged = [...listsNow(), emptyChecklist()];
    checklistsRef.current = merged;
    onChange(merged);
  }

  function reorderLists(activeId: string, overId: string) {
    const next = reorderById(listsNow(), activeId, overId);
    if (!next) return;
    checklistsRef.current = next;
    onChange(next);
  }
  const progress = checklistProgress(checklists);
  const lockStructure = disabled || structureLocked;
  const canReorderLists = !lockStructure && checklists.length > 1;
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
          {canReorderLists ? (
            <VerticalSortable
              ids={checklists.map((list) => list.id)}
              className="space-y-3"
              onReorder={reorderLists}
            >
              {checklists.map((list) => (
                <SortableChecklistShell key={list.id} id={list.id}>
                  {(binding) => (
                    <ChecklistCard
                      list={list}
                      disabled={disabled}
                      structureLocked={structureLocked}
                      listDrag={binding}
                      timeTracking={timeTracking}
                      actor={actor}
                      onChange={replaceList}
                      onRemove={() => removeList(list.id)}
                      onSnapshot={rememberList}
                    />
                  )}
                </SortableChecklistShell>
              ))}
            </VerticalSortable>
          ) : (
            checklists.map((list) => (
              <ChecklistCard
                key={list.id}
                list={list}
                disabled={disabled}
                structureLocked={structureLocked}
                timeTracking={timeTracking}
                actor={actor}
                onChange={replaceList}
                onRemove={() => removeList(list.id)}
                onSnapshot={rememberList}
              />
            ))
          )}

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
