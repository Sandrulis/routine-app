"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { ConfirmModal } from "@/app/components/confirm-modal";
import { Tooltip } from "@/app/components/tooltip";
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
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { useTranslations } from "@/app/components/translations-provider";
import {
  createCustomColumnId,
  resolveTableColumnOrder,
  type CustomTableColumn,
} from "@/app/lib/custom-columns";

const BUILTIN_ROWS = [
  {
    id: "title",
    icon: "fas fa-font",
    labelKey: "tasks.fields.title",
    fallback: "Nosaukums",
    locked: true,
  },
  {
    id: "assignee",
    icon: "far fa-user",
    labelKey: "todo.fields.assignee",
    fallback: "Atbildīgais",
    locked: false,
  },
  {
    id: "startDate",
    icon: "far fa-calendar",
    labelKey: "tasks.fields.start_date",
    fallback: "Sākums",
    locked: false,
  },
  {
    id: "dueDate",
    icon: "far fa-calendar",
    labelKey: "todo.fields.due_date",
    fallback: "Termiņš",
    locked: false,
  },
  {
    id: "status",
    icon: "far fa-circle",
    labelKey: "subtasks.table.status",
    fallback: "Statuss",
    locked: false,
  },
] as const;

export function TableColumnsBadge({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslations();
  const label = t("subtasks.columns", "Kolonnas");
  return (
    <button
      type="button"
      data-table-columns-badge=""
      aria-expanded={open}
      aria-haspopup="dialog"
      onClick={onToggle}
      onPointerDown={(event) => event.stopPropagation()}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-[11px] font-medium transition ${
        open
          ? "border-zinc-300 bg-zinc-100 text-zinc-800"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
      }`}
    >
      <i className="fas fa-table-columns text-[10px]" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

function ColumnDragHandle({
  label,
  attributes,
  listeners,
}: {
  label: string;
  attributes: ReturnType<typeof useSortable>["attributes"];
  listeners: ReturnType<typeof useSortable>["listeners"];
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-4 shrink-0 items-center justify-center text-zinc-300 opacity-0 transition group-hover/colname:opacity-100"
      {...attributes}
      {...listeners}
      onPointerDown={(event) => {
        event.stopPropagation();
        listeners?.onPointerDown?.(event);
      }}
    >
      <i className="fas fa-grip-vertical text-[10px]" aria-hidden="true" />
    </button>
  );
}

export function EditableColumnLabel({
  label,
  className,
  disabled,
  onRename,
}: {
  label: string;
  className: string;
  disabled: boolean;
  onRename?: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(label);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const editingRef = useRef(false);

  useEffect(() => {
    if (!editing) {
      setDraft(label);
      return;
    }
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.select();
  }, [editing, label]);

  function startEdit() {
    if (disabled || !onRename) return;
    editingRef.current = true;
    setDraft(label);
    setEditing(true);
  }

  function cancelEdit() {
    editingRef.current = false;
    setDraft(label);
    setEditing(false);
  }

  function commitEdit() {
    if (!editingRef.current) return;
    editingRef.current = false;
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === label) {
      setDraft(label);
      return;
    }
    onRename?.(trimmed);
  }

  function onKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      commitEdit();
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelEdit();
    }
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        aria-label={label}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commitEdit}
        onKeyDown={onKeyDown}
        onPointerDown={(event) => event.stopPropagation()}
        className={`h-7 min-w-0 flex-1 border-0 bg-transparent outline-none ${className}`}
      />
    );
  }

  return (
    <span
      className={`min-w-0 flex-1 truncate ${className} ${
        disabled || !onRename ? "" : "cursor-text"
      }`}
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        startEdit();
      }}
    >
      {label}
    </span>
  );
}

function SortablePanelRow({
  id,
  icon,
  label,
  custom,
  visible,
  locked,
  reorderable,
  onToggle,
  onRename,
  onDelete,
  reorderLabel,
  deleteLabel,
}: {
  id: string;
  icon: string;
  label: string;
  custom: boolean;
  visible: boolean;
  locked: boolean;
  reorderable: boolean;
  onToggle: (checked: boolean) => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  reorderLabel: string;
  deleteLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !reorderable });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group/colrow flex items-center gap-1.5 rounded-lg px-2 py-1 ${
        isDragging ? "z-10 bg-white shadow-sm" : ""
      }`}
    >
      <div className="group/colname flex min-w-0 flex-1 items-center gap-1.5">
        {reorderable ? (
          <ColumnDragHandle
            label={reorderLabel}
            attributes={attributes}
            listeners={listeners}
          />
        ) : (
          <span className="inline-block size-4 shrink-0" />
        )}
        <i
          className={`${icon} w-3.5 text-center text-[11px] ${
            custom ? "text-blue-500" : "text-zinc-400"
          }`}
          aria-hidden="true"
        />
        <EditableColumnLabel
          label={label}
          disabled={!onRename}
          onRename={onRename}
          className={`text-[13px] ${
            custom
              ? "font-medium text-blue-600"
              : visible
                ? "text-zinc-700"
                : "text-zinc-400"
          }`}
        />
      </div>
      {onDelete ? (
        <Tooltip label={deleteLabel}>
          <button
            type="button"
            aria-label={deleteLabel}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onDelete();
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded text-zinc-300 opacity-0 transition group-hover/colrow:opacity-100 hover:text-red-600"
          >
            <i className="fas fa-trash text-[10px]" aria-hidden="true" />
          </button>
        </Tooltip>
      ) : null}
      <div className="flex w-7 shrink-0 items-center justify-center">
        <ToggleSwitch
          size="sm"
          checked={visible}
          disabled={locked}
          label={label}
          onChange={onToggle}
        />
      </div>
    </li>
  );
}

