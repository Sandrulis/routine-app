"use client";

import { useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  LANDING_REVEAL_EVENT,
  LazyOnVisible,
} from "@/app/components/lazy-on-visible";
import { useTranslations } from "@/app/components/translations-provider";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { resolveLandingPageContent } from "@/app/lib/landing/features";
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
        className="min-h-[320px] animate-pulse rounded-3xl border border-zinc-200 bg-white/80"
        aria-hidden="true"
      />
    ),
  },
);

function BelowFoldSkeleton() {
  return (
    <div
      className="landing-lazy-section min-h-[480px] animate-pulse bg-zinc-100/80"
      aria-hidden="true"
    />
  );
}

const LandingBelowFold = dynamic(
  () =>
    import("@/app/components/landing-below-fold").then((mod) => ({
      default: mod.LandingBelowFold,
    })),
  { ssr: true, loading: () => <BelowFoldSkeleton /> },
);

function revealLandingHash(id: string) {
  if (id === "features" || id === "faq") {
    window.dispatchEvent(new Event(LANDING_REVEAL_EVENT));
  }
}

export function LandingPage({ productName }: { productName: string }) {
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
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -top-24 -left-16 size-72 rounded-full bg-orange-100/70 blur-3xl" />
          <div className="absolute top-20 right-0 size-80 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-sky-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t("landing.hero.kicker", "Komandas uzdevumu pārvaldība")}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance text-zinc-900 sm:text-5xl">
              {t(
                "landing.hero.title",
                "Vienkārša komandas uzdevumu pārvaldība mūsdienīgām komandām",
              )}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-7 text-zinc-500">
              {t(
                "landing.hero.subtitle",
                "{name} palīdz visai komandai redzēt sarakstus, uzdevumus un cilvēkus vienā darbvietā — ar statusu, termiņiem un atbildīgajiem, nevis tabulās un čatā.",
                name,
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={signupHref}
                className="inline-flex min-h-11 items-center rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
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
                className="inline-flex min-h-11 items-center rounded-2xl border border-zinc-200 bg-white/80 px-5 text-sm font-semibold text-zinc-800 transition hover:bg-white"
              >
                {t("landing.hero.cta_how", "Skatīt, kā tas darbojas")}
              </a>
            </div>
            <p className="mt-4 text-sm text-zinc-400">
              {t("landing.hero.trust", "Bez instalēšanas. Sāc ar e-pastu.")}
            </p>

            <div className="mt-10 flex flex-wrap gap-6 text-sm">
              <div>
                <p className="font-semibold text-zinc-900">
                  {t("landing.hero.stat_status_title", "Darāms, procesā, gatavs")}
                </p>
                <p className="mt-0.5 text-zinc-500">
                  {t(
                    "landing.hero.stat_status",
                    "Viena tāfele visai dienai, nevis pieci rīki.",
                  )}
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-900">
                  {t("landing.hero.stat_together_title", "Cilvēki pie darba")}
                </p>
                <p className="mt-0.5 text-zinc-500">
                  {t(content.heroTogether.key, content.heroTogether.fallback)}
                </p>
              </div>
            </div>
          </div>

          <div className="pb-10 lg:pb-6">
            <LandingAppPreview />
          </div>
        </div>
      </section>

      <LazyOnVisible fallback={<BelowFoldSkeleton />}>
        <LandingBelowFold productName={productName} />
      </LazyOnVisible>
    </div>
  );
}
