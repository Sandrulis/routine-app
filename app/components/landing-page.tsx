"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { LandingBelowFold } from "@/app/components/landing-below-fold";
import { LANDING_REVEAL_EVENT } from "@/app/components/lazy-on-visible";
import { useTranslations } from "@/app/components/translations-provider";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { resolveLandingPageContent } from "@/app/lib/landing/features";
import type { LandingPricingData } from "@/app/lib/landing/pricing";
import { localePath } from "@/app/lib/seo/locale-path";
import { scrollToHashIdWhenReady } from "@/app/lib/smooth-scroll";

const LandingAppPreview = dynamic(
  () =>
    import("@/app/components/landing-app-preview").then((mod) => ({
      default: mod.LandingAppPreview,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="min-h-[320px] animate-pulse rounded-4xl border border-zinc-200 bg-white/80"
        aria-hidden="true"
      />
    ),
  },
);

function revealLandingHash(id: string) {
  if (id === "features" || id === "pricing" || id === "faq") {
    window.dispatchEvent(new Event(LANDING_REVEAL_EVENT));
  }
}

export function LandingPage({
  productName,
  pricing = null,
}: {
  productName: string;
  pricing?: LandingPricingData | null;
}) {
  const { t, languageCode } = useTranslations();
  const { isEnabled } = useFrontendModules();
  const content = useMemo(
    () => resolveLandingPageContent(isEnabled),
    [isEnabled],
  );
  const name = { name: productName };
  const signupHref = localePath("/signup", languageCode);

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) return;
    revealLandingHash(id);
    const frame = window.requestAnimationFrame(() => {
      scrollToHashIdWhenReady(id);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-white to-zinc-50">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -left-16 size-72 rounded-full bg-emerald-100/70 blur-3xl" />
          <div className="absolute top-16 right-0 size-96 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-teal-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)] lg:gap-16 lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-wide text-emerald-700 uppercase">
              <span className="landing-online-dot size-1.5 rounded-full bg-emerald-500" />
              {t("landing.hero.kicker", "Komandas uzdevumu pārvaldība")}
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-bold tracking-tight text-balance text-zinc-900 sm:text-5xl lg:text-6xl lg:leading-[1.05]">
              {t(
                "landing.hero.title",
                "Vienkārša komandas uzdevumu pārvaldība mūsdienīgām komandām",
              )}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-zinc-600">
              {t(
                "landing.hero.subtitle",
                "{name} palīdz visai komandai redzēt sarakstus, uzdevumus un cilvēkus vienā darbvietā — ar statusu, termiņiem un atbildīgajiem, nevis tabulās un čatā.",
                name,
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={signupHref}
                className="inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/30"
              >
                {t("landing.hero.cta_signup", "Sākt bez maksas")}
              </Link>
              <a
                href="#features"
                onClick={(event) => {
                  event.preventDefault();
                  revealLandingHash("features");
                  scrollToHashIdWhenReady("features");
                }}
                className="inline-flex min-h-12 items-center rounded-2xl border border-zinc-200 bg-white px-6 text-sm font-semibold text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                {t("landing.hero.cta_how", "Skatīt, kā tas darbojas")}
              </a>
            </div>
            <p className="mt-5 inline-flex items-center gap-2 text-sm text-zinc-500">
              <i className="fas fa-circle-check text-emerald-500" aria-hidden="true" />
              {t("landing.hero.trust", "Bez instalēšanas. Sāc ar e-pastu.")}
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              <div className="border-l-2 border-emerald-500 pl-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {t("landing.hero.stat_status_title", "Darāms, procesā, gatavs")}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {t(
                    "landing.hero.stat_status",
                    "Viena tāfele visai dienai, nevis pieci rīki.",
                  )}
                </p>
              </div>
              <div className="border-l-2 border-emerald-500 pl-4">
                <p className="text-sm font-semibold text-zinc-900">
                  {t("landing.hero.stat_together_title", "Cilvēki pie darba")}
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {t(content.heroTogether.key, content.heroTogether.fallback)}
                </p>
              </div>
            </div>
          </div>

          <div className="relative pb-10 lg:pb-6">
            <div
              className="pointer-events-none absolute -inset-8 rounded-full bg-emerald-400/20 blur-3xl"
              aria-hidden="true"
            />
            <div className="landing-preview-tilt relative">
              <LandingAppPreview />
            </div>
          </div>
        </div>
      </section>

      <LandingBelowFold productName={productName} pricing={pricing} />
    </div>
  );
}
