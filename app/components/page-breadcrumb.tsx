"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { ListBadge } from "@/app/components/list-badge";
import { NotificationsMenu } from "@/app/components/notifications-menu";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { fileIconClassName } from "@/app/lib/list-files";
import { getTaskAncestors, isWorkFolder, isWorkSubtask } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";

type Crumb = {
  href: string | null;
  label: string;
  icon?: ReactNode;
};

function CrumbIcon({ className }: { className: string }) {
  return <i className={`${className} text-[11px]`} aria-hidden="true" />;
}

export function PageBreadcrumb() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { lists, tasks } = useLists();
  const files = useListFiles();
  const { members } = useTeam();

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
          label: list?.name ?? t("lists.detail.missing", "Saraksts nav atrasts"),
          icon: list ? (
            <ListBadge name={list.name} icon={list.icon} color={list.color} />
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
              icon: (
                <CrumbIcon
                  className={
                    ancestor.kind === "folder" ? "far fa-folder" : "fas fa-list-check"
                  }
                />
              ),
            });
          }
        }
        items.push({
          href: `/lists/${parts[1]}/tasks/${parts[3]}`,
          label: task?.title ?? t("tasks.detail.missing", "Uzdevums nav atrasts"),
          icon: (
            <CrumbIcon
              className={
                task && isWorkSubtask(task)
                  ? "far fa-circle"
                  : task && isWorkFolder(task)
                    ? "far fa-folder"
                    : "fas fa-list-check"
              }
            />
          ),
        });
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
                icon: (
                  <CrumbIcon
                    className={
                      ancestor.kind === "folder" ? "far fa-folder" : "fas fa-list-check"
                    }
                  />
                ),
              });
            }
            items.push({
              href: `/lists/${parts[1]}/tasks/${parent.id}`,
              label: parent.title,
              icon: (
                <CrumbIcon
                  className={
                    isWorkFolder(parent) ? "far fa-folder" : "fas fa-list-check"
                  }
                />
              ),
            });
          }
        }
        items.push({
          href: `/lists/${parts[1]}/files/${parts[3]}`,
          label: file?.name ?? t("files.detail.missing", "Fails nav atrasts"),
          icon: (
            <CrumbIcon
              className={file ? fileIconClassName(file.name) : "fas fa-file"}
            />
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
      if (parts[1]) {
        const member = members.find((item) => item.id === parts[1]);
        items.push({
          href: `/team/${parts[1]}`,
          label: member?.name ?? t("team.detail.missing", "Biedrs nav atrasts"),
          icon: member ? (
            <UserAvatar member={member} size="xs" />
          ) : (
            <CrumbIcon className="fas fa-user" />
          ),
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

    return [
      {
        href: pathname,
        label: t("nav.home", "Sākums"),
        icon: <CrumbIcon className="fas fa-house" />,
      },
    ];
  }, [files, lists, members, pathname, t, tasks]);

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 py-2.5 pr-4 pl-[var(--app-content-inset-left)] backdrop-blur-sm md:pr-6">
      <div className="flex items-center justify-between gap-3">
        <nav aria-label={t("breadcrumb.label", "Ceļš")} className="min-w-0">
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
                  {isCurrent ? (
                    <span className="flex min-w-0 items-center gap-1.5 font-semibold text-zinc-900">
                      {crumb.icon ? (
                        <span className="inline-flex size-5 shrink-0 items-center justify-center text-zinc-500">
                          {crumb.icon}
                        </span>
                      ) : null}
                      <span className="truncate">{crumb.label}</span>
                    </span>
                  ) : crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-zinc-400 transition hover:text-zinc-700"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate text-zinc-400">{crumb.label}</span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
        <NotificationsMenu />
      </div>
    </header>
  );
}
