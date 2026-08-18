"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AppModal } from "@/app/components/app-modal";
import { ListAppearancePicker } from "@/app/components/list-appearance-picker";
import { ListBadge } from "@/app/components/list-badge";
import { ToggleSwitch } from "@/app/components/toggle-switch";
import { UserAvatar } from "@/app/components/user-avatar";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import {
  DEFAULT_LIST_ACCESS_LEVEL,
  LIST_ACCESS_OPTIONS,
  listHasCustomRoleAccess,
  parseListAccessLevel,
  type ListAccessChoice,
  type ListAccessLevel,
} from "@/app/lib/list-access";
import { DEFAULT_LIST_COLOR, randomListColorId } from "@/app/lib/lists";
import { useTeam } from "@/app/lib/team-store";
import { teamRankLabel } from "@/app/lib/team";
import type { NameFormInput } from "@/app/components/name-form-modal";

export type ListFormInput = NameFormInput & {
  isPrivate: boolean;
  defaultAccessLevel: ListAccessLevel;
  viewerUserIds: string[];
  viewerRoleIds: string[];
  viewerUserAccess: Record<string, ListAccessLevel>;
  viewerRoleAccess: Record<string, ListAccessLevel>;
};

type ListFormInitialValue = ListFormInput | null;

const selectClassName =
  "min-h-9 max-w-[11.5rem] shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white px-2 text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

function ListAccessSelect({
  value,
  includeNone = false,
  onChange,
  ariaLabel,
}: {
  value: ListAccessChoice;
  includeNone?: boolean;
  onChange: (value: ListAccessChoice) => void;
  ariaLabel: string;
}) {
  const { t } = useTranslations();
  return (
    <select
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => {
        const next = event.target.value;
        if (next === "none") {
          onChange("none");
          return;
        }
        onChange(parseListAccessLevel(next));
      }}
      className={selectClassName}
    >
      {includeNone ? (
        <option value="none">{t("lists.access.none", "Nav pieejas")}</option>
      ) : null}
      {LIST_ACCESS_OPTIONS.map((option) => (
        <option key={option.id} value={option.id}>
          {t(option.titleKey, option.title)}
        </option>
      ))}
    </select>
  );
}

