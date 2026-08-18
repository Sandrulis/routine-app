"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "@/app/components/tooltip";
import { RelativeTime } from "@/app/components/relative-time";
import { useTranslations } from "@/app/components/translations-provider";
import type { WorkTaskStatus } from "@/app/lib/lists";
import { useTaskStatuses } from "@/app/lib/task-statuses";

export const WORK_TASK_STATUSES: WorkTaskStatus[] = [
  "todo",
  "in_progress",
  "done",
];

const STATUS_GROUPS: {
  id: "not_started" | "active" | "closed";
  statuses: WorkTaskStatus[];
}[] = [
  { id: "not_started", statuses: ["todo"] },
  { id: "active", statuses: ["in_progress"] },
  { id: "closed", statuses: ["done"] },
];

export function statusClassName(status: WorkTaskStatus) {
  if (status === "done") return "bg-emerald-500 text-white";
  if (status === "in_progress") return "bg-orange-500 text-white";
  return "bg-zinc-400 text-white";
}

export function statusDotClassName(status: WorkTaskStatus) {
  if (status === "done") return "bg-emerald-500 border-emerald-500";
  if (status === "in_progress") return "bg-orange-500 border-orange-500";
  return "bg-zinc-400 border-zinc-400";
}

export function statusTextClassName(status: WorkTaskStatus) {
  if (status === "done") return "text-emerald-500";
  if (status === "in_progress") return "text-orange-500";
  return "text-zinc-400";
}

export function StatusTreeDot({ status }: { status: string }) {
  const { colorFor } = useTaskStatuses();
  const color = colorFor(status) ?? "#a1a1aa";
  return (
    <span
      className="pointer-events-none inline-flex w-4 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      <span
        className="size-2.5 rounded-full border"
        style={{ backgroundColor: color, borderColor: color }}
      />
    </span>
  );
}

export function nextWorkTaskStatus(
  status: WorkTaskStatus,
): WorkTaskStatus | null {
  if (status === "todo") return "in_progress";
  if (status === "in_progress") return "done";
  return null;
}

export function useStatusLabels(): Record<WorkTaskStatus, string> {
  const { t } = useTranslations();
  const { labelFor, statuses } = useTaskStatuses();
  const labels: Record<string, string> = {
    todo: t("todo.columns.todo", "Darāms"),
    in_progress: t("todo.columns.in_progress", "Procesā"),
    done: t("todo.columns.done", "Gatavs"),
  };
  for (const row of statuses) {
    labels[row.id] = labelFor(row.id);
  }
  return labels as Record<WorkTaskStatus, string>;
}

function statusGroupKey(
  status: string,
  statuses: { id: string; groupKey: string }[],
) {
  const groupKey = statuses.find((row) => row.id === status)?.groupKey;
  if (groupKey) return groupKey;
  if (status === "done") return "closed";
  if (status === "in_progress") return "active";
  return "not_started";
}

