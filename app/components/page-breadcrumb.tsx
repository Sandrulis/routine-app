"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, type ReactNode } from "react";
import { AdminPanelButton } from "@/app/components/admin-panel-button";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ListBadge } from "@/app/components/list-badge";
import { NotificationsMenu } from "@/app/components/notifications-menu";
import { useTranslations } from "@/app/components/translations-provider";
import { UserAvatar } from "@/app/components/user-avatar";
import { FileIcon } from "@/app/components/file-icon";
import { getTaskAncestors, workItemIcon } from "@/app/lib/lists";
import { useLists } from "@/app/lib/lists-store";
import { useListFiles } from "@/app/lib/use-list-files";
import { useTeam } from "@/app/lib/team-store";
import { useTemplates } from "@/app/lib/templates-store";

type Crumb = {
  href: string | null;
  label: string;
  icon?: ReactNode;
};

function CrumbIcon({ className }: { className: string }) {
  return <i className={`${className} text-[11px]`} aria-hidden="true" />;
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

export function PageBreadcrumb() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { lists, tasks, allTaskFiles, isReady: listsReady } = useLists();
  const { files, isReady: filesReady } = useListFiles();
  const { members, isReady: teamReady } = useTeam();
  const { templates, isReady: templatesReady } = useTemplates();
  const loadingLabel = t("common.loading", "Ielādē…");

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
              });
            }
            items.push({
              href: `/lists/${parts[1]}/tasks/${parent.id}`,
              label: parent.title,
              icon: <CrumbIcon className={workItemIcon(parent)} />,
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
          <AdminPanelButton />
          <NotificationsMenu />
          <LanguageSwitcher variant="menu" />
        </div>
      </div>
    </header>
  );
}
