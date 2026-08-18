"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import { DragHandle } from "@/app/components/drag-handle";
import { NameFormModal } from "@/app/components/name-form-modal";
import { ParentCreateFlow, type ParentCreateContext } from "@/app/components/parent-create-flow";
import { ConfirmModal } from "@/app/components/confirm-modal";
import {
  CreateItemMenu,
  createMenuAnchorFromEvent,
  type CreateMenuAnchor,
} from "@/app/components/create-item-menu";
import {
  SortableTaskGroup,
  SortableTaskItem,
  type SortableTaskHandle,
} from "@/app/components/sortable-task-group";
import { SubtaskDetailModal } from "@/app/components/subtask-detail-modal";
import { TeamInviteModal } from "@/app/components/team-invite-modal";
import { OverflowTooltip, Tooltip } from "@/app/components/tooltip";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { useTranslations } from "@/app/components/translations-provider";
import { MemberLastOnline } from "@/app/components/member-last-online";
import { UserAvatar } from "@/app/components/user-avatar";
import { TeamSwitcher } from "@/app/components/team-switcher";
import { UserMenu } from "@/app/components/user-menu";
import {
  collectTaskSubtreeIds,
  getTaskAncestors,
  isWorkFolder,
  isWorkSubtask,
  listColorById,
  listInitials,
  workItemIcon,
  type WorkList,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import { StatusTreeDot } from "@/app/components/status-control";
import { useLists } from "@/app/lib/lists-store";
import {
  childListFiles,
  deleteStoredListFile,
  fileIconClassName,
  filePageHref,
  renameStoredListFile,
  reorderStoredListFiles,
  type ListFile,
} from "@/app/lib/list-files";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";

const NAV_TREE_STORAGE_KEY = "routine-app-nav-trees";

function readNavTrees(): Record<string, boolean> {
  try {
    const stored = window.localStorage.getItem(NAV_TREE_STORAGE_KEY);
    if (!stored) return {};
    const parsed = JSON.parse(stored) as Record<string, boolean>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function TreeName({
  href,
  label,
  description,
  onToggle,
}: {
  href?: string;
  label: string;
  description?: string;
  onToggle?: () => void;
}) {
  const name = href ? (
    <Link href={href} className="block w-full truncate">
      {label}
    </Link>
  ) : onToggle ? (
    <button type="button" onClick={onToggle} className="block w-full truncate text-left">
      {label}
    </button>
  ) : (
    <span className="block w-full truncate">{label}</span>
  );

  return (
    <OverflowTooltip
      label={label}
      extraLabel={description}
      className="min-w-0 flex-1"
    >
      <span
        className={`block min-w-0 w-full ${href || onToggle ? "" : "pointer-events-none"}`}
      >
        {name}
      </span>
    </OverflowTooltip>
  );
}

function rowHoverActionClassName(forceVisible: boolean) {
  return `inline-flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-200/80 hover:text-zinc-700 ${
    forceVisible
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100"
  }`;
}

function rowClassName(active: boolean) {
  return `flex h-8 w-full min-w-0 items-center gap-1.5 rounded-md px-1.5 text-[13px] transition ${
    active
      ? "bg-zinc-100 font-medium text-zinc-900"
      : "text-zinc-700 hover:bg-zinc-100"
  }`;
}

function ToggleChevron({
  expanded,
  className = "",
}: {
  expanded: boolean;
  className?: string;
}) {
  return (
    <i
      className={`fas fa-chevron-down text-[9px] transition-transform ${
        expanded ? "" : "-rotate-90"
      } ${className}`}
      aria-hidden="true"
    />
  );
}

function NavTreeSection({
  href,
  icon,
  iconToneClassName,
  iconClassName,
  listAppearance,
  label,
  description,
  addLabel,
  addAriaLabel,
  expanded,
  isParentActive,
  onToggle,
  onAdd,
  onMore,
  moreOpen = false,
  swapOnHover = false,
  leaf = false,
  status,
  dragHandle,
  children,
}: {
  href?: string;
  icon?: string;
  iconToneClassName?: string;
  iconClassName?: string;
  listAppearance?: { icon: string | null; color: string };
  swapOnHover?: boolean;
  leaf?: boolean;
  status?: WorkTaskStatus;
  label: string;
  description?: string;
  addLabel?: string;
  addAriaLabel?: string;
  expanded: boolean;
  isParentActive: boolean;
  onToggle: () => void;
  onAdd?: (event: MouseEvent<HTMLButtonElement>) => void;
  onMore?: (event: MouseEvent<HTMLButtonElement>) => void;
  moreOpen?: boolean;
  dragHandle?: SortableTaskHandle | null;
  children?: ReactNode;
}) {
  const { t } = useTranslations();
  const toggleLabel = expanded
    ? t("nav.collapse", "Sakļaut")
    : t("nav.expand", "Izvērst");
  const listTone = listAppearance
    ? listColorById(listAppearance.color)
    : null;

  const rowLink = Boolean(href && leaf);

  return (
    <div className={dragHandle?.isDragging ? "opacity-70" : undefined}>
      <div className="group/row">
        <div className={`${rowClassName(isParentActive)} relative`}>
          {rowLink && href ? (
            <Link
              href={href}
              className="absolute inset-0 z-0 rounded-md"
              aria-label={label}
            />
          ) : null}
          {listAppearance && listTone ? (
            <Tooltip label={toggleLabel}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={toggleLabel}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggle();
                }}
                className="relative z-10 inline-flex size-5 shrink-0 items-center justify-center rounded-[2.5px] text-[9px] font-semibold"
                style={{ backgroundColor: listTone.bg, color: listTone.fg }}
              >
                <span className="pointer-events-none transition group-hover/row:opacity-0 group-focus-within/row:opacity-0">
                  {listAppearance.icon ? (
                    <i className={`${listAppearance.icon} text-[10px]`} />
                  ) : (
                    listInitials(label)
                  )}
                </span>
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover/row:opacity-100 group-focus-within/row:opacity-100">
                  <ToggleChevron expanded={expanded} />
                </span>
              </button>
            </Tooltip>
          ) : swapOnHover && icon ? (
            <Tooltip label={toggleLabel}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={toggleLabel}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggle();
                }}
                className="relative z-10 inline-flex size-5 shrink-0 items-center justify-center text-zinc-400"
              >
                <i
                  className={`${icon} pointer-events-none text-[12px] transition group-hover/row:opacity-0 group-focus-within/row:opacity-0`}
                  aria-hidden="true"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover/row:opacity-100 group-focus-within/row:opacity-100">
                  <ToggleChevron expanded={expanded} />
                </span>
              </button>
            </Tooltip>
          ) : status ? (
            <StatusTreeDot status={status} />
          ) : iconToneClassName && icon ? (
            <span
              className={`pointer-events-none inline-flex size-5 shrink-0 items-center justify-center rounded-[2.5px] text-[10px] ${iconToneClassName}`}
              aria-hidden="true"
            >
              <i className={icon} />
            </span>
          ) : icon ? (
            <i
              className={`${icon} pointer-events-none w-4 text-center text-[12px] ${iconClassName ?? "text-zinc-400"}`}
              aria-hidden="true"
            />
          ) : null}

          <TreeName
            href={rowLink ? undefined : href}
            label={label}
            description={description}
            onToggle={rowLink ? undefined : onToggle}
          />

          {dragHandle ? (
            <span
              className={`relative z-10 transition ${
                dragHandle.isDragging
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100"
              }`}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DragHandle
                label={t("subtasks.drag", "Mainīt secību")}
                attributes={dragHandle.attributes}
                listeners={dragHandle.listeners}
              />
            </span>
          ) : null}

          {leaf ? null : listAppearance || swapOnHover ? null : (
            <Tooltip label={toggleLabel}>
              <button
                type="button"
                aria-expanded={expanded}
                aria-label={toggleLabel}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggle();
                }}
                className="relative z-10 pointer-events-none inline-flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 opacity-0 transition group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100 hover:bg-zinc-200/80 hover:text-zinc-700"
              >
                <ToggleChevron expanded={expanded} />
              </button>
            </Tooltip>
          )}

          {onMore ? (
            <Tooltip label={t("nav.more", "Vairāk")} align="end">
              <button
                type="button"
                aria-label={t("nav.more", "Vairāk")}
                aria-expanded={moreOpen}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onMore(event);
                }}
                className={`relative z-10 ${rowHoverActionClassName(moreOpen)}`}
              >
                <i className="fas fa-ellipsis text-[12px]" aria-hidden="true" />
              </button>
            </Tooltip>
          ) : null}

          {onAdd && addLabel && addAriaLabel ? (
            <Tooltip label={addLabel} align="end">
              <button
                type="button"
                aria-label={addAriaLabel}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onAdd(event);
                }}
                className={`relative z-10 ${rowHoverActionClassName(moreOpen)}`}
              >
                <i className="fas fa-plus text-[11px]" aria-hidden="true" />
              </button>
            </Tooltip>
          ) : null}
        </div>
      </div>

      {expanded && children ? <div className="mt-0.5 pl-5">{children}</div> : null}
    </div>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslations();
  const { showFeedback } = useFeedbackToast();
  const { lists, tasks, listTasks, childTasks, subtasks, addList, updateList, deleteList, updateTask, deleteTask, reorderTasks } = useLists();
  const files = useListFiles().filter((file) =>
    lists.some((list) => list.id === file.listId),
  );
  const { members, currentUser, currentTeam, inviteMember } = useTeam();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createListOpen, setCreateListOpen] = useState(false);
  const [parentCreate, setParentCreate] = useState<ParentCreateContext | null>(
    null,
  );
  const [subtaskCreate, setSubtaskCreate] = useState<{
    listId: string;
    parentId: string;
  } | null>(null);
  const [trees, setTrees] = useState<Record<string, boolean>>({});
  const [itemMenu, setItemMenu] = useState<{
    kind: "list" | "task" | "file";
    id: string;
    anchor: CreateMenuAnchor;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<
    | { kind: "list"; list: WorkList }
    | { kind: "task"; task: WorkTask }
    | { kind: "file"; file: ListFile }
    | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { kind: "list"; list: WorkList }
    | { kind: "task"; task: WorkTask }
    | { kind: "file"; file: ListFile }
    | null
  >(null);

  useEffect(() => {
    setTrees(readNavTrees());
  }, []);

  const autoOpenIds = useMemo(() => {
    const ids = new Set<string>(["lists"]);
    const parts = pathname.split("/");
    if (parts[1] === "lists" && parts[2]) {
      ids.add(parts[2]);
    }
    if (parts[1] === "lists" && parts[3] === "tasks" && parts[4]) {
      const opened = tasks.find((item) => item.id === parts[4]);
      if (opened) {
        if (!isWorkSubtask(opened)) ids.add(opened.id);
        for (const ancestor of getTaskAncestors(tasks, opened)) {
          ids.add(ancestor.id);
        }
      }
    }
    if (parts[1] === "lists" && parts[3] === "files" && parts[4]) {
      const opened = files.find((item) => item.id === parts[4]);
      if (opened) {
        ids.add(opened.listId);
        if (opened.parentId) {
          ids.add(opened.parentId);
          const parent = tasks.find((item) => item.id === opened.parentId);
          if (parent) {
            for (const ancestor of getTaskAncestors(tasks, parent)) {
              ids.add(ancestor.id);
            }
          }
        }
      }
    }
    return ids;
  }, [files, pathname, tasks]);

  function isExpanded(id: string, fallback: boolean) {
    if (trees[id] !== undefined) return trees[id];
    if (autoOpenIds.has(id)) return true;
    return fallback;
  }

  function toggleTree(id: string, fallback: boolean) {
    setTrees((current) => {
      const currentlyOpen =
        current[id] ?? (autoOpenIds.has(id) || fallback);
      const next = {
        ...current,
        [id]: !currentlyOpen,
      };
      window.localStorage.setItem(NAV_TREE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function expandTree(id: string) {
    setTrees((current) => {
      const next = { ...current, [id]: true };
      window.localStorage.setItem(NAV_TREE_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const isHome = pathname === "/dashboard";
  const isSettings = pathname === "/settings" || pathname.startsWith("/settings/");
  const isTeam = pathname === "/team";
  const activeTaskIds = useMemo(() => {
    const ids = new Set<string>();
    const parts = pathname.split("/");
    if (parts[1] !== "lists" || parts[3] !== "tasks" || !parts[4]) return ids;
    const opened = tasks.find((item) => item.id === parts[4]);
    if (!opened) return ids;
    ids.add(opened.id);
    for (const ancestor of getTaskAncestors(tasks, opened)) {
      ids.add(ancestor.id);
    }
    return ids;
  }, [pathname, tasks]);
  const activeFileId =
    pathname.split("/")[3] === "files" ? pathname.split("/")[4] ?? null : null;

  function reorderTreeItems(orderedIds: string[]) {
    reorderTasks(orderedIds);
    reorderStoredListFiles(orderedIds);
  }

  function renderFileRow(listId: string, file: ListFile, canReorder: boolean) {
    const href = filePageHref(listId, file.id);
    return (
      <SortableTaskItem key={file.id} id={file.id} disabled={!canReorder}>
        {(handle) => (
          <NavTreeSection
            href={href}
            icon={fileIconClassName(file.name)}
            iconClassName=""
            leaf
            label={file.name}
            expanded={false}
            isParentActive={activeFileId === file.id}
            onToggle={() => undefined}
            dragHandle={canReorder ? handle : null}
            moreOpen={itemMenu?.kind === "file" && itemMenu.id === file.id}
            onMore={(event) =>
              setItemMenu({
                kind: "file",
                id: file.id,
                anchor: createMenuAnchorFromEvent(event),
              })
            }
          />
        )}
      </SortableTaskItem>
    );
  }

  function renderTaskTree(listId: string, parentId: string | null): ReactNode {
    const parent = parentId
      ? (tasks.find((item) => item.id === parentId) ?? null)
      : null;
    const showFiles = !parentId || Boolean(parent && isWorkFolder(parent));
    const items = parentId
      ? parent && isWorkFolder(parent)
        ? childTasks(parentId)
        : subtasks(parentId)
      : listTasks(listId);
    const nestedFiles = showFiles ? childListFiles(files, listId, parentId) : [];
    const mixed = showFiles
      ? [
          ...items.map((task) => ({
            kind: "task" as const,
            id: task.id,
            sortOrder: task.sortOrder,
            task,
          })),
          ...nestedFiles.map((file) => ({
            kind: "file" as const,
            id: file.id,
            sortOrder: file.sortOrder,
            file,
          })),
        ].sort((left, right) =>
          left.sortOrder !== right.sortOrder
            ? left.sortOrder - right.sortOrder
            : left.id.localeCompare(right.id),
        )
      : items.map((task) => ({
          kind: "task" as const,
          id: task.id,
          sortOrder: task.sortOrder,
          task,
        }));

    if (mixed.length === 0) {
      return parentId ? null : (
        <p className="px-2 py-1.5 text-[12px] text-zinc-400">
          {t("tasks.empty", "Šajā sarakstā vēl nav uzdevumu.")}
        </p>
      );
    }

    const canReorder = mixed.length > 1;
    const mixedIds = mixed.map((item) => item.id);

    return (
      <SortableTaskGroup
        itemIds={mixedIds}
        contextId={`nav-${listId}-${parentId ?? "root"}`}
        onReorder={showFiles ? reorderTreeItems : undefined}
      >
        {mixed.map((entry) => {
          if (entry.kind === "file") {
            return renderFileRow(listId, entry.file, canReorder);
          }

          const task = entry.task;
          const href = `/lists/${listId}/tasks/${task.id}`;
          const folder = isWorkFolder(task);
          return (
            <SortableTaskItem key={task.id} id={task.id} disabled={!canReorder}>
              {(handle) => (
                <NavTreeSection
                  href={href}
                  icon={isWorkSubtask(task) ? undefined : workItemIcon(task)}
                  status={isWorkSubtask(task) ? task.status : undefined}
                  swapOnHover={!isWorkSubtask(task)}
                  leaf={isWorkSubtask(task)}
                  label={task.title}
                  description={task.description}
                  addLabel={
                    isWorkSubtask(task)
                      ? undefined
                      : folder
                        ? t("create.menu.title", "Izveidot")
                        : t("subtasks.add.title", "Jauns apakšuzdevums")
                  }
                  addAriaLabel={
                    isWorkSubtask(task)
                      ? undefined
                      : folder
                        ? t("create.menu.title", "Izveidot")
                        : t("subtasks.add.title", "Jauns apakšuzdevums")
                  }
                  expanded={isExpanded(task.id, false)}
                  isParentActive={activeTaskIds.has(task.id)}
                  onToggle={() => toggleTree(task.id, false)}
                  dragHandle={canReorder ? handle : null}
                  moreOpen={itemMenu?.kind === "task" && itemMenu.id === task.id}
                  onMore={(event) =>
                    setItemMenu({
                      kind: "task",
                      id: task.id,
                      anchor: createMenuAnchorFromEvent(event),
                    })
                  }
                  onAdd={
                    isWorkSubtask(task)
                      ? undefined
                      : (event) => {
                          if (folder) {
                            setParentCreate({
                              listId,
                              parentId: task.id,
                              variant: "folder",
                              anchor: createMenuAnchorFromEvent(event),
                            });
                            return;
                          }
                          setSubtaskCreate({ listId, parentId: task.id });
                        }
                  }
                >
                  {isWorkSubtask(task) ? null : renderTaskTree(listId, task.id)}
                </NavTreeSection>
              )}
            </SortableTaskItem>
          );
        })}
      </SortableTaskGroup>
    );
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[var(--app-sidebar-width-expanded)] flex-col border-r border-zinc-200 bg-white">
        <TeamSwitcher />

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3 [scrollbar-width:thin] [scrollbar-color:rgb(212_212_216)_transparent]">
          <Link href="/dashboard" className={rowClassName(isHome)}>
            <span className="inline-flex size-5 shrink-0 items-center justify-center text-zinc-500">
              <i className="fas fa-house text-[12px]" aria-hidden="true" />
            </span>
            <span>{t("nav.home", "Sākums")}</span>
          </Link>

          <NavTreeSection
            href="/lists"
            icon="fas fa-list-ul"
            iconToneClassName="bg-zinc-100 text-zinc-600"
            label={t("nav.lists", "Saraksts")}
            addLabel={t("lists.add.title", "Jauns saraksts")}
            addAriaLabel={t("lists.add.title", "Jauns saraksts")}
            expanded={isExpanded("lists", true)}
            isParentActive={pathname === "/lists"}
            onToggle={() => toggleTree("lists", true)}
            onAdd={currentTeam ? () => setCreateListOpen(true) : undefined}
          >
            {lists.length > 0 ? (
              lists.map((list) => (
                <NavTreeSection
                  key={list.id}
                  href={`/lists/${list.id}`}
                  icon={list.kind === "folder" ? "far fa-folder" : undefined}
                  swapOnHover={list.kind === "folder"}
                  listAppearance={
                    list.kind === "folder"
                      ? undefined
                      : { icon: list.icon, color: list.color }
                  }
                  label={list.name}
                  description={list.description}
                  addLabel={t("create.menu.title", "Izveidot")}
                  addAriaLabel={t("create.menu.title", "Izveidot")}
                  expanded={isExpanded(list.id, true)}
                  isParentActive={pathname === `/lists/${list.id}`}
                  onToggle={() => toggleTree(list.id, true)}
                  moreOpen={itemMenu?.kind === "list" && itemMenu.id === list.id}
                  onMore={(event) =>
                    setItemMenu({
                      kind: "list",
                      id: list.id,
                      anchor: createMenuAnchorFromEvent(event),
                    })
                  }
                  onAdd={(event) =>
                    setParentCreate({
                      listId: list.id,
                      parentId: null,
                      variant: list.kind === "folder" ? "folder" : "list",
                      anchor: createMenuAnchorFromEvent(event),
                    })
                  }
                >
                  {renderTaskTree(list.id, null)}
                </NavTreeSection>
              ))
            ) : (
              <p className="px-2 py-1.5 text-[12px] text-zinc-400">
                {currentTeam
                  ? t("lists.empty", "Vēl nav sarakstu.")
                  : t("teams.required.empty_members", "Vispirms izveido komandu.")}
              </p>
            )}
          </NavTreeSection>

          <NavTreeSection
            href="/team"
            icon="fas fa-users"
            iconToneClassName="bg-violet-100 text-violet-700"
            label={t("nav.team", "Komanda")}
            addLabel={t("team.invite.button", "Uzaicināt")}
            addAriaLabel={t("team.invite.title", "Uzaicināt biedru")}
            expanded={isExpanded("team", true)}
            isParentActive={isTeam}
            onToggle={() => toggleTree("team", true)}
            onAdd={currentTeam ? () => setInviteOpen(true) : undefined}
          >
            {currentTeam && members.length > 0 ? (
              members.map((member) => {
                const href = `/team/${member.id}`;
                return (
                  <Link
                    key={member.id}
                    href={href}
                    className={rowClassName(pathname === href)}
                  >
                    <UserAvatar member={member} size="xs" />
                    <OverflowTooltip label={member.name} className="min-w-0 flex-1">
                      <span className="block min-w-0 truncate">{member.name}</span>
                    </OverflowTooltip>
                    <MemberLastOnline lastOnlineAt={member.lastOnlineAt} />
                  </Link>
                );
              })
            ) : (
              <p className="px-2 py-1.5 text-[12px] text-zinc-400">
                {currentTeam
                  ? t("team.empty", "Komandā vēl nav biedru.")
                  : t("teams.required.empty_members", "Vispirms izveido komandu.")}
              </p>
            )}
          </NavTreeSection>
        </nav>

        <div className="shrink-0 space-y-0.5 border-t border-zinc-100 px-2 py-2">
          <Link href="/settings" className={rowClassName(isSettings)}>
            <span className="inline-flex size-5 shrink-0 items-center justify-center text-zinc-500">
              <i className="fas fa-gear text-[12px]" aria-hidden="true" />
            </span>
            <span>{t("nav.settings", "Uzstādījumi")}</span>
          </Link>
          <UserMenu user={currentUser} />
        </div>
      </aside>

      <ParentCreateFlow
        context={parentCreate}
        onClose={() => setParentCreate(null)}
        onCreated={(taskId) => {
          if (parentCreate?.parentId) expandTree(parentCreate.parentId);
          expandTree(parentCreate?.listId ?? taskId);
        }}
        onFileCreated={(file) => {
          if (file.parentId) expandTree(file.parentId);
          expandTree(file.listId);
        }}
      />

      <SubtaskDetailModal
        taskId={null}
        createFor={subtaskCreate}
        open={subtaskCreate !== null}
        onOpenChange={(open) => {
          if (!open) setSubtaskCreate(null);
        }}
        onCreated={(task) => {
          expandTree(task.parentId ?? task.listId);
        }}
      />

      <NameFormModal
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        title={t("lists.add.title", "Jauns saraksts")}
        description={t(
          "lists.add.description",
          "Saraksts grupē projektus vai klientus, katram ar saviem uzdevumiem un iestatījumiem.",
        )}
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={t(
          "lists.fields.name_placeholder",
          "Piemēram, Projekti, Klienti",
        )}
        descriptionLabel={t(
          "lists.fields.description_optional",
          "Apraksts (neobligāti)",
        )}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss apraksts",
        )}
        submitLabel={t("actions.add", "Pievienot")}
        showAppearance
        onCreate={(input) => {
          const list = addList({ ...input, kind: "list" });
          showFeedback({
            type: "success",
            text: t("lists.created", "Saraksts pievienots."),
          });
          router.push(`/lists/${list.id}`);
        }}
      />

      <CreateItemMenu
        open={itemMenu !== null}
        anchor={itemMenu?.anchor ?? null}
        title={t("common.actions", "Darbības")}
        items={
          itemMenu?.kind === "file"
            ? [
                {
                  id: "view",
                  icon: "fas fa-eye",
                  title: t("actions.view", "Apskatīt"),
                },
                {
                  id: "edit",
                  icon: "fas fa-pen",
                  title: t("actions.rename", "Pārsaukt"),
                },
                {
                  id: "delete",
                  icon: "fas fa-trash",
                  title: t("actions.delete", "Dzēst"),
                  danger: true,
                  dividerBefore: true,
                },
              ]
            : [
                {
                  id: "edit",
                  icon: "fas fa-pen",
                  title: t("actions.edit", "Labot"),
                },
                {
                  id: "delete",
                  icon: "fas fa-trash",
                  title: t("actions.delete", "Dzēst"),
                  danger: true,
                  dividerBefore: true,
                },
              ]
        }
        onClose={() => setItemMenu(null)}
        onSelect={(id) => {
          if (!itemMenu) return;
          const list =
            itemMenu.kind === "list"
              ? (lists.find((item) => item.id === itemMenu.id) ?? null)
              : null;
          const task =
            itemMenu.kind === "task"
              ? (tasks.find((item) => item.id === itemMenu.id) ?? null)
              : null;
          const file =
            itemMenu.kind === "file"
              ? (files.find((item) => item.id === itemMenu.id) ?? null)
              : null;
          setItemMenu(null);
          if (id === "view") {
            if (file) router.push(filePageHref(file.listId, file.id));
            return;
          }
          if (id === "edit") {
            if (list) setEditTarget({ kind: "list", list });
            if (task) {
              if (isWorkSubtask(task)) {
                router.push(`/lists/${task.listId}/tasks/${task.id}`);
                return;
              }
              setEditTarget({ kind: "task", task });
            }
            if (file) setEditTarget({ kind: "file", file });
            return;
          }
          if (id === "delete") {
            if (list) setDeleteTarget({ kind: "list", list });
            if (task) setDeleteTarget({ kind: "task", task });
            if (file) setDeleteTarget({ kind: "file", file });
          }
        }}
      />

      <NameFormModal
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        title={
          editTarget?.kind === "list"
            ? t("lists.edit.title", "Labot sarakstu")
            : editTarget?.kind === "file"
              ? t("files.edit.title", "Pārsaukt failu")
              : editTarget?.kind === "task" && isWorkFolder(editTarget.task)
                ? t("folders.edit.title", "Labot mapi")
                : t("tasks.edit.list_title", "Labot uzdevumu sarakstu")
        }
        description={
          editTarget?.kind === "list"
            ? t("lists.edit.description", "Maini saraksta nosaukumu, ikonu vai aprakstu.")
            : editTarget?.kind === "file"
              ? t("files.edit.description", "Maini faila nosaukumu.")
              : editTarget?.kind === "task" && isWorkFolder(editTarget.task)
                ? t("folders.edit.description", "Maini mapes nosaukumu vai aprakstu.")
                : t(
                    "tasks.edit.list_description",
                    "Maini uzdevumu saraksta nosaukumu vai aprakstu.",
                  )
        }
        nameLabel={t("lists.fields.name", "Nosaukums")}
        namePlaceholder={
          editTarget?.kind === "file"
            ? t("files.fields.name_placeholder", "Faila nosaukums")
            : t("lists.fields.name_placeholder", "Piemēram, Projekti, Klienti")
        }
        descriptionLabel={t("lists.fields.description_optional", "Apraksts (neobligāti)")}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss apraksts",
        )}
        submitLabel={t("actions.save", "Saglabāt")}
        showAppearance={editTarget?.kind === "list"}
        showDescription={editTarget?.kind !== "file"}
        initialValue={
          editTarget?.kind === "list"
            ? {
                name: editTarget.list.name,
                description: editTarget.list.description,
                icon: editTarget.list.icon,
                color: editTarget.list.color,
              }
            : editTarget?.kind === "file"
              ? {
                  name: editTarget.file.name,
                  description: "",
                }
              : editTarget
                ? {
                    name: editTarget.task.title,
                    description: editTarget.task.description,
                  }
                : null
        }
        onCreate={(input) => {
          if (!editTarget) return;
          if (editTarget.kind === "list") {
            updateList(editTarget.list.id, input);
            showFeedback({
              type: "success",
              text: t("lists.updated", "Saraksts saglabāts."),
            });
          } else if (editTarget.kind === "file") {
            renameStoredListFile(editTarget.file.id, input.name);
            showFeedback({
              type: "success",
              text: t("files.updated", "Fails pārsaukts."),
            });
          } else {
            updateTask(editTarget.task.id, {
              title: input.name,
              description: input.description,
            });
            showFeedback({
              type: "success",
              text: isWorkFolder(editTarget.task)
                ? t("folders.updated", "Mape saglabāta.")
                : t("tasks.list_updated", "Uzdevumu saraksts saglabāts."),
            });
          }
          setEditTarget(null);
        }}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={
          deleteTarget?.kind === "list"
            ? t("lists.delete.title", "Dzēst sarakstu?")
            : deleteTarget?.kind === "file"
              ? t("files.delete.title", "Dzēst failu?")
              : deleteTarget?.kind === "task" && isWorkFolder(deleteTarget.task)
                ? t("folders.delete.title", "Dzēst mapi?")
                : deleteTarget?.kind === "task" && isWorkSubtask(deleteTarget.task)
                  ? t("subtasks.delete.title", "Dzēst apakšuzdevumu?")
                  : t("tasks.delete.list_title", "Dzēst uzdevumu sarakstu?")
        }
        description={
          deleteTarget?.kind === "list"
            ? t("lists.delete.description", "Saraksts “{name}” un viss tā saturs tiks dzēsts.", {
                name: deleteTarget.list.name,
              })
            : deleteTarget?.kind === "file"
              ? t("files.delete.description", "Fails “{name}” tiks dzēsts.", {
                  name: deleteTarget.file.name,
                })
              : deleteTarget?.kind === "task" && isWorkFolder(deleteTarget.task)
                ? t("folders.delete.description", "Mape “{name}” un tās saturs tiks dzēsts.", {
                    name: deleteTarget.task.title,
                  })
                : deleteTarget?.kind === "task" && isWorkSubtask(deleteTarget.task)
                  ? t("subtasks.delete.description", "Apakšuzdevums “{name}” tiks dzēsts.", {
                      name: deleteTarget.task.title,
                    })
                  : t(
                      "tasks.delete.list_description",
                      "Uzdevumu saraksts “{name}” un apakšuzdevumi tiks dzēsti.",
                      { name: deleteTarget?.kind === "task" ? deleteTarget.task.title : "" },
                    )
        }
        confirmLabel={t("actions.delete", "Dzēst")}
        confirmVariant="danger"
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.kind === "list") {
            const listId = deleteTarget.list.id;
            deleteList(listId);
            showFeedback({
              type: "success",
              text: t("lists.deleted", "Saraksts dzēsts."),
            });
            if (pathname === `/lists/${listId}` || pathname.startsWith(`/lists/${listId}/`)) {
              router.push("/lists");
            }
          } else if (deleteTarget.kind === "file") {
            const file = deleteTarget.file;
            deleteStoredListFile(file.id);
            showFeedback({
              type: "success",
              text: t("files.deleted", "Fails dzēsts."),
            });
            if (pathname === filePageHref(file.listId, file.id)) {
              router.push(
                file.parentId
                  ? `/lists/${file.listId}/tasks/${file.parentId}`
                  : `/lists/${file.listId}`,
              );
            }
          } else {
            const task = deleteTarget.task;
            const subtree = new Set(collectTaskSubtreeIds(tasks, task.id));
            const parts = pathname.split("/");
            const openedTaskId = parts[1] === "lists" && parts[3] === "tasks" ? parts[4] : null;
            const openedFileId = parts[1] === "lists" && parts[3] === "files" ? parts[4] : null;
            const openedFile = openedFileId
              ? files.find((item) => item.id === openedFileId)
              : null;
            deleteTask(task.id);
            showFeedback({
              type: "success",
              text: isWorkFolder(task)
                ? t("folders.deleted", "Mape dzēsta.")
                : isWorkSubtask(task)
                  ? t("subtasks.deleted", "Apakšuzdevums dzēsts.")
                  : t("tasks.list_deleted", "Uzdevumu saraksts dzēsts."),
            });
            const leaveTask = openedTaskId && subtree.has(openedTaskId);
            const leaveFile =
              openedFile &&
              (openedFile.parentId === task.id ||
                (openedFile.parentId !== null && subtree.has(openedFile.parentId)));
            if (leaveTask || leaveFile) {
              router.push(
                task.parentId
                  ? `/lists/${task.listId}/tasks/${task.parentId}`
                  : `/lists/${task.listId}`,
              );
            }
          }
          setDeleteTarget(null);
        }}
      />

      <TeamInviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={(input) => {
          const member = inviteMember(input);
          showFeedback({
            type: "success",
            text: t("team.invited", "Uzaicinājums nosūtīts."),
          });
          router.push(`/team/${member.id}`);
        }}
      />
    </>
  );
}
