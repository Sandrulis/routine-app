"use client";

import { useMemo, useState } from "react";
import { AppModal } from "@/app/components/app-modal";
import { StatusGlyph } from "@/app/components/status-control";
import { useTranslations } from "@/app/components/translations-provider";
import { FONT_AWESOME_ICON_OPTIONS } from "@/app/lib/fontawesome-icons";

const STATUS_ICON_OPTIONS = FONT_AWESOME_ICON_OPTIONS.filter((icon) =>
  icon.startsWith("fas fa-"),
).slice(0, 240);

function iconSearchText(className: string) {
  return className.replace(/^fa[sbrld]?\s+fa-/i, "").replace(/-/g, " ");
}

export function StatusIconPickerModal({
  open,
  onOpenChange,
  color,
  groupKey,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  color: string;
  groupKey: string;
  value: string | null;
  onSave: (icon: string | null) => void;
}) {
  const { t } = useTranslations();
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<string | null>(value);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return STATUS_ICON_OPTIONS;
    return STATUS_ICON_OPTIONS.filter((icon) =>
      iconSearchText(icon).includes(needle),
    );
  }, [query]);

  const dirty = draft !== value;

  return (
    <AppModal
      open={open}
      onOpenChange={(next) => {
        if (!next) setDraft(value);
        onOpenChange(next);
      }}
      title={t("lists.statuses.icon.title", "Statusa ikona")}
      description={t(
        "lists.statuses.icon.description",
        "Izvēlies ikonu, kas tiks rādīta statusa aplī.",
      )}
      dirty={dirty}
      overlayZIndex={70}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <StatusGlyph color={color} groupKey={groupKey} icon={draft} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("lists.fields.icon_search", "Meklēt...")}
            className="min-h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          />
        </div>
        <div className="max-h-64 overflow-y-auto rounded-xl border border-zinc-200 p-2 [scrollbar-width:thin]">
          <div className="grid grid-cols-8 gap-1">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className={`inline-flex h-9 items-center justify-center rounded-lg text-xs text-zinc-500 transition hover:bg-zinc-100 ${
                draft === null ? "bg-zinc-100 ring-1 ring-zinc-300" : ""
              }`}
            >
              {t("lists.statuses.icon.default", "Nokl.")}
            </button>
            {filtered.map((icon) => (
              <button
                key={icon}
                type="button"
                title={iconSearchText(icon)}
                onClick={() => setDraft(icon)}
                className={`inline-flex h-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 ${
                  draft === icon ? "bg-zinc-100 ring-1 ring-zinc-300" : ""
                }`}
              >
                <i className={`${icon} text-sm`} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={() => {
              onSave(draft);
              onOpenChange(false);
            }}
            className="inline-flex items-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("actions.save", "Saglabāt")}
          </button>
        </div>
      </div>
    </AppModal>
  );
}
