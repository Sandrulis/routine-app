"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AdminPanelButton } from "@/app/components/admin-panel-button";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ListBadge } from "@/app/components/list-badge";
import { NotificationsMenu } from "@/app/components/notifications-menu";
import { TeamSwitcher } from "@/app/components/team-switcher";
import { Tooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { FileIcon } from "@/app/components/file-icon";
import {
  getChildTasks,
  getListTasks,
  getTaskAncestors,
  isWorkFolder,
  workItemIcon,
  type WorkTask,
} from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";
import { formatInteger } from "@/app/lib/format/numbers";
import { useTemplates } from "@/app/lib/templates-store";

type CrumbSwitcher = {
  listId: string;
  parentId: string | null;
  kind: "folder" | "task";
  currentId: string;
};

type Crumb = {
  href: string | null;
  label: string;
  icon?: ReactNode;
  switcher?: CrumbSwitcher;
};

function CrumbIcon({ className }: { className: string }) {
  return <i className={`${className} text-[11px]`} aria-hidden="true" />;
}

function taskSwitcher(task: WorkTask): CrumbSwitcher {
  return {
    listId: task.listId,
    parentId: task.parentId,
    kind: isWorkFolder(task) ? "folder" : "task",
    currentId: task.id,
  };
}

function siblingsFor(
  tasks: WorkTask[],
  switcher: CrumbSwitcher,
): WorkTask[] {
  const pool = switcher.parentId
    ? getChildTasks(tasks, switcher.parentId)
    : getListTasks(tasks, switcher.listId);
  return pool.filter((item) =>
    switcher.kind === "folder" ? isWorkFolder(item) : !isWorkFolder(item),
  );
}

function PathBranch({
  task,
  listId,
  tasks,
  currentId,
  onNavigate,
}: {
  task: WorkTask;
  listId: string;
  tasks: WorkTask[];
  currentId: string;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const children = getChildTasks(tasks, task.id);
  const current = task.id === currentId;
  return (
    <>
      <div className="flex w-full items-center pr-1">
        {children.length > 0 ? (
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-5 shrink-0 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100"
          >
            <i
              className={`fas fa-chevron-down text-[9px] transition ${open ? "" : "-rotate-90"}`}
              aria-hidden="true"
            />
          </button>
        ) : null}
        <Link
          href={`/lists/${listId}/tasks/${task.id}`}
          onClick={onNavigate}
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-left text-sm ${
            current ? "bg-zinc-100 font-medium text-zinc-900" : "text-zinc-700 hover:bg-zinc-50"
          }`}
        >
          <i className={`${workItemIcon(task)} w-3 shrink-0 text-[11px] text-zinc-400`} aria-hidden="true" />
          <span className="truncate">{task.title}</span>
        </Link>
      </div>
      {open ? (
        <div className="ml-[15px] border-l border-zinc-200 pl-1.5">
          {children.map((child) => (
            <PathBranch
              key={child.id}
              task={child}
              listId={listId}
              tasks={tasks}
              currentId={currentId}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function PathItemMenu({
  crumb,
  tasks,
  current,
}: {
  crumb: Crumb;
  tasks: WorkTask[];
  current: boolean;
}) {
  const switcher = crumb.switcher;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const options = switcher ? siblingsFor(tasks, switcher) : [];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!switcher || !crumb.href || options.length <= 1) {
    return null;
  }

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className={`flex min-w-0 items-center gap-1.5 rounded-md ${
          current ? "font-semibold text-zinc-900" : "text-zinc-400 hover:text-zinc-700"
        }`}
      >
        <CrumbMark icon={crumb.icon} muted={!current} />
        <span className="truncate">{crumb.label}</span>
        <i
          className={`fas fa-chevron-down shrink-0 text-[8px] text-zinc-400 transition ${open ? "" : "-rotate-90"}`}
          aria-hidden="true"
        />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-full left-0 z-40 mt-1 max-h-80 w-max max-w-64 overflow-y-auto rounded-xl bg-white p-1 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
        >
          {options.map((item) => (
            <PathBranch
              key={item.id}
              task={item}
              listId={switcher.listId}
              tasks={tasks}
              currentId={switcher.currentId}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CrumbMark({ icon, muted }: { icon?: ReactNode; muted: boolean }) {
  if (!icon) return null;
  return (
    <span
      className={`inline-flex size-5 shrink-0 items-center justify-center ${
        muted ? "text-zinc-400" : "text-zinc-500"
      }`}
    >
      {icon}
    </span>
  );
}

export function PageBreadcrumb({
  menuOpen = false,
  onOpenMenu,
  todoOpen = false,
  todoEnabled = false,
  todoCollapsed = false,
  todoActiveCount = 0,
  onOpenTodo,
}: {
  menuOpen?: boolean;
  onOpenMenu?: () => void;
  todoOpen?: boolean;
  todoEnabled?: boolean;
  todoCollapsed?: boolean;
  todoActiveCount?: number;
  onOpenTodo?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { lists, tasks, allTaskFiles, isReady: listsReady } = useLists();
  const { files, isReady: filesReady } = useListFiles();
  const { members, isReady: teamReady } = useTeam();
  const { templates, isReady: templatesReady } = useTemplates();
  const loadingLabel = t("common.loading", "Ielādē…");
  const showTodoBadge = Boolean(onOpenTodo) && !todoOpen && todoActiveCount > 0;
  const todoButtonLabel = showTodoBadge
    ? t("user_todo.open_with_count", "Darāmo saraksts ({count})", {
        count: formatInteger(todoActiveCount),
      })
    : t("user_todo.title", "Darāmo saraksts");

  const crumbs = useMemo<Crumb[]>(() => {
    const parts = pathname.split("/").filter(Boolean);
    const items: Crumb[] = [];

    if (parts.length === 0 || parts[0] === "dashboard") {
      return [
        {
          href: "/dashboard",
          label: t("nav.home", "Sākums"),
          icon: <CrumbIcon className="fas fa-house" />,
        },
      ];
    }

    if (parts[0] === "lists") {
      items.push({
        href: parts[1] ? "/lists" : null,
        label: t("nav.lists", "Saraksts"),
        icon: <CrumbIcon className="fas fa-list-ul" />,
      });

      const list = parts[1] ? lists.find((item) => item.id === parts[1]) : null;
      if (parts[1]) {
        items.push({
          href: `/lists/${parts[1]}`,
          label: listsReady
            ? (list?.name ?? t("lists.detail.missing", "Saraksts nav atrasts"))
            : loadingLabel,
          icon: list ? (
            <ListBadge
              name={list.name}
              icon={list.icon}
              color={list.color}
              isPrivate={list.isPrivate}
            />
          ) : (
            <CrumbIcon className="fas fa-folder" />
          ),
        });
      }

      if (parts[2] === "tasks" && parts[3]) {
        const task = tasks.find((item) => item.id === parts[3]);
        if (task) {
          for (const ancestor of getTaskAncestors(tasks, task)) {
            items.push({
              href: `/lists/${parts[1]}/tasks/${ancestor.id}`,
              label: ancestor.title,
              icon: <CrumbIcon className={workItemIcon(ancestor)} />,
              switcher: taskSwitcher(ancestor),
            });
          }
        }
        items.push({
          href: `/lists/${parts[1]}/tasks/${parts[3]}`,
          label:
            listsReady
              ? (task?.title ?? t("tasks.detail.missing", "Uzdevums nav atrasts"))
              : loadingLabel,
          icon: (
            <CrumbIcon
              className={task ? workItemIcon(task) : "fas fa-list-check"}
            />
          ),
          switcher: task ? taskSwitcher(task) : undefined,
        });

        if (parts[4] === "files" && parts[5]) {
          const taskFile =
            allTaskFiles.find((item) => item.id === parts[5]) ?? null;
          items.push({
            href: `/lists/${parts[1]}/tasks/${parts[3]}/files/${parts[5]}`,
            label: listsReady
              ? (taskFile?.name ?? t("files.detail.missing", "Fails nav atrasts"))
              : loadingLabel,
            icon: taskFile ? (
              <FileIcon name={taskFile.name} className="text-[11px]" />
            ) : (
              <CrumbIcon className="fas fa-file" />
            ),
          });
        }
      }

      if (parts[2] === "files" && parts[3]) {
        const file = files.find((item) => item.id === parts[3]);
        if (file?.parentId) {
          const parent = tasks.find((item) => item.id === file.parentId);
          if (parent) {
            for (const ancestor of getTaskAncestors(tasks, parent)) {
              items.push({
                href: `/lists/${parts[1]}/tasks/${ancestor.id}`,
                label: ancestor.title,
                icon: <CrumbIcon className={workItemIcon(ancestor)} />,
                switcher: taskSwitcher(ancestor),
              });
            }
            items.push({
              href: `/lists/${parts[1]}/tasks/${parent.id}`,
              label: parent.title,
              icon: <CrumbIcon className={workItemIcon(parent)} />,
              switcher: taskSwitcher(parent),
            });
          }
        }
        items.push({
          href: `/lists/${parts[1]}/files/${parts[3]}`,
          label: filesReady
            ? (file?.name ?? t("files.detail.missing", "Fails nav atrasts"))
            : loadingLabel,
          icon: file ? (
            <FileIcon name={file.name} className="text-[11px]" />
          ) : (
            <CrumbIcon className="fas fa-file" />
          ),
        });
      }

      return items;
    }

    if (parts[0] === "team") {
      items.push({
        href: "/team",
        label: t("nav.team", "Komanda"),
        icon: <CrumbIcon className="fas fa-users" />,
      });
      if (parts[1] === "google-drive") {
        items.push({
          href: "/team/google-drive",
          label: t("nav.google_drive", "Google Drive Integrācija"),
          icon: <CrumbIcon className="fab fa-google-drive" />,
        });
        return items;
      }
      if (parts[1] === "onedrive") {
        items.push({
          href: "/team/onedrive",
          label: t("nav.onedrive", "OneDrive Integrācija"),
          icon: <CrumbIcon className="fab fa-microsoft" />,
        });
        return items;
      }
      if (parts[1] === "factory") {
        items.push({
          href: "/team/factory",
          label: t("frontend_modules.label.module_factory", "Rūpnīca"),
          icon: <CrumbIcon className="fas fa-industry" />,
        });
        return items;
      }
      if (parts[1] === "billing") {
        items.push({
          href: "/team/billing",
          label: t("team.billing.title", "Abonementi"),
          icon: <CrumbIcon className="fas fa-credit-card" />,
        });
        return items;
      }
      if (parts[1]) {
        const member = members.find((item) => item.id === parts[1]);
        items.push({
          href: `/team/${parts[1]}`,
          label: teamReady
            ? (member?.name ?? t("team.detail.missing", "Lietotājs nav atrasts"))
            : loadingLabel,
          icon: member ? (
            <UserAvatar member={member} size="xs" />
          ) : (
            <CrumbIcon className="fas fa-user" />
          ),
        });
      }
      return items;
    }

    if (parts[0] === "templates") {
      items.push({
        href: parts[1] ? "/templates" : null,
        label: t("nav.templates", "Šabloni"),
        icon: <CrumbIcon className="fas fa-copy" />,
      });
      if (parts[1]) {
        const template = templates.find((item) => item.id === parts[1]);
        items.push({
          href: `/templates/${parts[1]}`,
          label: templatesReady
            ? (template?.name ?? t("templates.detail.missing", "Šablons nav atrasts"))
            : loadingLabel,
          icon: <CrumbIcon className="fas fa-copy" />,
        });
      }
      return items;
    }

    if (parts[0] === "settings") {
      items.push({
        href: "/settings",
        label: t("nav.settings", "Uzstādījumi"),
        icon: <CrumbIcon className="fas fa-gear" />,
      });
      if (parts[1] === "profile") {
        items.push({
          href: "/settings/profile",
          label: t("user_menu.settings", "Personīgie uzstādījumi"),
          icon: <CrumbIcon className="fas fa-user" />,
        });
      }
      return items;
    }

    if (parts[0] === "admin") {
      const section = parts[1];
      const sectionLabels: Record<string, string> = {
        users: t("admin.nav.users", "Lietotāji"),
        teams: t("admin.nav.teams", "Komandas"),
        roles: t("admin.nav.roles", "Lomas"),
        statuses: t("admin.nav.statuses", "Statusi"),
        "file-types": t("admin.nav.file_types", "Failu tipi"),
        languages: t("admin.nav.languages", "Valodas"),
        translations: t("admin.nav.translations", "Tulkojumi"),
        docs: t("admin.nav.docs", "Docs"),
        announcements: t("admin.nav.announcements", "Paziņojumi"),
        modules: t("nav.modules", "Moduļi"),
        "payment-plans": t("admin.nav.payment_plans", "Maksas plāni"),
        integrations: t("admin.nav.integrations", "Integrācijas"),
        "email-templates": t("admin.nav.email_templates", "E-pasta šabloni"),
        "cron-jobs": t("admin.nav.cron_jobs", "Cron jobs"),
        settings: t("nav.settings", "Uzstādījumi"),
      };
      const sectionLabel = section ? (sectionLabels[section] ?? null) : null;
      const items: Crumb[] = [
        {
          href: sectionLabel ? "/admin" : null,
          label: t("admin.panel.title", "Administrācijas panelis"),
          icon: <CrumbIcon className="fas fa-users-cog" />,
        },
      ];
      if (sectionLabel) {
        items.push({
          href: `/admin/${section}`,
          label: sectionLabel,
        });
      }
      if (section === "docs" && parts[2]) {
        items.push({
          href: pathname,
          label: t("admin.docs.articles", "Apakškategorijas"),
        });
      }
      return items;
    }

    return [
      {
        href: pathname,
        label: t("nav.home", "Sākums"),
        icon: <CrumbIcon className="fas fa-house" />,
      },
    ];
  }, [allTaskFiles, files, filesReady, lists, listsReady, loadingLabel, members, pathname, t, tasks, teamReady, templates, templatesReady]);

  return (
    <>
      <header className="fixed top-0 right-[var(--app-todo-rail-width-expanded)] left-[var(--app-sidebar-width-expanded)] z-30 flex h-[var(--app-topbar-height)] items-center border-b border-zinc-200 bg-white/95 pr-4 pl-2 backdrop-blur-sm md:pr-6 xl:pl-[var(--app-content-inset-left)]">
      <div className="flex w-full items-center justify-between gap-3">
        {onOpenMenu ? (
          <Tooltip label={t("actions.open_menu", "Atvērt izvēlni")} align="start">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 xl:hidden"
              aria-label={t("actions.open_menu", "Atvērt izvēlni")}
              aria-expanded={menuOpen}
              aria-controls="app-sidebar"
              onClick={onOpenMenu}
            >
              <i className="fas fa-bars text-lg" aria-hidden="true" />
            </button>
          </Tooltip>
        ) : null}
        <div className="min-w-0 flex-1 md:hidden">
          <TeamSwitcher compact />
        </div>
        <nav
          aria-label={t("breadcrumb.label", "Ceļš")}
          className="hidden min-w-0 flex-1 md:block"
        >
          <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
            {crumbs.map((crumb, index) => {
              const isCurrent = index === crumbs.length - 1;
              return (
                <li
                  key={`${crumb.href ?? crumb.label}-${index}`}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  {index > 0 ? (
                    <span className="shrink-0 text-zinc-300" aria-hidden="true">
                      /
                    </span>
                  ) : null}
                  {crumb.switcher ? (
                    <PathItemMenu crumb={crumb} tasks={tasks} current={isCurrent} />
                  ) : null}
                  {crumb.switcher && siblingsFor(tasks, crumb.switcher).length > 1 ? null : isCurrent ? (
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold text-zinc-900">
                      <CrumbMark icon={crumb.icon} muted={false} />
                      <span className="truncate">{crumb.label}</span>
                    </span>
                  ) : crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="flex min-w-0 items-center gap-1.5 text-zinc-400 transition hover:text-zinc-700"
                    >
                      <CrumbMark icon={crumb.icon} muted />
                      <span className="truncate">{crumb.label}</span>
                    </Link>
                  ) : (
                    <span className="flex min-w-0 items-center gap-1.5 text-zinc-400">
                      <CrumbMark icon={crumb.icon} muted />
                      <span className="truncate">{crumb.label}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="flex shrink-0 items-center gap-0.5">
          {todoEnabled && onOpenTodo ? (
            <Tooltip label={todoButtonLabel} align="end">
              <button
                type="button"
                className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900 ${
                  todoCollapsed ? "" : "xl:hidden"
                } ${todoOpen ? "bg-zinc-100 text-zinc-900" : ""}`}
                aria-label={todoButtonLabel}
                aria-expanded={todoOpen}
                aria-controls="user-todo-rail"
                onClick={onOpenTodo}
              >
                <i className="fas fa-square-check text-lg" aria-hidden="true" />
                {showTodoBadge ? (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-semibold text-white">
                    {todoActiveCount > 99 ? "99+" : formatInteger(todoActiveCount)}
                  </span>
                ) : null}
              </button>
            </Tooltip>
          ) : null}
          <AdminPanelButton />
          <NotificationsMenu />
          <LanguageSwitcher variant="menu" />
        </div>
      </div>
    </header>
      <div
        className="h-[var(--app-topbar-height)] shrink-0"
        aria-hidden="true"
      />
    </>
  );
}
