"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { LanguageSwitcher } from "@/app/components/language-switcher";
import { ListBadge } from "@/app/components/list-badge";
import { useTranslations } from "@/app/components/translations-provider";
import { useAuthSession } from "@/app/lib/auth/use-auth-session";
import { localePath, stripLocalePrefix } from "@/app/lib/seo/locale-path";
import { DEFAULT_SITE_LOGO_COLOR } from "@/app/lib/site-admin/branding";
import { LANDING_REVEAL_EVENT } from "@/app/components/lazy-on-visible";
import { scrollToHashIdWhenReady } from "@/app/lib/smooth-scroll";

const AUTH_PATHS = new Set(["/login", "/signup", "/forgot-password"]);

export function SiteHeader({
  logoUrl = null,
  logoColor = DEFAULT_SITE_LOGO_COLOR,
  systemName = null,
  signupEnabled = false,
  showPricingNav = false,
}: {
  logoUrl?: string | null;
  logoColor?: string | null;
  systemName?: string | null;
  signupEnabled?: boolean;
  showPricingNav?: boolean;
}) {
  const pathname = usePathname();
  const { t, languageCode } = useTranslations();
  const { user, isReady } = useAuthSession();
  const isAuthPage = AUTH_PATHS.has(stripLocalePrefix(pathname));
  const brandName = systemName?.trim() || t("app.name", "{SYSTEM_NAME}");
  const homeHref = localePath("/", languageCode);
  const loginHref = localePath("/login", languageCode);
  const signupHref = localePath("/signup", languageCode);
  const onLanding = stripLocalePrefix(pathname) === "/";

  function onLandingHashClick(
    event: MouseEvent<HTMLAnchorElement>,
    id: string,
  ) {
    if (!onLanding) return;
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent.preventDefault();
    event.nativeEvent.stopImmediatePropagation();
    window.dispatchEvent(new Event(LANDING_REVEAL_EVENT));
    scrollToHashIdWhenReady(id, `${homeHref}#${id}`);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={homeHref}
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
              href={homeHref}
              className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              {t("site.back_home", "Uz sākumu")}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <nav className="mr-1 hidden items-center gap-1 sm:flex" aria-label={brandName}>
              <a
                href={`${homeHref}#features`}
                onClickCapture={(event) => onLandingHashClick(event, "features")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {t("site.nav.features", "Iespējas")}
              </a>
              {showPricingNav ? (
                <a
                  href={`${homeHref}#pricing`}
                  onClickCapture={(event) => onLandingHashClick(event, "pricing")}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
                >
                  {t("site.nav.pricing", "Cenas")}
                </a>
              ) : null}
              <a
                href={`${homeHref}#faq`}
                onClickCapture={(event) => onLandingHashClick(event, "faq")}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-900"
              >
                {t("site.nav.faq", "BUJ")}
              </a>
            </nav>
            <LanguageSwitcher variant="menu" />
            {isReady && user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500"
              >
                {t("auth.open_app", "Atvērt lietotni")}
              </Link>
            ) : (
              <>
                <Link
                  href={loginHref}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100"
                >
                  {t("auth.login.title", "Ienākt")}
                </Link>
                {signupEnabled ? (
                  <Link
                    href={signupHref}
                    className="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500"
                  >
                    {t("auth.signup.title", "Reģistrēties")}
                  </Link>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