export function ListFormModal({
  open,
  onOpenChange,
  title,
  description,
  namePlaceholder,
  descriptionPlaceholder,
  submitLabel,
  initialValue = null,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  namePlaceholder: string;
  descriptionPlaceholder: string;
  submitLabel: string;
  initialValue?: ListFormInitialValue;
  onCreate: (input: ListFormInput) => void;
}) {
  const { t } = useTranslations();
  const { user: authUser } = useAuthSession();
  const { members, roles } = useTeam();
  const badgeRef = useRef<HTMLButtonElement>(null);
  const [name, setName] = useState("");
  const [details, setDetails] = useState("");
  const [icon, setIcon] = useState<string | null>(null);
  const [color, setColor] = useState(DEFAULT_LIST_COLOR);
  const [initialColor, setInitialColor] = useState(DEFAULT_LIST_COLOR);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [defaultAccessLevel, setDefaultAccessLevel] = useState<ListAccessLevel>(
    DEFAULT_LIST_ACCESS_LEVEL,
  );
  const [customizeRoles, setCustomizeRoles] = useState(false);
  const [roleAccess, setRoleAccess] = useState<Record<string, ListAccessChoice>>({});
  const [memberAccess, setMemberAccess] = useState<Record<string, ListAccessChoice>>(
    {},
  );

  const currentUserId = authUser?.id ?? null;
  const uuidRe =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const selectableMembers = members
    .map((member) => ({
      member,
      userId: member.userId || (uuidRe.test(member.id) ? member.id : null),
    }))
    .filter(
      (entry): entry is { member: (typeof members)[number]; userId: string } =>
        Boolean(entry.userId && entry.userId !== currentUserId),
    );

  useEffect(() => {
    if (!open) return;
    const nextColor = initialValue?.color ?? randomListColorId();
    const nextDefault =
      initialValue?.defaultAccessLevel ?? DEFAULT_LIST_ACCESS_LEVEL;
    const nextPrivate = initialValue?.isPrivate ?? false;
    setName(initialValue?.name ?? "");
    setDetails(initialValue?.description ?? "");
    setIcon(initialValue?.icon ?? null);
    setColor(nextColor);
    setInitialColor(nextColor);
    setAppearanceOpen(false);
    setIsPrivate(nextPrivate);
    setDefaultAccessLevel(nextDefault);
    setCustomizeRoles(
      listHasCustomRoleAccess(
        roles,
        initialValue?.viewerRoleAccess ?? {},
        nextDefault,
        nextPrivate,
      ),
    );
    setRoleAccess(
      Object.fromEntries(
        roles.map((role) => [
          role.id,
          initialValue?.viewerRoleAccess[role.id] ??
            (nextPrivate ? "none" : nextDefault),
        ]),
      ),
    );
    setMemberAccess(
      Object.fromEntries(
        (initialValue
          ? Object.keys(initialValue.viewerUserAccess)
          : []
        ).map((userId) => [userId, initialValue?.viewerUserAccess[userId] ?? "none"]),
      ),
    );
  }, [initialValue, open, roles]);

  const trimmedName = name.trim();
  const trimmedDetails = details.trim();
  const defaultOption =
    LIST_ACCESS_OPTIONS.find((option) => option.id === defaultAccessLevel) ??
    LIST_ACCESS_OPTIONS[0];
  const inheritRoleLevel = (privateList: boolean): ListAccessChoice =>
    privateList ? "none" : defaultAccessLevel;
  const initialCustomizeRoles = listHasCustomRoleAccess(
    roles,
    initialValue?.viewerRoleAccess ?? {},
    initialValue?.defaultAccessLevel ?? DEFAULT_LIST_ACCESS_LEVEL,
    initialValue?.isPrivate ?? false,
  );
  const dirty = Boolean(
    trimmedName ||
      trimmedDetails ||
      icon !== null ||
      color !== initialColor ||
      isPrivate !== (initialValue?.isPrivate ?? false) ||
      defaultAccessLevel !==
        (initialValue?.defaultAccessLevel ?? DEFAULT_LIST_ACCESS_LEVEL) ||
      customizeRoles !== initialCustomizeRoles ||
      (customizeRoles &&
        JSON.stringify(roleAccess) !==
          JSON.stringify(
            Object.fromEntries(
              roles.map((role) => [
                role.id,
                initialValue?.viewerRoleAccess[role.id] ??
                  (initialValue?.isPrivate ? "none" : defaultAccessLevel),
              ]),
            ),
          )) ||
      JSON.stringify(memberAccess) !==
        JSON.stringify(initialValue?.viewerUserAccess ?? {}),
  );

  function fillRoleAccess(level: ListAccessChoice) {
    return Object.fromEntries(roles.map((role) => [role.id, level]));
  }

  function changeDefaultAccess(next: ListAccessLevel) {
    setDefaultAccessLevel(next);
    if (!customizeRoles) {
      setRoleAccess(fillRoleAccess(isPrivate ? "none" : next));
    }
  }

  function changeCustomizeRoles(next: boolean) {
    setCustomizeRoles(next);
    if (next) {
      setRoleAccess((current) => {
        const updated = { ...current };
        for (const role of roles) {
          updated[role.id] = current[role.id] ?? inheritRoleLevel(isPrivate);
        }
        return updated;
      });
      return;
    }
    setRoleAccess(fillRoleAccess(inheritRoleLevel(isPrivate)));
  }

  function accessMaps() {
    const viewerRoleAccess: Record<string, ListAccessLevel> = {};
    if (customizeRoles) {
      for (const [roleId, level] of Object.entries(roleAccess)) {
        if (level === "none") continue;
        viewerRoleAccess[roleId] = level;
      }
    }
    const viewerUserAccess: Record<string, ListAccessLevel> = {};
    for (const [userId, level] of Object.entries(memberAccess)) {
      if (level === "none") continue;
      viewerUserAccess[userId] = level;
    }
    return { viewerRoleAccess, viewerUserAccess };
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!trimmedName) return;
    const { viewerRoleAccess, viewerUserAccess } = accessMaps();
    onCreate({
      name: trimmedName,
      description: trimmedDetails,
      icon,
      color,
      isPrivate,
      defaultAccessLevel,
      viewerUserIds: Object.keys(viewerUserAccess),
      viewerRoleIds: Object.keys(viewerRoleAccess),
      viewerUserAccess,
      viewerRoleAccess,
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
      panelMaxWidthClassName="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">
            {t("lists.fields.icon_and_name", "Ikona un nosaukums")}
          </p>
          <div className="mt-2 flex items-start gap-2">
            <button
              ref={badgeRef}
              type="button"
              aria-label={t("lists.fields.appearance", "Izskats")}
              aria-expanded={appearanceOpen}
              onClick={() => setAppearanceOpen((current) => !current)}
              className="shrink-0 rounded-xl ring-offset-2 transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <ListBadge
                name={trimmedName}
                icon={icon}
                color={color}
                isPrivate={isPrivate}
                size="lg"
              />
            </button>
            <input
              id="list-form-title"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              placeholder={namePlaceholder}
              autoFocus
            />
          </div>
          <ListAppearancePicker
            open={appearanceOpen}
            triggerRef={badgeRef}
            name={trimmedName}
            icon={icon}
            color={color}
            onIconChange={setIcon}
            onColorChange={setColor}
            onClose={() => setAppearanceOpen(false)}
          />
        </div>

        <div>
          <label htmlFor="list-form-description" className="text-sm font-medium text-zinc-500">
            {t("lists.fields.description_optional", "Apraksts (neobligāti)")}
          </label>
          <textarea
            id="list-form-description"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            rows={2}
            className="mt-2 w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            placeholder={descriptionPlaceholder}
          />
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-200 p-3">
          {customizeRoles ? (
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {t("team.roles.list", "Lomas")}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t(
                  "lists.access.roles_hint",
                  "Katrai lomai norādi, ko tās biedri drīkst darīt šajā sarakstā.",
                )}
              </p>
              {roles.length > 0 ? (
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {roles.map((role) => {
                    const label = teamRankLabel(role.slug, t, roles) ?? role.name;
                    return (
                      <li
                        key={role.id}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
                      >
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500">
                          <i className="fas fa-user-tag text-[10px]" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                          {label}
                        </span>
                        <ListAccessSelect
                          value={roleAccess[role.id] ?? inheritRoleLevel(isPrivate)}
                          includeNone={isPrivate}
                          ariaLabel={label}
                          onChange={(next) =>
                            setRoleAccess((current) => ({ ...current, [role.id]: next }))
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">
                  {t("team.roles.empty", "Nav nevienas lomas.")}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-sm font-medium text-zinc-900">
                  <i className="fas fa-user-group text-xs text-zinc-400" aria-hidden="true" />
                  {t("lists.access.default", "Noklusējuma pieeja")}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {t(defaultOption.hintKey, defaultOption.hint)}
                </p>
              </div>
              <ListAccessSelect
                value={defaultAccessLevel}
                ariaLabel={t("lists.access.default", "Noklusējuma pieeja")}
                onChange={(next) => {
                  if (next === "none") return;
                  changeDefaultAccess(next);
                }}
              />
            </div>
          )}

          <div className="flex items-start justify-between gap-3 rounded-lg px-1 py-0.5 text-sm text-zinc-700">
            <div className="min-w-0">
              <p className="font-medium text-zinc-900">
                {t("lists.access.customize_roles", "Pielāgot katrai lomai")}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t(
                  "lists.access.customize_roles.hint",
                  "Ieslēdz, lai katrai lomai norādītu citu pieeju. Noklusējuma pieeja tad vairs nav globāla.",
                )}
              </p>
            </div>
            <ToggleSwitch
              checked={customizeRoles}
              label={t("lists.access.customize_roles", "Pielāgot katrai lomai")}
              onChange={changeCustomizeRoles}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-700">
          <div>
            <p className="font-medium text-zinc-900">
              {t("lists.private.label", "Privāts saraksts")}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {t(
                "lists.private.description",
                "Redzams tikai tev un izvēlētajiem biedriem vai lomām.",
              )}
            </p>
          </div>
          <ToggleSwitch
            checked={isPrivate}
            label={t("lists.private.label", "Privāts saraksts")}
            onChange={(next) => {
              setIsPrivate(next);
              setRoleAccess((current) => {
                const updated = { ...current };
                for (const role of roles) {
                  if (next && current[role.id] === defaultAccessLevel) {
                    updated[role.id] = "none";
                  }
                  if (!next && current[role.id] === "none") {
                    updated[role.id] = defaultAccessLevel;
                  }
                }
                return updated;
              });
            }}
          />
        </div>

        {isPrivate ? (
          <div className="space-y-3 rounded-xl border border-zinc-200 p-3">
            <div>
              <p className="text-sm font-medium text-zinc-800">
                {t("lists.private.members", "Biedri")}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {t(
                  "lists.private.creator_included",
                  "Tu (izveidotājs) vienmēr redzi šo sarakstu.",
                )}
              </p>
            </div>
            {selectableMembers.length > 0 ? (
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {selectableMembers.map(({ member, userId }) => {
                  const value = memberAccess[userId] ?? "none";
                  return (
                    <li
                      key={member.id}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5"
                    >
                      <UserAvatar member={member} size="xs" />
                      <span className="min-w-0 flex-1 truncate text-sm text-zinc-800">
                        {member.name}
                      </span>
                      <ListAccessSelect
                        value={value}
                        includeNone
                        ariaLabel={member.name}
                        onChange={(next) =>
                          setMemberAccess((current) => ({ ...current, [userId]: next }))
                        }
                      />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-zinc-500">
                {t(
                  "lists.private.no_members",
                  "Komandā nav citu pieslēgtu biedru.",
                )}
              </p>
            )}
          </div>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-zinc-100 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {t("actions.cancel", "Atcelt")}
          </button>
          <button
            type="submit"
            disabled={!trimmedName || !dirty}
            className="inline-flex min-h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:bg-zinc-200 disabled:text-zinc-400"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </AppModal>
  );
}
