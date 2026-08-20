"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { DragHandle } from "@/app/components/drag-handle";
import { LoadingState } from "@/app/components/loading-state";
import { NameFormModal } from "@/app/components/name-form-modal";
import type { ParentCreateContext } from "@/app/components/parent-create-flow";
import { ConfirmModal } from "@/app/components/confirm-modal";
import {
  CreateItemMenu,
  createMenuAnchorFromEvent,
  type CreateMenuAnchor,
} from "@/app/components/create-item-menu";
import {
  NavTreeDnd,
  NavTreeEndDrop,
  NavTreeRootDrop,
  NavTreeSortableGroup,
  NavTreeSortableItem,
  useNavTreeDrag,
  type NavTreeSortableHandle,
} from "@/app/components/nav-tree-dnd";
import { useFileViewer } from "@/app/components/file-viewer-provider";
import { OverflowTooltip, Tooltip } from "@/app/components/tooltip";
import { useFeedbackToast } from "@/app/components/feedback-toast-provider";
import { translateActionError } from "@/app/lib/i18n/action-errors";
import { useTranslations } from "@/app/components/translations-provider";
import { workItemArchiveFeedback } from "@/app/components/work-item-archive-button";
import { MemberLastOnline } from "@/app/components/member-last-online";
import { UserAvatar } from "@/app/components/user-avatar";
import { TeamSwitcher } from "@/app/components/team-switcher";
import { UserMenu } from "@/app/components/user-menu";
import {
  collectTaskSubtreeIds,
  getTaskAncestors,
  isWorkFolder,
  isWorkSubtask,
  isTaskActiveInLists,
  listColorById,
  listInitials,
  workItemIcon,
  type WorkList,
  type WorkTask,
  type WorkTaskStatus,
} from "@/app/lib/lists";
import { StatusTreeDot } from "@/app/components/status-control";
import { useFileTypes } from "@/app/lib/file-types-context";
import { fileBaseName, fileExtensionFromName } from "@/app/lib/file-types";
import { FRONTEND_MODULE_KEYS } from "@/app/lib/frontend-modules/keys";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { useLists } from "@/app/lib/lists-store";
import {
  childListFiles,
  deleteStoredListFile,
  filePageHref,
  formatFileSize,
  renameStoredListFile,
  placeStoredListFile,
  reorderStoredListFiles,
  sumFileStorageBuckets,
  type ListFile,
} from "@/app/lib/list-files";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";
import { useTaskStatuses } from "@/app/lib/task-statuses";
import {
  navListRootDroppableId,
  navGroupEndDroppableId,
  resolveNavTreePlacement,
  type NavTreeDropIntent,
  type NavTreeItemData,
} from "@/app/lib/nav-tree-move";
import {
  resolveEffectiveListAccess,
} from "@/app/lib/list-access";
import {
  canInviteTeamMembers,
  canManageTeamSettings,
  confirmedTeamMembers,
  hasTeamActionPermission,
  hasTeamNavPermission,
  memberDisplayName,
} from "@/app/lib/team";

const ListFormModal = dynamic(() =>
  import("@/app/components/list-form-modal").then((mod) => ({
    default: mod.ListFormModal,
  })),
);
const ListStatusesModal = dynamic(() =>
  import("@/app/components/list-statuses-modal").then((mod) => ({
    default: mod.ListStatusesModal,
  })),
);
const TaskStatusesModal = dynamic(() =>
  import("@/app/components/task-statuses-modal").then((mod) => ({
    default: mod.TaskStatusesModal,
  })),
);
const ListAutomationsModal = dynamic(() =>
  import("@/app/components/list-automations-modal").then((mod) => ({
    default: mod.ListAutomationsModal,
  })),
);
const ParentCreateFlow = dynamic(() =>
  import("@/app/components/parent-create-flow").then((mod) => ({
    default: mod.ParentCreateFlow,
  })),
);
const SubtaskDetailModal = dynamic(() =>
  import("@/app/components/subtask-detail-modal").then((mod) => ({
    default: mod.SubtaskDetailModal,
  })),
);
const TeamInviteModal = dynamic(() =>
  import("@/app/components/team-invite-modal").then((mod) => ({
    default: mod.TeamInviteModal,
  })),
);
const TeamRolesModal = dynamic(() =>
  import("@/app/components/team-roles-modal").then((mod) => ({
    default: mod.TeamRolesModal,
  })),
);

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

function PrivateListBadge({ label }: { label: string }) {
  return (
    <Tooltip label={label}>
      <span
        className="relative z-10 inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-md bg-amber-400 px-1 text-[10px] text-zinc-900"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <i className="fas fa-user-lock" aria-hidden="true" />
      </span>
    </Tooltip>
  );
}

