"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { OptionalTooltip } from "@/app/components/tooltip";
import { useTranslations } from "@/app/components/translations-provider";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function AdminPanelButton() {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { isAdmin } = useIsAdmin();
  const label = t("admin.panel.title", "Administrācijas panelis");
  const active = pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAdmin) return null;

  return (
    <OptionalTooltip label={label}>
      <Link
        href="/admin"
        prefetch={false}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`inline-flex size-8 items-center justify-center rounded-md text-zinc-500 transition ${
          active ? "bg-zinc-100 text-zinc-800" : "hover:bg-zinc-100 hover:text-zinc-800"
        }`}
      >
        <i className="fas fa-users-cog text-[14px]" aria-hidden="true" />
      </Link>
    </OptionalTooltip>
  );
}