export function TableColumnsPanel({
  open,
  onClose,
  customColumns,
  columnOrder,
  isHidden,
  setColumnVisible,
  canEdit,
  focusAdd = false,
  onAdd,
  onRename,
  onDelete,
  onReorder,
}: {
  open: boolean;
  onClose: () => void;
  customColumns: CustomTableColumn[];
  columnOrder: string[];
  isHidden: (id: string) => boolean;
  setColumnVisible: (id: string, visible: boolean) => void;
  canEdit: boolean;
  focusAdd?: boolean;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onReorder: (nextOrder: string[]) => void;
}) {
  const { t } = useTranslations();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const reorderLabel = t("subtasks.columns.reorder", "Mainīt kolonnu secību");
  const deleteLabel = t("actions.delete", "Dzēst");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const builtinById = new Map<string, {
    id: string;
    icon: string;
    label: string;
    locked: boolean;
    custom: boolean;
  }>(
    BUILTIN_ROWS.map((row) => [
      row.id,
      {
        id: row.id,
        icon: row.icon,
        label: t(row.labelKey, row.fallback),
        locked: row.locked,
        custom: false,
      },
    ]),
  );
  const customById = new Map(
    customColumns.map((column) => [
      column.id,
      {
        id: column.id,
        icon: "fas fa-t",
        label: column.name,
        locked: false,
        custom: true,
      },
    ]),
  );
  const orderedIds = resolveTableColumnOrder(columnOrder, customColumns);
  const rows = orderedIds
    .map((id) => builtinById.get(id) ?? customById.get(id) ?? null)
    .filter((row): row is NonNullable<typeof row> => row !== null);
  const shownCount = rows.filter((row) => row.locked || !isHidden(row.id)).length;

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (pendingDelete) return;
      event.preventDefault();
      onClose();
    }
    function handlePointerDown(event: PointerEvent) {
      if (pendingDelete) return;
      const target = event.target as Node | null;
      if (!target) return;
      const element = target instanceof Element ? target : target.parentElement;
      if (panelRef.current?.contains(target)) return;
      if (element?.closest("[data-table-columns-badge]")) return;
      if (element?.closest("[role='alertdialog']")) return;
      onClose();
    }
    window.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [onClose, open, pendingDelete]);

  useEffect(() => {
    if (open) return;
    setPendingDelete(null);
  }, [open]);

  useEffect(() => {
    if (!open || !focusAdd) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [focusAdd, open]);

  function submit() {
    const trimmed = name.trim();
    if (!trimmed || !canEdit) return;
    onAdd(trimmed);
    setName("");
    inputRef.current?.focus();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const next = moveIds(orderedIds, String(active.id), String(over.id));
    if (next) onReorder(next);
  }

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={t("actions.close", "Aizvērt")}
        className="absolute inset-0 z-20 bg-zinc-900/5"
        onClick={() => {
          if (pendingDelete) return;
          onClose();
        }}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-label={t("subtasks.columns", "Kolonnas")}
        className="absolute inset-y-0 right-0 z-30 flex w-64 flex-col border-l border-zinc-200 bg-white shadow-[-8px_0_24px_rgba(15,23,42,0.08)]"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between px-3 py-2.5">
          <span className="text-[13px] font-medium text-zinc-500">
            {t("subtasks.columns.shown", "Redzamās")}
          </span>
          <span className="text-[13px] text-zinc-400">{shownCount}</span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <ul>
              {rows.map((row) => {
                const visible = row.locked || !isHidden(row.id);
                return (
                  <SortablePanelRow
                    key={row.id}
                    id={row.id}
                    icon={row.icon}
                    label={row.label}
                    custom={row.custom}
                    visible={visible}
                    locked={row.locked}
                    reorderable={canEdit}
                    reorderLabel={reorderLabel}
                    deleteLabel={deleteLabel}
                    onToggle={(checked) => setColumnVisible(row.id, checked)}
                    onRename={
                      row.custom && canEdit
                        ? (nextName) => onRename(row.id, nextName)
                        : undefined
                    }
                    onDelete={
                      row.custom && canEdit
                        ? () =>
                            setPendingDelete({ id: row.id, name: row.label })
                        : undefined
                    }
                  />
                );
              })}
              {canEdit ? (
                <li className="flex items-center gap-1.5 rounded-lg px-2 py-1">
                  <form
                    className="flex min-w-0 flex-1 items-center gap-1.5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      submit();
                    }}
                  >
                    <button
                      type="submit"
                      disabled={name.trim().length === 0}
                      aria-label={t("subtasks.columns.add", "Pievienot kolonnu")}
                      className="inline-flex size-4 shrink-0 items-center justify-center text-zinc-400 transition hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <i className="fas fa-plus-circle text-[11px]" aria-hidden="true" />
                    </button>
                    <i
                      className="fas fa-t w-3.5 text-center text-[11px] text-zinc-300"
                      aria-hidden="true"
                    />
                    <input
                      ref={inputRef}
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder={t(
                        "subtasks.columns.name_placeholder",
                        "Kolonnas nosaukums",
                      )}
                      className="h-7 min-w-0 flex-1 border-0 bg-transparent text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400"
                    />
                  </form>
                  <span className="inline-block w-7 shrink-0" />
                </li>
              ) : null}
            </ul>
          </SortableContext>
        </DndContext>
        </div>
      </aside>
      <ConfirmModal
        open={Boolean(pendingDelete)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setPendingDelete(null);
        }}
        title={t("subtasks.columns.delete.title", "Dzēst kolonnu?")}
        description={t(
          "subtasks.columns.delete.description",
          "Kolonna “{name}” un tās vērtības uzdevumos tiks dzēstas.",
          { name: pendingDelete?.name ?? "" },
        )}
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          if (!pendingDelete) return;
          onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

