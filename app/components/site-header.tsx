"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ListBadge } from "@/app/components/list-badge";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { DEFAULT_SITE_LOGO_COLOR } from "@/app/lib/site-admin/branding";

const AUTH_PATHS = new Set(["/login", "/signup", "/forgot-password"]);

export function SiteHeader({
  logoUrl = null,
  logoColor = DEFAULT_SITE_LOGO_COLOR,
  systemName = null,
}: {
  logoUrl?: string | null;
  logoColor?: string | null;
  systemName?: string | null;
}) {
  const pathname = usePathname();
  const { t } = useTranslations();
  const { user, isReady } = useAuthSession();
  const isAuthPage = AUTH_PATHS.has(pathname);
  const brandName = systemName?.trim() || t("app.name", "Routine");

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-900"
        >
          <ListBadge
            name={brandName}
            icon={null}
            color={logoColor || DEFAULT_SITE_LOGO_COLOR}
            logoUrl={logoUrl}
            size="md"
          />
          {brandName}
        </Link>

        {isAuthPage ? (
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="menu" />
            <Link
              href="/"
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              {t("site.back_home", "Uz sākumu")}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <LanguageSwitcher variant="menu" />
            {isReady && user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                {t("auth.open_app", "Atvērt lietotni")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  {t("auth.login.title", "Ienākt")}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                >
                  {t("auth.signup.title", "Reģistrēties")}
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
