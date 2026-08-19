"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useDisplayPreferences } from "@/app/components/display-preferences-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { todayIsoDate } from "@/app/lib/format-display-date";

type DatePickerPopoverProps = {
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const DAY_NAMES_MON = ["P", "O", "T", "C", "Pk", "S", "Sv"];
const DAY_NAMES_SUN = ["Sv", "P", "O", "T", "C", "Pk", "S"];

export function DatePickerPopover({
  value,
  onChange,
  disabled,
  triggerRef,
  open,
  onOpenChange,
}: DatePickerPopoverProps) {
  const { preferences } = useDisplayPreferences();
  const { t } = useTranslations();
  const panelRef = useRef<HTMLDivElement>(null);
  const startSunday = preferences.weekStartDay === "sunday";
  const dayNames = startSunday ? DAY_NAMES_SUN : DAY_NAMES_MON;

  const today = todayIsoDate();
  const initialMonth = value || today;
  const [viewYear, setViewYear] = useState(() => parseInt(initialMonth.slice(0, 4), 10));
  const [viewMonth, setViewMonth] = useState(() => parseInt(initialMonth.slice(5, 7), 10) - 1);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (open) {
      const base = value || today;
      setViewYear(parseInt(base.slice(0, 4), 10));
      setViewMonth(parseInt(base.slice(5, 7), 10) - 1);
    }
  }, [open, value, today]);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !panelRef.current) {
      setPosition(null);
      return;
    }
    const rect = triggerRef.current.getBoundingClientRect();
    const panel = panelRef.current;
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    let top = rect.bottom + 4;
    let left = rect.left;
    if (top + ph > window.innerHeight - 8) {
      top = rect.top - ph - 4;
    }
    if (left + pw > window.innerWidth - 8) {
      left = window.innerWidth - pw - 8;
    }
    if (left < 8) left = 8;
    setPosition({ top, left });
  }, [open, triggerRef, viewYear, viewMonth]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("mousedown", handleClick, true);
    document.addEventListener("keydown", handleKey, true);
    return () => {
      document.removeEventListener("mousedown", handleClick, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open, onOpenChange, triggerRef]);

  const days = useMemo(() => {
    return buildCalendarDays(viewYear, viewMonth, startSunday);
  }, [viewYear, viewMonth, startSunday]);

  const monthLabel = useMemo(() => {
    const d = new Date(viewYear, viewMonth, 1);
    return d.toLocaleString("default", { month: "long", year: "numeric" });
  }, [viewYear, viewMonth]);

  const goToPrev = useCallback(() => {
    setViewMonth((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNext = useCallback(() => {
    setViewMonth((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  function selectDate(iso: string) {
    onChange(iso);
    onOpenChange(false);
  }

  function handleClear() {
    onChange(null);
    onOpenChange(false);
  }

  function handleToday() {
    onChange(today);
    onOpenChange(false);
  }

  if (!open || disabled) return null;

  return (
    <div
      ref={panelRef}
      data-app-modal-ignore-backdrop=""
      className="fixed z-[999] w-[280px] rounded-xl border border-zinc-200 bg-white p-3 shadow-xl"
      style={position ? { top: position.top, left: position.left } : { opacity: 0 }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          className="rounded p-1 text-sm text-zinc-600 hover:bg-zinc-100"
          onClick={goToPrev}
          aria-label="Previous month"
        >
          <i className="fas fa-chevron-left text-xs" />
        </button>
        <span className="text-sm font-semibold capitalize text-zinc-900">{monthLabel}</span>
        <button
          type="button"
          className="rounded p-1 text-sm text-zinc-600 hover:bg-zinc-100"
          onClick={goToNext}
          aria-label="Next month"
        >
          <i className="fas fa-chevron-right text-xs" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0 text-center">
        {dayNames.map((name, i) => (
          <div key={i} className="py-1 text-[11px] font-medium text-zinc-400">
            {name}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0 text-center">
        {days.map((day, i) => {
          const isCurrentMonth = day.month === viewMonth;
          const isSelected = day.iso === value;
          const isToday = day.iso === today;
          return (
            <button
              key={i}
              type="button"
              className={`flex h-8 w-full items-center justify-center rounded text-sm transition
                ${!isCurrentMonth ? "text-zinc-300" : "text-zinc-800"}
                ${isSelected ? "bg-blue-600 font-semibold text-white" : ""}
                ${isToday && !isSelected ? "font-semibold text-blue-600" : ""}
                ${!isSelected ? "hover:bg-zinc-100" : ""}
              `}
              onClick={() => selectDate(day.iso)}
            >
              {day.day}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={handleClear}
        >
          {t("dates.clear", "Notīrīt")}
        </button>
        <button
          type="button"
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={handleToday}
        >
          {t("dates.today", "Šodien")}
        </button>
      </div>
    </div>
  );
}

type CalendarDay = { day: number; month: number; year: number; iso: string };

function buildCalendarDays(
  year: number,
  month: number,
  startSunday: boolean,
): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  let dayOfWeek = firstOfMonth.getDay(); // 0=Sun
  if (!startSunday) {
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }

  const days: CalendarDay[] = [];
  const startDate = new Date(year, month, 1 - dayOfWeek);

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push({
      day: d.getDate(),
      month: d.getMonth(),
      year: d.getFullYear(),
      iso: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
    });
  }

  return days;
}