export function StatusGlyph({
  color,
  groupKey,
  className = "",
}: {
  color: string;
  groupKey: string;
  className?: string;
}) {
  const fill = color.trim() || "#a1a1aa";

  if (groupKey === "closed") {
    return (
      <span
        className={`inline-flex size-3.5 shrink-0 items-center justify-center rounded-full text-white ${className}`}
        style={{ backgroundColor: fill }}
        aria-hidden="true"
      >
        <i className="fas fa-check text-[8px]" />
      </span>
    );
  }

  if (groupKey === "active") {
    return (
      <span
        className={`relative inline-flex size-3.5 shrink-0 items-center justify-center rounded-full border-2 ${className}`}
        style={{ borderColor: fill }}
        aria-hidden="true"
      >
        <span className="size-1.5 rounded-full" style={{ backgroundColor: fill }} />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex size-3.5 shrink-0 rounded-full border-2 border-dashed ${className}`}
      style={{ borderColor: fill }}
      aria-hidden="true"
    />
  );
}

function StatusIcon({ status }: { status: string }) {
  const { colorFor, statuses } = useTaskStatuses();
  return (
    <StatusGlyph
      color={colorFor(status) ?? "#a1a1aa"}
      groupKey={statusGroupKey(status, statuses)}
    />
  );
}

export function StatusControl({
  status,
  onChange,
  statusChangedAt,
  disabled = false,
  deleted = false,
  onRestore,
  trailing,
  revealActionsOnHover = false,
  actionsForced = false,
}: {
  status: WorkTaskStatus;
  onChange: (next: WorkTaskStatus) => void;
  statusChangedAt?: string | null;
  disabled?: boolean;
  deleted?: boolean;
  onRestore?: () => void;
  trailing?: ReactNode;
  revealActionsOnHover?: boolean;
  actionsForced?: boolean;
}) {
  const { t } = useTranslations();
  const { labelFor, colorFor, nextStatusId, groupedStatuses, statuses } =
    useTaskStatuses();
  const labels = useStatusLabels();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null,
  );
  const nextStatus = nextStatusId(status) as WorkTaskStatus | null;
  const currentStatus = statuses.find((row) => row.id === status);
  const closedStatus =
    [...statuses].reverse().find((row) => row.groupKey === "closed")?.id ?? "done";
  const isDone = currentStatus?.groupKey === "closed" || status === "done";
  const statusColor = deleted ? "#71717a" : colorFor(status);
  const statusLabel = deleted
    ? t("status.deleted", "Dzēsts")
    : labelFor(status) || labels[status];
  const controlsDisabled = disabled || deleted;

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return groupedStatuses
      .map((group) => ({
        id: group.id,
        statuses: group.statuses
          .filter((row) =>
            needle ? labelFor(row.id).toLowerCase().includes(needle) : true,
          )
          .map((row) => row.id as WorkTaskStatus),
      }))
      .filter((group) => group.statuses.length > 0);
  }, [groupedStatuses, labelFor, query]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !rootRef.current || !panelRef.current) {
      setPosition(null);
      return;
    }

    const trigger = rootRef.current.getBoundingClientRect();
    const panel = panelRef.current.getBoundingClientRect();
    const left = Math.min(
      Math.max(12, trigger.left),
      window.innerWidth - 12 - panel.width,
    );
    const below = trigger.bottom + 6;
    const top =
      below + panel.height > window.innerHeight - 12
        ? Math.max(12, trigger.top - 6 - panel.height)
        : below;
    setPosition({ top, left });
  }, [open, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }

    searchRef.current?.focus();

    function handlePointer(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointer);
    window.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      window.removeEventListener("keydown", handleKey, true);
    };
  }, [open]);

  const groupLabel = {
    not_started: t("status.group.not_started", "Nav sākts"),
    active: t("status.group.active", "Aktīvs"),
    closed: t("status.group.closed", "Slēgts"),
  };

  const extrasVisible = !revealActionsOnHover || open || actionsForced;
  const hoverRevealClassName = extrasVisible
    ? ""
    : "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100";
  const splitOnHover = revealActionsOnHover;
  const pillStyle = statusColor ? { backgroundColor: statusColor } : undefined;
  const pillColorClass = statusColor ? "text-white" : statusClassName(status);
  const extraActionsClassName = `inline-flex items-center gap-1 ${hoverRevealClassName}`.trim();

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <div ref={rootRef} className="relative inline-flex items-center gap-1">
      <div
        className={
          splitOnHover
            ? "inline-flex h-8"
            : `inline-flex h-8 overflow-hidden rounded-md ${pillColorClass}`
        }
        style={splitOnHover ? undefined : pillStyle}
      >
        <button
          type="button"
          disabled={deleted ? !onRestore : controlsDisabled}
          onClick={() => {
            if (deleted) {
              onRestore?.();
              return;
            }
            if (controlsDisabled) return;
            setOpen((current) => !current);
          }}
          aria-haspopup={deleted ? undefined : "listbox"}
          aria-expanded={deleted ? undefined : open}
          aria-label={
            deleted
              ? t("subtasks.restore", "Atjaunot")
              : t("subtasks.table.status", "Statuss")
          }
          className={`px-2.5 text-[11px] font-semibold tracking-wide uppercase disabled:cursor-not-allowed ${
            splitOnHover
              ? `${pillColorClass} ${
                  extrasVisible
                    ? "rounded-l-md"
                    : "rounded-md group-hover/row:rounded-r-none group-focus-within/row:rounded-r-none"
                }`
              : ""
          }`}
          style={splitOnHover ? pillStyle : undefined}
        >
          {statusLabel}
        </button>
        <Tooltip label={t("status.next", "Nākamais statuss")} className="h-full">
          <button
            type="button"
            disabled={controlsDisabled || !nextStatus || deleted}
            onClick={() => {
              if (controlsDisabled || !nextStatus || deleted) return;
              onChange(nextStatus);
            }}
            aria-label={t("status.next", "Nākamais statuss")}
            className={`inline-flex h-full w-7 items-center justify-center border-l border-white/30 disabled:cursor-not-allowed disabled:opacity-40 ${
              splitOnHover ? `rounded-r-md ${pillColorClass}` : ""
            } ${hoverRevealClassName}`.trim()}
            style={splitOnHover ? pillStyle : undefined}
          >
            <i className="fas fa-angle-right text-[12px]" aria-hidden="true" />
          </button>
        </Tooltip>
      </div>

      <span className={extraActionsClassName}>
      <Tooltip label={t("status.complete", "Pabeigt")}>
        <button
          type="button"
          disabled={controlsDisabled || isDone}
          onClick={() => onChange(closedStatus as WorkTaskStatus)}
          aria-label={t("status.complete", "Pabeigt")}
          aria-pressed={isDone}
          className={`inline-flex size-8 items-center justify-center rounded-md transition ${
            isDone
              ? "bg-emerald-100 text-emerald-700"
              : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          } disabled:cursor-not-allowed`}
        >
          <i className="fas fa-check text-[12px]" aria-hidden="true" />
        </button>
      </Tooltip>
      {trailing}
      </span>

      {open && mounted && !deleted
        ? createPortal(
            <div
              ref={panelRef}
              data-app-modal-ignore-backdrop=""
              role="listbox"
              aria-label={t("subtasks.table.status", "Statuss")}
              onMouseDown={(event) => event.stopPropagation()}
              style={{
                position: "fixed",
                top: position?.top ?? 0,
                left: position?.left ?? 0,
                zIndex: 80,
                opacity: position ? 1 : 0,
              }}
              className="flex max-h-[min(22rem,calc(100vh-1.5rem))] w-[17.5rem] flex-col overflow-hidden rounded-md bg-white shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
            >
              <div className="p-2">
                <input
                  ref={searchRef}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") event.preventDefault();
                  }}
                  placeholder={t("lists.fields.icon_search", "Meklēt...")}
                  className="min-h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-[13px] text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto pb-2 [scrollbar-width:thin]">
                {groups.length === 0 ? (
                  <p className="px-3 py-6 text-center text-[13px] text-zinc-400">
                    {t("status.search.empty", "Nav atbilstošu statusu.")}
                  </p>
                ) : (
                  groups.map((group, index) => (
                    <div
                      key={group.id}
                      className={index > 0 ? "mt-1 border-t border-zinc-100 pt-1" : ""}
                    >
                      <p className="px-3 py-1.5 text-[11px] font-medium text-zinc-400">
                        {groupLabel[group.id]}
                      </p>
                      {group.statuses.map((item) => {
                        const selected = item === status;
                        return (
                          <button
                            key={item}
                            type="button"
                            role="option"
                            aria-selected={selected}
                            onClick={() => {
                              onChange(item);
                              setOpen(false);
                            }}
                            className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] font-medium tracking-wide uppercase transition ${
                              selected
                                ? "bg-zinc-100 text-zinc-900"
                                : "text-zinc-700 hover:bg-zinc-50"
                            }`}
                          >
                            <StatusIcon status={item} />
                            <span className="min-w-0 flex-1 truncate">
                              {labelFor(item) || labels[item]}
                            </span>
                            {selected ? (
                              <i
                                className="fas fa-check text-[11px] text-zinc-800"
                                aria-hidden="true"
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
      </div>
      {statusChangedAt ? (
        <RelativeTime
          at={statusChangedAt}
          className="text-[11px] leading-tight tabular-nums text-zinc-400"
        />
      ) : null}
    </div>
  );
}
