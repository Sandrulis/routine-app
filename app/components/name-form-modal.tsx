"use client";

import { useEffect, useRef, useState, type DragEvent, type FormEvent } from "react";
import { AppModal } from "@/app/components/app-modal";
import { ListAppearancePicker } from "@/app/components/list-appearance-picker";
import { ListBadge } from "@/app/components/list-badge";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { DEFAULT_LIST_COLOR, randomListColorId } from "@/app/lib/lists";
import { readTeamLogoUrl } from "@/app/lib/team";

export type NameFormInput = {
  name: string;
  description: string;
  icon?: string | null;
  color?: string;
  logoUrl?: string | null;
};

export function NameFormModal({
  open,
  onOpenChange,
  title,
  description,
  nameLabel,
  namePlaceholder,
  descriptionLabel,
  descriptionPlaceholder,
  submitLabel,
  showAppearance = false,
  showDescription = true,
  showLogo = false,
  showIcons = true,
  initialValue,
  onCreate,
  blocking = false,
  rankLabel = null,
  nameSuffix = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  descriptionLabel: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  showAppearance?: boolean;
  showDescription?: boolean;
  showLogo?: boolean;
  showIcons?: boolean;
  initialValue?: NameFormInput | null;
  onCreate: (input: NameFormInput) => void;
  blocking?: boolean;
  rankLabel?: string | null;
  /** Locked suffix shown after the name input (e.g. `.pdf`). */
  nameSuffix?: string | null;
}) {
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const badgeRef = useRef<HTMLButtonElement>(null);
  const snapshotRef = useRef<NameFormInput | null>(null);
  const logoDragCountRef = useRef(0);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState(DEFAULT_LIST_COLOR);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [initialColor, setInitialColor] = useState(DEFAULT_LIST_COLOR);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [logoDragging, setLogoDragging] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      const nextColor = initialValue.color ?? DEFAULT_LIST_COLOR;
      snapshotRef.current = {
        name: initialValue.name,
        description: initialValue.description,
        icon: initialValue.icon ?? null,
        color: nextColor,
        logoUrl: initialValue.logoUrl ?? null,
      };
      setName(initialValue.name);
      setDetails(initialValue.description);
      setIcon(initialValue.icon ?? null);
      setColor(nextColor);
      setInitialColor(nextColor);
      setLogoUrl(initialValue.logoUrl ?? null);
    } else {
      const nextColor = randomListColorId();
      snapshotRef.current = null;
      setName("");
      setDetails("");
      setIcon(null);
      setColor(nextColor);
      setInitialColor(nextColor);
      setLogoUrl(null);
    }
    setAppearanceOpen(false);
    setLogoDragging(false);
    logoDragCountRef.current = 0;
  }, [initialValue, open]);

  const snapshot = snapshotRef.current;
  const trimmedName = name.trim();
  const trimmedDetails = details.trim();
  const dirty = snapshot
    ? trimmedName !== snapshot.name.trim() ||
      trimmedDetails !== snapshot.description.trim() ||
      icon !== (snapshot.icon ?? null) ||
      (showAppearance && color !== (snapshot.color ?? DEFAULT_LIST_COLOR)) ||
      (showLogo && logoUrl !== (snapshot.logoUrl ?? null))
    : Boolean(
        trimmedName ||
          trimmedDetails ||
          (showAppearance && (icon !== null || color !== initialColor)) ||
          (showLogo && logoUrl),
      );

  async function applyLogoFile(file: File | undefined) {
    if (!file) return;
    const next = await readTeamLogoUrl(file);
    if (!next) {
      showFeedback({
        type: "error",
        text: t("teams.logo.invalid", "Augšupielādē attēlu līdz 1.5 MB."),
      });
      return;
    }
    setLogoUrl(next);
  }

  function handleLogoDragEnter(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    logoDragCountRef.current += 1;
    setLogoDragging(true);
  }

  function handleLogoDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
  }

  function handleLogoDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    logoDragCountRef.current = Math.max(0, logoDragCountRef.current - 1);
    if (logoDragCountRef.current === 0) setLogoDragging(false);
  }

  function handleLogoDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    logoDragCountRef.current = 0;
    setLogoDragging(false);
    void applyLogoFile(event.dataTransfer.files[0]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    const rawSuffix = nameSuffix?.trim() ?? "";
    let fullName = trimmedName;
    if (rawSuffix) {
      const suffix = rawSuffix.startsWith(".") ? rawSuffix : `.${rawSuffix}`;
      const suffixExt = suffix.slice(1).toLowerCase();
      let base = trimmedName;
      while (base.toLowerCase().endsWith(`.${suffixExt}`)) {
        base = base.slice(0, -(suffixExt.length + 1));
      }
      if (!base.trim()) base = trimmedName;
      fullName = `${base.trim()}${suffix}`;
    }
    onCreate({
      name: fullName,
      description: trimmedDetails,
      ...(showAppearance
        ? showIcons
          ? { icon, color }
          : { color }
        : {}),
      ...(showLogo ? { logoUrl } : {}),
    });
    onOpenChange(false);
  }

  return (
    <AppModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      dirty={dirty}
      blocking={blocking}
      panelMaxWidthClassName={showAppearance ? "max-w-xl" : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {showAppearance ? (
          <div>
            <p className="text-sm font-medium text-zinc-500">
              {showIcons
                ? t("lists.fields.icon_and_name", "Ikona un nosaukums")
                : t("lists.fields.name", "Nosaukums")}
            </p>
            <div className="mt-2 flex items-start gap-2">
              <button
                ref={badgeRef}
                type="button"
                aria-label={
                  showIcons
                    ? t("lists.fields.appearance", "Izskats")
                    : t("lists.fields.color", "Krāsa")
                }
                aria-expanded={appearanceOpen}
                onClick={() => setAppearanceOpen((current) => !current)}
                onDragEnter={showLogo ? handleLogoDragEnter : undefined}
                onDragOver={showLogo ? handleLogoDragOver : undefined}
                onDragLeave={showLogo ? handleLogoDragLeave : undefined}
                onDrop={showLogo ? handleLogoDrop : undefined}
                className={`shrink-0 rounded-xl ring-offset-2 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  showLogo && logoDragging ? "ring-2 ring-blue-400" : ""
                }`}
              >
                <ListBadge
                  name={trimmedName}
                  icon={icon}
                  color={color}
                  logoUrl={showLogo ? logoUrl : null}
                  size="lg"
                />
              </button>
              <div className="min-w-0 flex-1">
                <input
                  id="name-form-title"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder={namePlaceholder}
                  autoFocus
                />
                {rankLabel ? (
                  <p className="mt-1 truncate text-[12px] text-zinc-400">
                    {rankLabel}
                  </p>
                ) : null}
              </div>
            </div>
            <ListAppearancePicker
              open={appearanceOpen}
              triggerRef={badgeRef}
              name={trimmedName}
              icon={icon}
              color={color}
              showIcons={showIcons}
              onIconChange={setIcon}
              onColorChange={setColor}
              onClose={() => setAppearanceOpen(false)}
            />
          </div>
        ) : (
          <div>
            <label htmlFor="name-form-title" className="text-sm font-semibold text-zinc-700">
              {nameLabel}
            </label>
            {nameSuffix ? (
              <div className="mt-2 flex min-h-11 items-stretch overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-100">
                <input
                  id="name-form-title"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent px-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
                  placeholder={namePlaceholder}
                  autoFocus
                />
                <span
                  className="inline-flex shrink-0 items-center border-l border-zinc-200 bg-zinc-100 px-3 text-sm text-zinc-500"
                  aria-hidden="true"
                >
                  {nameSuffix.startsWith(".") ? nameSuffix : `.${nameSuffix}`}
                </span>
              </div>
            ) : (
              <input
                id="name-form-title"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 min-h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                placeholder={namePlaceholder}
                autoFocus
              />
            )}
          </div>
        )}

        {showLogo ? (
          <div>
            <label
              className={`flex min-h-16 cursor-pointer items-center justify-center rounded-xl border border-dashed px-4 py-4 text-center text-sm transition ${
                logoDragging
                  ? "border-blue-400 bg-blue-50 text-blue-700"
                  : "border-zinc-300 bg-white text-zinc-500 hover:border-zinc-400"
              }`}
              onDragEnter={handleLogoDragEnter}
              onDragOver={handleLogoDragOver}
              onDragLeave={handleLogoDragLeave}
              onDrop={handleLogoDrop}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  void applyLogoFile(event.target.files?.[0]);
                  event.target.value = "";
                }}
              />
              <span>
                {t("teams.logo.drop", "Ievelc logotipu šeit vai")}{" "}
                <span className="font-medium text-zinc-700 underline decoration-dotted underline-offset-4">
                  {t("subtasks.attachments.browse", "pārlūko")}
                </span>
              </span>
            </label>
            {logoUrl ? (
              <button
                type="button"
                onClick={() => setLogoUrl(null)}
                className="mt-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-800"
              >
                {t("teams.logo.remove", "Noņemt logotipu")}
              </button>
            ) : null}
          </div>
        ) : null}

        {showDescription ? (
          <div>
            <label
              htmlFor="name-form-description"
              className="text-sm font-medium text-zinc-500"
            >
              {showAppearance
                ? t("lists.fields.description_optional", "Apraksts (neobligāti)")
                : descriptionLabel}
            </label>
            <textarea
              id="name-form-description"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={showAppearance ? 2 : 4}
              className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder={descriptionPlaceholder}
            />
          </div>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          {blocking ? null : (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
            >
              {t("actions.cancel", "Atcelt")}
            </button>
          )}
          <button
            type="submit"
            disabled={!trimmedName || Boolean(snapshot && !dirty)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