function TreeName({
  href,
  label,
  description,
  isPrivate = false,
  onToggle,
}: {
  href?: string;
  label: string;
  description?: string;
  isPrivate?: boolean;
  onToggle?: () => void;
}) {
  const { t } = useTranslations();
  const privateBadge = isPrivate ? (
    <PrivateListBadge label={t("lists.private.label", "Privāts saraksts")} />
  ) : null;

  const name = href ? (
    <Link href={href} prefetch={false} className="block min-w-0 truncate">
      <span className="truncate">{label}</span>
    </Link>
  ) : onToggle ? (
    <button
      type="button"
      onClick={onToggle}
      className="block min-w-0 truncate text-left"
    >
      <span className="truncate">{label}</span>
    </button>
  ) : (
    <span className="block min-w-0 truncate">
      <span className="truncate">{label}</span>
    </span>
  );

  return (
    <span className="flex min-w-0 flex-1 items-center gap-1.5">
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
      {privateBadge}
    </span>
  );
}

function rowHoverActionClassName(forceVisible: boolean) {
  return `inline-flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-200/80 hover:text-zinc-700 ${
    forceVisible
      ? "pointer-events-auto opacity-100"
      : "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100"
  }`;
}

function rowClassName(active: boolean, highlighted = false) {
  if (highlighted && !active) {
    return "flex h-8 w-full min-w-0 items-center gap-1.5 rounded-md bg-blue-50 px-1.5 text-[13px] text-zinc-900 ring-1 ring-inset ring-blue-200";
  }
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
  iconColor,
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
  onActivate,
  status,
  isPrivate = false,
  dragHandle,
  setRowRef,
  rowStyle,
  itemId,
  highlighted = false,
  children,
}: {
  href?: string;
  icon?: string;
  iconColor?: string;
  iconToneClassName?: string;
  iconClassName?: string;
  listAppearance?: { icon: string | null; color: string };
  swapOnHover?: boolean;
  leaf?: boolean;
  /** Prefer over href for leaves that open a modal / download. */
  onActivate?: () => void;
  status?: WorkTaskStatus;
  isPrivate?: boolean;
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
  dragHandle?: {
    attributes: NavTreeSortableHandle["attributes"];
    listeners: NavTreeSortableHandle["listeners"];
    isDragging: boolean;
  } | null;
  setRowRef?: (node: HTMLElement | null) => void;
  rowStyle?: CSSProperties;
  itemId?: string;
  highlighted?: boolean;
  children?: ReactNode;
}) {
  const { t } = useTranslations();
  const drag = useNavTreeDrag();
  const isDropTarget =
    Boolean(itemId && drag.overId === itemId && drag.activeId && drag.activeId !== itemId);
  const nestHighlight =
    highlighted || (isDropTarget && drag.intent === "inside");
  const toggleLabel = expanded
    ? t("nav.collapse", "Sakļaut")
    : t("nav.expand", "Izvērst");
  const listTone = listAppearance
    ? listColorById(listAppearance.color)
    : null;

  const rowLink = Boolean(href && leaf && !onActivate);
  const rowActivate = Boolean(leaf && onActivate);

  return (
    <div className={`overflow-visible${dragHandle?.isDragging ? " opacity-70" : ""}`}>
      <div className="group/row overflow-visible">
        <div
          ref={setRowRef}
          style={rowStyle}
          className={`${rowClassName(isParentActive, nestHighlight)} relative`}
        >
          {rowLink && href ? (
            <Link
              href={href}
              prefetch={false}
              className="absolute inset-0 z-0 rounded-md"
              aria-label={label}
            />
          ) : null}
          {rowActivate && onActivate ? (
            <button
              type="button"
              className="absolute inset-0 z-0 rounded-md"
              aria-label={label}
              onClick={onActivate}
            />
          ) : null}
          {dragHandle ? (
            <span
              className={`absolute top-1/2 left-0 z-20 -translate-x-[calc(100%-3px)] -translate-y-1/2 transition ${
                dragHandle.isDragging
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0 group-hover/row:pointer-events-auto group-hover/row:opacity-100 group-focus-within/row:pointer-events-auto group-focus-within/row:opacity-100"
              }`}
              onPointerDown={(event) => event.stopPropagation()}
            >
              <DragHandle
                label={t("nav.drag", "Pārvietot")}
                attributes={dragHandle.attributes}
                listeners={dragHandle.listeners}
              />
            </span>
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
              className={`${icon} pointer-events-none w-4 text-center text-[12px] ${iconClassName ?? (iconColor ? "" : "text-zinc-400")}`}
              style={iconColor ? { color: iconColor } : undefined}
              aria-hidden="true"
            />
          ) : null}

          <TreeName
            href={rowLink ? undefined : href}
            label={label}
            description={description}
            isPrivate={isPrivate}
            onToggle={rowLink ? undefined : onToggle}
          />

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
  const { lists, tasks, listTasks, childTasks, subtasks, addList, updateList, deleteList, reorderLists, updateTask, deleteTask, setWorkItemArchived, reorderTasks, moveWorkItem, allTaskFiles, isReady: listsReady } = useLists();
  const { files: storedFiles } = useListFiles();
  const files = storedFiles.filter((file) =>
    lists.some((list) => list.id === file.listId),
  );
  const { members, roles, currentUser, currentTeam, inviteMember, isReady: teamReady } = useTeam();
  const sidebarMembers = useMemo(() => confirmedTeamMembers(members), [members]);
  const { isAdmin } = useIsAdmin();
  const { isEnabled: isModuleEnabled } = useFrontendModules();
  const fileUploadsEnabled = isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const { statuses } = useTaskStatuses();
  const { getFileIconDisplay } = useFileTypes();
  const { openListFile } = useFileViewer();
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
  const [teamMenuAnchor, setTeamMenuAnchor] = useState<CreateMenuAnchor | null>(
    null,
  );
  const [rolesModalOpen, setRolesModalOpen] = useState(false);
  const [statusesList, setStatusesList] = useState<WorkList | null>(null);
  const [statusesTask, setStatusesTask] = useState<WorkTask | null>(null);
  const [automationsList, setAutomationsList] = useState<WorkList | null>(null);
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

  function accessForList(list: WorkList | null | undefined) {
    if (!list) {
      return resolveEffectiveListAccess(null, currentUser, roles, isAdmin);
    }
    return resolveEffectiveListAccess(list, currentUser, roles, isAdmin);
  }

  const canSeeDashboard = hasTeamNavPermission(
    currentUser,
    roles,
    isAdmin,
    "dashboard",
  );
  const canSeeLists = hasTeamNavPermission(currentUser, roles, isAdmin, "lists");
  const canSeeTeam = hasTeamNavPermission(currentUser, roles, isAdmin, "team");
  const canCreateLists = hasTeamActionPermission(
    currentUser,
    roles,
    isAdmin,
    "lists.create",
  );
  const canInviteMembers = canInviteTeamMembers(currentUser, roles, isAdmin);
  const canManageRoles = canManageTeamSettings(
    currentUser,
    roles,
    isAdmin,
    "team.roles.manage",
  );
  const canSeeTemplates =
    hasTeamNavPermission(currentUser, roles, isAdmin, "templates") &&
    isModuleEnabled(FRONTEND_MODULE_KEYS.templates);
  const canSeeGoogleDrive =
    canSeeTeam &&
    isModuleEnabled(FRONTEND_MODULE_KEYS.googleDrive) &&
    isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const canSeeOneDrive =
    canSeeTeam &&
    isModuleEnabled(FRONTEND_MODULE_KEYS.onedrive) &&
    isModuleEnabled(FRONTEND_MODULE_KEYS.fileUpload);
  const canManageListStatuses = hasTeamActionPermission(
    currentUser,
    roles,
    isAdmin,
    "lists.statuses.manage",
  );
  const canManageListAutomations =
    hasTeamActionPermission(
      currentUser,
      roles,
      isAdmin,
      "lists.automations.manage",
    ) && isModuleEnabled(FRONTEND_MODULE_KEYS.automations);
  const showTeamMenu = canManageRoles || canSeeTemplates || canSeeGoogleDrive || canSeeOneDrive;

  function accessForListId(listId: string) {
    return accessForList(lists.find((item) => item.id === listId));
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
  const isTeam =
    pathname === "/team" ||
    pathname.startsWith("/team/") ||
    pathname.startsWith("/templates");
  const storageUsage = useMemo(() => {
    return sumFileStorageBuckets([...storedFiles, ...allTaskFiles]);
  }, [allTaskFiles, storedFiles]);
  const storageUsedLabel = formatFileSize(storageUsage.totalBytes);
  const storageTooltip = useMemo(() => {
    const lines: string[] = [];
    if (storageUsage.serverBytes > 0) {
      lines.push(
        t("nav.storage.hint.server", "Serveris: {size}", {
          size: formatFileSize(storageUsage.serverBytes),
        }),
      );
    }
    if (storageUsage.cloudBytes > 0) {
      lines.push(
        t("nav.storage.hint.cloud", "Cloud: {size}", {
          size: formatFileSize(storageUsage.cloudBytes),
        }),
      );
    }
    if (lines.length > 0) return lines.join("\n");
    return t(
      "nav.storage.hint",
      "Kokā un apakšuzdevumos augšupielādētie faili",
    );
  }, [storageUsage.cloudBytes, storageUsage.serverBytes, t]);
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

  const itemMenuList =
    itemMenu?.kind === "list"
      ? (lists.find((item) => item.id === itemMenu.id) ?? null)
      : itemMenu?.kind === "task"
        ? (lists.find(
            (item) =>
              item.id ===
              (tasks.find((task) => task.id === itemMenu.id)?.listId ?? ""),
          ) ?? null)
        : itemMenu?.kind === "file"
          ? (lists.find(
              (item) =>
                item.id ===
                (files.find((file) => file.id === itemMenu.id)?.listId ?? ""),
            ) ?? null)
          : null;
  const itemMenuAccess = accessForList(itemMenuList);
  const itemMenuTask =
    itemMenu?.kind === "task"
      ? (tasks.find((item) => item.id === itemMenu.id) ?? null)
      : null;

  function placeNavItem(
    listId: string,
    activeId: string,
    overId: string,
    intent: NavTreeDropIntent,
  ) {
    const placement = resolveNavTreePlacement({
      activeId,
      overId,
      listId,
      tasks,
      files,
      intent,
    });
    if (!placement) return;
    const task = tasks.find((item) => item.id === activeId) ?? null;
    const file = files.find((item) => item.id === activeId) ?? null;
    if (task) {
      if (isWorkSubtask(task)) {
        reorderTasks(placement.orderedIds);
      } else {
        moveWorkItem(task.id, placement.nextParentId, placement.orderedIds);
        reorderStoredListFiles(placement.orderedIds);
      }
    } else if (file) {
      placeStoredListFile(file.id, placement.nextParentId, placement.orderedIds);
      reorderTasks(placement.orderedIds);
    }
    if (placement.nestIntoId) expandTree(placement.nestIntoId);
  }

  function placeNavList(
    activeId: string,
    overId: string,
    intent: NavTreeDropIntent,
  ) {
    if (activeId === overId) return;
    const ids = lists.map((list) => list.id);
    const from = ids.indexOf(activeId);
    const to = ids.indexOf(overId);
    if (from < 0 || to < 0) return;
    const next = ids.slice();
    const [moved] = next.splice(from, 1);
    let target = to;
    if (from < to) target -= 1;
    if (intent === "after") target += 1;
    next.splice(Math.max(0, Math.min(target, next.length)), 0, moved);
    reorderLists(next);
  }

  function navOverlayLabel(id: string) {
    return (
      tasks.find((item) => item.id === id)?.title ??
      files.find((item) => item.id === id)?.name ??
      ""
    );
  }

  function renderFileRow(listId: string, file: ListFile, canReorder: boolean) {
    const fileIcon = getFileIconDisplay(file.name);
    const data: NavTreeItemData = {
      kind: "file",
      listId,
      parentId: file.parentId,
    };
    return (
      <NavTreeSortableItem key={file.id} id={file.id} data={data} disabled={!canReorder}>
        {(handle) => (
          <NavTreeSection
            icon={fileIcon.icon}
            iconColor={fileIcon.color}
            iconClassName=""
            leaf
            onActivate={() => openListFile(file)}
            itemId={file.id}
            label={file.name}
            expanded={false}
            isParentActive={activeFileId === file.id}
            onToggle={() => undefined}
            setRowRef={handle.setNodeRef}
            rowStyle={handle.style}
            dragHandle={canReorder ? handle : null}
            moreOpen={itemMenu?.kind === "file" && itemMenu.id === file.id}
            onMore={
              accessForListId(listId).canEditTasks
                ? (event) =>
                    setItemMenu({
                      kind: "file",
                      id: file.id,
                      anchor: createMenuAnchorFromEvent(event),
                    })
                : undefined
            }
          />
        )}
      </NavTreeSortableItem>
    );
  }

  function renderTaskTree(listId: string, parentId: string | null): ReactNode {
    const listAccess = accessForListId(listId);
    const parent = parentId
      ? (tasks.find((item) => item.id === parentId) ?? null)
      : null;
    const showFiles =
      fileUploadsEnabled &&
      (!parentId || Boolean(parent && isWorkFolder(parent)));
    const rawItems = parentId
      ? parent && isWorkFolder(parent)
        ? childTasks(parentId)
        : subtasks(parentId)
      : listTasks(listId);
    const items =
      parentId && !(parent && isWorkFolder(parent))
        ? rawItems.filter((task) => isTaskActiveInLists(task, statuses))
        : rawItems;
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

    const canReorder = listAccess.canEditTasks;
    const mixedIds = mixed.map((item) => item.id);

    return (
      <NavTreeSortableGroup itemIds={mixedIds}>
        {mixed.map((entry) => {
          if (entry.kind === "file") {
            return renderFileRow(listId, entry.file, canReorder);
          }

          const task = entry.task;
          const href = `/lists/${listId}/tasks/${task.id}`;
          const folder = isWorkFolder(task);
          const data: NavTreeItemData = {
            kind: isWorkSubtask(task) ? "subtask" : folder ? "folder" : "task",
            listId,
            parentId: task.parentId,
          };
          return (
            <NavTreeSortableItem
              key={task.id}
              id={task.id}
              data={data}
              disabled={!canReorder}
            >
              {(handle) => (
                <NavTreeSection
                  href={href}
                  icon={isWorkSubtask(task) ? undefined : workItemIcon(task)}
                  status={isWorkSubtask(task) ? task.status : undefined}
                  swapOnHover={!isWorkSubtask(task)}
                  leaf={isWorkSubtask(task)}
                  itemId={task.id}
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
                  setRowRef={handle.setNodeRef}
                  rowStyle={handle.style}
                  dragHandle={canReorder ? handle : null}
                  moreOpen={itemMenu?.kind === "task" && itemMenu.id === task.id}
                  onMore={
                    listAccess.canEditTasks
                      ? (event) =>
                          setItemMenu({
                            kind: "task",
                            id: task.id,
                            anchor: createMenuAnchorFromEvent(event),
                          })
                      : undefined
                  }
                  onAdd={
                    isWorkSubtask(task) || !listAccess.canCreateTasks
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
            </NavTreeSortableItem>
          );
        })}
        {canReorder && showFiles ? (
          <NavTreeEndDrop
            id={navGroupEndDroppableId(listId, parentId)}
            disabled={!canReorder}
          />
        ) : null}
      </NavTreeSortableGroup>
    );
  }

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 flex w-[var(--app-sidebar-width-expanded)] flex-col border-r border-zinc-200 bg-white">
        <TeamSwitcher />

        <nav className="min-h-0 flex-1 space-y-0.5 overflow-x-visible overflow-y-auto px-2 pb-3 [scrollbar-width:thin] [scrollbar-color:rgb(212_212_216)_transparent]">
          {canSeeDashboard ? (
            <Link href="/dashboard" className={rowClassName(isHome)}>
              <span className="inline-flex size-5 shrink-0 items-center justify-center text-zinc-500">
                <i className="fas fa-house text-[12px]" aria-hidden="true" />
              </span>
              <span>{t("nav.home", "Sākums")}</span>
            </Link>
          ) : null}

          {canSeeLists ? (
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
            onAdd={
              currentTeam && canCreateLists ? () => setCreateListOpen(true) : undefined
            }
          >
            {listsReady ? (
              lists.length > 0 ? (
              <NavTreeDnd
                renderOverlay={(id) => (
                  <div className="max-w-[11rem] truncate rounded-md border border-zinc-200 bg-white/90 px-2 py-1 text-[13px] font-medium text-zinc-900 shadow-lg">
                    {lists.find((list) => list.id === id)?.name ?? navOverlayLabel(id)}
                  </div>
                )}
                onPlace={placeNavList}
              >
                <NavTreeSortableGroup itemIds={lists.map((list) => list.id)}>
                  {lists.map((list) => {
                    const listAccess = accessForList(list);
                    const canDrag = listAccess.canEditList;
                    return (
                      <NavTreeSortableItem
                        key={list.id}
                        id={list.id}
                        data={{ kind: "task", listId: list.id, parentId: null }}
                        disabled={!canDrag}
                      >
                        {(handle) => (
                          <NavTreeDnd
                            renderOverlay={(id) => (
                              <div className="max-w-[11rem] truncate rounded-md border border-zinc-200 bg-white/90 px-2 py-1 text-[13px] font-medium text-zinc-900 shadow-lg">
                                {navOverlayLabel(id)}
                              </div>
                            )}
                            onPlace={(activeId, overId, intent) =>
                              placeNavItem(list.id, activeId, overId, intent)
                            }
                          >
                            <NavTreeRootDrop
                              id={navListRootDroppableId(list.id)}
                              disabled={!canDrag}
                            >
                              {({ setNodeRef, isOver }) => (
                                <NavTreeSection
                  href={`/lists/${list.id}`}
                  icon={list.kind === "folder" ? "far fa-folder" : undefined}
                  swapOnHover={list.kind === "folder"}
                  listAppearance={
                    list.kind === "folder"
                      ? undefined
                      : { icon: list.icon, color: list.color }
                  }
                  label={list.name}
                  isPrivate={list.isPrivate}
                  description={list.description}
                  addLabel={t("create.menu.title", "Izveidot")}
                  addAriaLabel={t("create.menu.title", "Izveidot")}
                  expanded={isExpanded(list.id, true)}
                  isParentActive={pathname === `/lists/${list.id}`}
                  onToggle={() => toggleTree(list.id, true)}
                  setRowRef={(node) => {
                    setNodeRef(node);
                    handle.setNodeRef(node);
                  }}
                  rowStyle={handle.style}
                  dragHandle={canDrag ? handle : null}
                  highlighted={isOver}
                  moreOpen={itemMenu?.kind === "list" && itemMenu.id === list.id}
                  onMore={
                    listAccess.canEditList || listAccess.canDeleteList
                      ? (event) =>
                          setItemMenu({
                            kind: "list",
                            id: list.id,
                            anchor: createMenuAnchorFromEvent(event),
                          })
                      : undefined
                  }
                  onAdd={
                    listAccess.canCreateTasks
                      ? (event) =>
                          setParentCreate({
                            listId: list.id,
                            parentId: null,
                            variant: list.kind === "folder" ? "folder" : "list",
                            anchor: createMenuAnchorFromEvent(event),
                          })
                      : undefined
                  }
                                >
                                  {renderTaskTree(list.id, null)}
                                </NavTreeSection>
                              )}
                            </NavTreeRootDrop>
                          </NavTreeDnd>
                        )}
                      </NavTreeSortableItem>
                    );
                  })}
                </NavTreeSortableGroup>
              </NavTreeDnd>
            ) : (
              <p className="px-2 py-1.5 text-[12px] text-zinc-400">
                {currentTeam
                  ? t("lists.empty", "Vēl nav sarakstu.")
                  : t("teams.required.empty_members", "Vispirms izveido komandu.")}
              </p>
            )
            ) : (
              <LoadingState compact />
            )}
          </NavTreeSection>
          ) : null}

          {canSeeTeam ? (
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
            onAdd={
              currentTeam && canInviteMembers ? () => setInviteOpen(true) : undefined
            }
            moreOpen={teamMenuAnchor !== null}
            onMore={
              currentTeam && showTeamMenu
                ? (event) => setTeamMenuAnchor(createMenuAnchorFromEvent(event))
                : undefined
            }
          >
            {teamReady ? (
              currentTeam && sidebarMembers.length > 0 ? (
              sidebarMembers.map((member) => {
                const href = `/team/${member.id}`;
                return (
                  <Link
                    key={member.id}
                    href={href}
                    prefetch={false}
                    className={rowClassName(pathname === href)}
                  >
                    <UserAvatar member={member} size="xs" />
                    <OverflowTooltip label={memberDisplayName(member)} className="min-w-0 flex-1">
                      <span className="block min-w-0 truncate">{memberDisplayName(member)}</span>
                    </OverflowTooltip>
                    <MemberLastOnline
                      lastOnlineAt={
                        member.id === currentUser.id || member.userId === currentUser.id
                          ? new Date().toISOString()
                          : member.lastOnlineAt
                      }
                    />
                  </Link>
                );
              })
            ) : (
              <p className="px-2 py-1.5 text-[12px] text-zinc-400">
                {currentTeam
                  ? t("team.empty", "Komandā vēl nav biedru.")
                  : t("teams.required.empty_members", "Vispirms izveido komandu.")}
              </p>
            )
            ) : (
              <LoadingState compact />
            )}
          </NavTreeSection>
          ) : null}
        </nav>

        <div className="shrink-0 space-y-0.5 border-t border-zinc-100 px-2 py-2">
          {currentTeam && fileUploadsEnabled ? (
            <Tooltip label={storageTooltip} className="block">
              <div className="flex min-h-8 items-center gap-2 rounded-md px-1.5 text-[13px] text-zinc-500">
                <span className="inline-flex size-5 shrink-0 items-center justify-center text-zinc-400">
                  <i className="fas fa-hard-drive text-[12px]" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t("nav.storage.used", "Failu vieta")}
                </span>
                <span className="shrink-0 tabular-nums text-zinc-600">
                  {storageUsedLabel}
                </span>
              </div>
            </Tooltip>
          ) : null}
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

      <ListFormModal
        open={createListOpen}
        onOpenChange={setCreateListOpen}
        title={t("lists.add.title", "Jauns saraksts")}
        description={t(
          "lists.add.description",
          "Saraksts grupē projektus vai klientus, katram ar saviem uzdevumiem un iestatījumiem.",
        )}
        namePlaceholder={t(
          "lists.fields.name_placeholder",
          "Piemēram, Projekti, Klienti",
        )}
        descriptionPlaceholder={t(
          "lists.fields.description_placeholder",
          "Īss apraksts",
        )}
        submitLabel={t("actions.add", "Pievienot")}
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
        open={teamMenuAnchor !== null}
        anchor={teamMenuAnchor}
        title={t("common.actions", "Darbības")}
        items={[
          ...(canManageRoles
            ? [
                {
                  id: "roles",
                  icon: "fas fa-user-tag",
                  title: t("team.roles.title", "Komandas lomas"),
                  description: t(
                    "team.roles.menu_description",
                    "Sadali biedrus pa lomām",
                  ),
                },
              ]
            : []),
          ...(canSeeTemplates
            ? [
                {
                  id: "templates",
                  icon: "fas fa-copy",
                  title: t("nav.templates", "Šabloni"),
                  description: t(
                    "templates.menu_description",
                    "Sagatavo uzdevumu sarakstus, ko pēc tam pievieno mapē",
                  ),
                },
              ]
            : []),
          ...(canSeeGoogleDrive
            ? [
                {
                  id: "google-drive",
                  icon: "fab fa-google-drive",
                  title: t("nav.google_drive", "Google Drive Integrācija"),
                  description: t(
                    "google_drive.menu_description",
                    "Sūti augšupielādētos failus uz komandas Google Drive",
                  ),
                },
              ]
            : []),
          ...(canSeeOneDrive
            ? [
                {
                  id: "onedrive",
                  icon: "fab fa-microsoft",
                  title: t("nav.onedrive", "OneDrive Integrācija"),
                  description: t(
                    "onedrive.menu_description",
                    "Sūti augšupielādētos failus uz komandas OneDrive",
                  ),
                },
              ]
            : []),
        ]}
        onClose={() => setTeamMenuAnchor(null)}
        onSelect={(id) => {
          setTeamMenuAnchor(null);
          if (id === "roles") setRolesModalOpen(true);
          if (id === "templates") router.push("/templates");
          if (id === "google-drive") router.push("/team/google-drive");
          if (id === "onedrive") router.push("/team/onedrive");
        }}
      />

      <TeamRolesModal open={rolesModalOpen} onOpenChange={setRolesModalOpen} />

      <ListStatusesModal
        list={statusesList}
        open={statusesList !== null}
        onOpenChange={(open) => {
          if (!open) setStatusesList(null);
        }}
      />
      <TaskStatusesModal
        task={statusesTask}
        open={statusesTask !== null}
        onOpenChange={(open) => {
          if (!open) setStatusesTask(null);
        }}
      />

      <ListAutomationsModal
        list={automationsList}
        open={automationsList !== null}
        onOpenChange={(open) => {
          if (!open) setAutomationsList(null);
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
                ...(itemMenuAccess.canEditTasks
                  ? [
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
                  : []),
              ]
            : itemMenu?.kind === "list"
              ? [
                  ...(itemMenuAccess.canEditList
                    ? [
                        {
                          id: "edit",
                          icon: "fas fa-pen",
                          title: t("actions.edit", "Labot"),
                        },
                        ...(canManageListStatuses
                          ? [
                              {
                                id: "statuses",
                                icon: "fas fa-circle-dot",
                                title: t("lists.statuses.title", "Statusi"),
                                description: t(
                                  "lists.statuses.menu_description",
                                  "Sistēmas un saraksta statusi",
                                ),
                              },
                            ]
                          : []),
                        ...(canManageListAutomations
                          ? [
                              {
                                id: "automations",
                                icon: "fas fa-bolt",
                                title: t("lists.automations.title", "Automatizācijas"),
                                description: t(
                                  "lists.automations.menu_description",
                                  "Automātiskās darbības sarakstā",
                                ),
                              },
                            ]
                          : []),
                      ]
                    : []),
                  ...(itemMenuAccess.canDeleteList
                    ? [
                        {
                          id: "delete",
                          icon: "fas fa-trash",
                          title: t("actions.delete", "Dzēst"),
                          danger: true,
                          dividerBefore: itemMenuAccess.canEditList,
                        },
                      ]
                    : []),
                ]
              : itemMenuAccess.canEditTasks
                ? [
                    {
                      id: "edit",
                      icon: "fas fa-pen",
                      title: t("actions.edit", "Labot"),
                    },
                    ...(itemMenuTask &&
                    itemMenuTask.kind === "task" &&
                    canManageListStatuses
                      ? [
                          {
                            id: "statuses",
                            icon: "fas fa-circle-dot",
                            title: t("tasks.statuses.title", "Statusi"),
                            description: t(
                              "tasks.statuses.menu_description",
                              "Uzdevuma apakšuzdevumu statusi",
                            ),
                          },
                        ]
                      : []),
                    ...(itemMenuTask && !isWorkSubtask(itemMenuTask)
                      ? [
                          {
                            id: "archive",
                            icon: "fas fa-folder-open",
                            title: t("actions.archive", "Arhivēt"),
                          },
                        ]
                      : []),
                    {
                      id: "delete",
                      icon: "fas fa-trash",
                      title: t("actions.delete", "Dzēst"),
                      danger: true,
                      dividerBefore: true,
                    },
                  ]
                : []
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
            if (file) openListFile(file);
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
          if (id === "statuses") {
            if (list) setStatusesList(list);
            if (task && task.kind === "task") setStatusesTask(task);
            return;
          }
          if (id === "automations") {
            if (list) setAutomationsList(list);
            return;
          }
          if (id === "delete") {
            if (list) setDeleteTarget({ kind: "list", list });
            if (task) setDeleteTarget({ kind: "task", task });
            if (file) setDeleteTarget({ kind: "file", file });
          }
          if (id === "archive" && task && !isWorkSubtask(task)) {
            setWorkItemArchived(task.id, true);
            showFeedback({
              type: "success",
              text: workItemArchiveFeedback(t, task, true),
            });
          }
        }}
      />

      {editTarget?.kind === "list" ? (
        <ListFormModal
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          title={t("lists.edit.title", "Labot sarakstu")}
          description={t(
            "lists.edit.description",
            "Maini saraksta nosaukumu, ikonu, aprakstu un privātumu.",
          )}
          namePlaceholder={t("lists.fields.name_placeholder", "Piemēram, Projekti, Klienti")}
          descriptionPlaceholder={t("lists.fields.description_placeholder", "Īss apraksts")}
          submitLabel={t("actions.save", "Saglabāt")}
          initialValue={{
            name: editTarget.list.name,
            description: editTarget.list.description,
            icon: editTarget.list.icon,
            color: editTarget.list.color,
            isPrivate: editTarget.list.isPrivate,
            defaultAccessLevel: editTarget.list.defaultAccessLevel,
            viewerUserIds: editTarget.list.viewerUserIds,
            viewerRoleIds: editTarget.list.viewerRoleIds,
            viewerUserAccess: editTarget.list.viewerUserAccess,
            viewerRoleAccess: editTarget.list.viewerRoleAccess,
          }}
          onCreate={(input) => {
            updateList(editTarget.list.id, input);
            showFeedback({
              type: "success",
              text: t("lists.updated", "Saraksts saglabāts."),
            });
            setEditTarget(null);
          }}
        />
      ) : (
        <NameFormModal
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          title={
            editTarget?.kind === "file"
              ? t("files.edit.title", "Pārsaukt failu")
              : editTarget?.kind === "task" && isWorkFolder(editTarget.task)
                ? t("folders.edit.title", "Labot mapi")
                : t("tasks.edit.list_title", "Labot uzdevumu sarakstu")
          }
          description={
            editTarget?.kind === "file"
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
          showAppearance={false}
          showDescription={editTarget?.kind !== "file"}
          nameSuffix={
            editTarget?.kind === "file"
              ? (() => {
                  const extension = fileExtensionFromName(editTarget.file.name);
                  return extension ? `.${extension}` : null;
                })()
              : null
          }
          initialValue={
            editTarget?.kind === "file"
              ? {
                  name: fileBaseName(editTarget.file.name),
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
            if (editTarget.kind === "file") {
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
      )}

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
        onInvite={async (input) => {
          try {
            const member = await inviteMember(input);
            showFeedback({
              type: "success",
              text: t("team.invited", "Uzaicinājums nosūtīts."),
            });
            router.push(`/team/${member.id}`);
          } catch (error) {
            showFeedback({
              type: "error",
              text: translateActionError(
                t,
                error instanceof Error ? error.message : "errors.team_invite_failed",
              ),
            });
          }
        }}
      />
    </>
  );
}
