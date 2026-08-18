"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "@/app/components/translations-provider";

const ITEMS = [
  {
    href: "/admin/users",
    icon: "fas fa-user-group",
    labelKey: "admin.nav.users",
    fallback: "Lietotāji",
  },
  {
    href: "/admin/teams",
    icon: "fas fa-users",
    labelKey: "admin.nav.teams",
    fallback: "Komandas",
  },
  {
    href: "/admin/roles",
    icon: "fas fa-user-tag",
    labelKey: "admin.nav.roles",
    fallback: "Lomas",
  },
  {
    href: "/admin/statuses",
    icon: "fas fa-circle-half-stroke",
    labelKey: "admin.nav.statuses",
    fallback: "Statusi",
  },
  {
    href: "/admin/languages",
    icon: "fas fa-language",
    labelKey: "admin.nav.languages",
    fallback: "Valodas",
  },
  {
    href: "/admin/translations",
    icon: "fas fa-globe",
    labelKey: "admin.nav.translations",
    fallback: "Tulkojumi",
  },
  {
    href: "/admin/settings",
    icon: "fas fa-sliders",
    labelKey: "nav.settings",
    fallback: "Uzstādījumi",
  },
] as const;

export function AdminSubmenu() {
  const pathname = usePathname();
  const { t } = useTranslations();

  return (
    <nav
      aria-label={t("admin.nav.label", "Administrācijas sadaļas")}
      className="flex flex-wrap gap-1 rounded-2xl border border-zinc-200 bg-white p-1.5 shadow-sm"
    >
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
            }`}
          >
            <i className={`${item.icon} text-xs`} aria-hidden="true" />
            {t(item.labelKey, item.fallback)}
          </Link>
        );
      })}
    </nav>
  );
}
