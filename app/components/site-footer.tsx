"use client";

import Link from "next/link";
import { useCookieConsent } from "@/app/components/cookie-consent-context";
import { useTranslations } from "@/app/components/translations-provider";
import { localePath } from "@/app/lib/seo/locale-path";

export function SiteFooter({
  variant = "site",
}: {
  variant?: "site" | "app";
}) {
  const { t, languageCode } = useTranslations();
  const { openSettings } = useCookieConsent();
  const year = new Date().getFullYear();
  const isApp = variant === "app";

  return (
    <footer className={isApp ? "mt-auto" : undefined}>
      <div
        className={
          isApp
            ? "flex flex-col gap-3 py-4 pr-4 pl-[var(--app-content-inset-left)] sm:flex-row sm:items-center sm:justify-between md:pr-6"
            : "mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        }
      >
        <p className="text-sm text-zinc-500">
          {t("site.footer.rights", "© {year} {SYSTEM_NAME}", { year })}
        </p>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link
            href={localePath("/privacy", languageCode)}
            className="text-zinc-500 transition hover:text-zinc-900"
          >
            {t("legal.privacy.title", "Privātuma politika")}
          </Link>
          <Link
            href={localePath("/terms", languageCode)}
            className="text-zinc-500 transition hover:text-zinc-900"
          >
            {t("legal.terms.title", "Lietošanas noteikumi")}
          </Link>
          <Link
            href={localePath("/cookies", languageCode)}
            className="text-zinc-500 transition hover:text-zinc-900"
          >
            {t("legal.cookies.title", "Sīkdatņu politika")}
          </Link>
          <button
            type="button"
            onClick={openSettings}
            className="text-zinc-500 transition hover:text-zinc-900"
          >
            {t("cookie_consent.settings.title", "Sīkdatņu iestatījumi")}
          </button>
        </nav>
      </div>
    </footer>
  );
}
