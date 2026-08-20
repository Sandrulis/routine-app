"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "@/app/components/translations-provider";

const GROUPS = [
  {
    id: "people",
    icon: "fas fa-users",
    labelKey: "admin.nav.group.people",
    fallback: "Cilvēki",
    items: [
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
    ],
  },
  {
    id: "catalog",
    icon: "fas fa-layer-group",
    labelKey: "admin.nav.group.catalog",
    fallback: "Katalogs",
    items: [
      {
        href: "/admin/statuses",
        icon: "fas fa-circle-half-stroke",
        labelKey: "admin.nav.statuses",
        fallback: "Statusi",
      },
      {
        href: "/admin/file-types",
        icon: "fas fa-file-lines",
        labelKey: "admin.nav.file_types",
        fallback: "Failu tipi",
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
    ],
  },
  {
    id: "system",
    icon: "fas fa-cog",
    labelKey: "admin.nav.group.system",
    fallback: "Sistēma",
    items: [
      {
        href: "/admin/modules",
        icon: "fas fa-puzzle-piece",
        labelKey: "nav.modules",
        fallback: "Moduļi",
      },
      {
        href: "/admin/payment-plans",
        icon: "fas fa-credit-card",
        labelKey: "admin.nav.payment_plans",
        fallback: "Maksas plāni",
      },
      {
        href: "/admin/integrations",
        icon: "fas fa-plug",
        labelKey: "admin.nav.integrations",
        fallback: "Integrācijas",
      },
      {
        href: "/admin/settings",
        icon: "fas fa-sliders",
        labelKey: "nav.settings",
        fallback: "Uzstādījumi",
      },
    ],
  },
] as const;

function itemIsActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSubmenu() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const navRef = useRef<HTMLElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function cancelClose() {
    if (closeTimerRef.current == null) return;
    window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }

  function openGroup(id: string) {
    cancelClose();
    setOpenId(id);
  }

  function scheduleClose() {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setOpenId(null), 140);
  }

  useEffect(() => () => cancelClose(), []);

  useEffect(() => {
    setOpenId(null);
  }, [pathname]);

  useEffect(() => {
    if (!openId) return;

    function handlePointerDown(event: PointerEvent) {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setOpenId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openId]);

  return (
    <nav
      ref={navRef}
      aria-label={t("admin.nav.label", "Administrācijas sadaļas")}
      className="inline-flex flex-wrap items-center gap-0.5 rounded-xl bg-zinc-50 p-1"
    >
      {GROUPS.map((group, groupIndex) => {
        const groupActive = group.items.some((item) =>
          itemIsActive(pathname, item.href),
        );
        const open = openId === group.id;
        const alignEnd = groupIndex === GROUPS.length - 1;

        return (
          <div
            key={group.id}
            className="relative"
            onMouseEnter={() => openGroup(group.id)}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => {
                const canHover = window.matchMedia(
                  "(hover: hover) and (pointer: fine)",
                ).matches;
                if (canHover) {
                  openGroup(group.id);
                  return;
                }
                setOpenId((current) => (current === group.id ? null : group.id));
              }}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                open || groupActive
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80"
                  : "text-zinc-500 hover:bg-white/70 hover:text-zinc-800"
              }`}
            >
              <span
                className={`inline-flex size-5 items-center justify-center rounded-md text-[10px] ${
                  open || groupActive
                    ? "bg-sky-100 text-sky-700"
                    : "bg-zinc-200/70 text-zinc-400"
                }`}
              >
                <i className={group.icon} aria-hidden="true" />
              </span>
              {t(group.labelKey, group.fallback)}
              <i
                className={`fas fa-chevron-down text-[9px] text-zinc-400 transition ${
                  open ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>

            {open ? (
              <div
                className={`absolute top-full z-[70] pt-1.5 ${
                  alignEnd ? "right-0" : "left-0"
                }`}
              >
                <div
                  role="menu"
                  className="min-w-[13.5rem] overflow-hidden rounded-xl bg-white py-1 shadow-[0_12px_40px_rgba(15,23,42,0.16)] ring-1 ring-zinc-200/80"
                >
                  {group.items.map((item) => {
                    const active = itemIsActive(pathname, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch={false}
                        role="menuitem"
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 px-3 py-2 text-sm transition hover:bg-zinc-100 ${
                          active ? "bg-sky-50 font-medium text-zinc-900" : "text-zinc-600"
                        }`}
                      >
                        <span
                          className={`inline-flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] ${
                            active
                              ? "bg-sky-100 text-sky-700"
                              : "bg-zinc-100 text-zinc-400"
                          }`}
                        >
                          <i className={item.icon} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          {t(item.labelKey, item.fallback)}
                        </span>
                        {active ? (
                          <i
                            className="fas fa-check text-[10px] text-sky-600"
                            aria-hidden="true"
                          />
                        ) : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}