export function SortableTableColumnHeader({
  id,
  disabled,
  className,
  style,
  children,
  reorderLabel,
}: {
  id: string;
  disabled: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  reorderLabel: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  return (
    <th
      ref={setNodeRef}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group/colname ${isDragging ? "relative z-10 bg-white opacity-80" : ""} ${className ?? ""}`.trim()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className="inline-flex min-w-0 items-center gap-1">
        {disabled ? null : (
          <ColumnDragHandle
            label={reorderLabel}
            attributes={attributes}
            listeners={listeners}
          />
        )}
        {children}
      </span>
    </th>
  );
}

export const TABLE_COLUMN_DND_PREFIX = "table-col:";

export function tableColumnDndId(columnId: string) {
  return `${TABLE_COLUMN_DND_PREFIX}${columnId}`;
}

export function parseTableColumnDndId(value: string) {
  return value.startsWith(TABLE_COLUMN_DND_PREFIX)
    ? value.slice(TABLE_COLUMN_DND_PREFIX.length)
    : null;
}

export function TableColumnSortContext({
  columnIds,
  onReorder,
  children,
}: {
  columnIds: string[];
  onReorder: (activeId: string, overId: string) => void;
  children: ReactNode;
}) {
  const dndId = "table-columns";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );
  const items = columnIds.map(tableColumnDndId);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = parseTableColumnDndId(String(active.id));
    const overId = parseTableColumnDndId(String(over.id));
    if (!activeId || !overId) return;
    onReorder(activeId, overId);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={horizontalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

export function CustomTableFieldCell({
  value,
  placeholder,
  disabled,
  onCommit,
}: {
  value: string;
  placeholder: string;
  disabled: boolean;
  onCommit: (next: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);

  function commit() {
    if (draft === value) return;
    onCommit(draft);
  }

  return (
    <input
      value={draft}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key !== "Enter") return;
        event.preventDefault();
        (event.currentTarget as HTMLInputElement).blur();
      }}
      onPointerDown={(event) => event.stopPropagation()}
      className="h-8 w-full min-w-0 rounded-md border border-transparent bg-transparent px-1.5 text-[13px] text-zinc-800 outline-none placeholder:text-zinc-300 hover:border-zinc-200 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed"
    />
  );
}

export function nextCustomColumn(
  columns: CustomTableColumn[],
  name: string,
): CustomTableColumn {
  const maxOrder = columns.reduce(
    (max, column) => Math.max(max, column.sortOrder),
    -1,
  );
  return {
    id: createCustomColumnId(),
    name,
    sortOrder: maxOrder + 1,
  };
}

function moveIds(order: string[], activeId: string, overId: string) {
  const oldIndex = order.indexOf(activeId);
  const newIndex = order.indexOf(overId);
  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return null;
  const next = [...order];
  const [moved] = next.splice(oldIndex, 1);
  if (!moved) return null;
  next.splice(newIndex, 0, moved);
  return next;
}
