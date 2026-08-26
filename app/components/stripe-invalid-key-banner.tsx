"use client";

import Link from "next/link";
import { useTranslations } from "@/app/components/translations-provider";
import { useIsAdmin } from "@/app/lib/users/use-is-admin";

export function StripeInvalidKeyBanner({ visible }: { visible: boolean }) {
  const { t } = useTranslations();
  const { isAdmin, isReady } = useIsAdmin();

  if (!visible || !isReady || !isAdmin) return null;

  return (
    <div className="px-4 pt-4 pl-[var(--app-content-inset-left)] md:pr-6">
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600"
      >
        <p className="min-w-0 flex-1">
          {t(
            "errors.integrations_stripe_invalid_key",
            "Stripe atslēga nav derīga. Administrators to labo Integrācijās.",
          )}
        </p>
        <Link
          href="/admin/integrations"
          className="shrink-0 font-medium text-zinc-800 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-500"
        >
          {t("admin.nav.integrations", "Integrācijas")}
        </Link>
      </div>
    </div>
  );
}
