"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "@/app/components/translations-provider";
import { useFrontendModules } from "@/app/lib/frontend-modules/context";
import { resolveLandingFaqItems } from "@/app/lib/landing/faq";
import { resolveLandingPageContent } from "@/app/lib/landing/features";
import { localePath } from "@/app/lib/seo/locale-path";

const STEPS = [
  {
    titleKey: "landing.how.step1.title",
    titleFallback: "Izveido kontu minūtēs",
    descriptionKey: "landing.how.step1.description",
    descriptionFallback:
      "Reģistrējies ar e-pastu. Nekādas instalēšanas, nekādu garu iestatījumu pirms pirmā saraksta.",
  },
  {
    titleKey: "landing.how.step2.title",
    titleFallback: "Saliec komandu un darbu",
    descriptionKey: "landing.how.step2.description",
    descriptionFallback:
      "Uzaicini komandas biedrus, izveido sarakstus projektiem vai klientiem un sadali uzdevumus ar termiņiem.",
  },
  {
    titleKey: "landing.how.step3.title",
    titleFallback: "Dari un redzi, kas gatavs",
    descriptionKey: "landing.how.step3.description",
    descriptionFallback:
      "Katru rītu atver Sākumu. Tur ir dienas bilde: kas vēl jādara, kas ir procesā un kas jau aizvērts.",
  },
] as const;

const PROBLEM_ITEMS = [
  {
    icon: "fas fa-table",
    key: "landing.problem.item_tables",
    fallback: "Excel un tabulas",
  },
  {
    icon: "fas fa-comments",
    key: "landing.problem.item_chat",
    fallback: "Čats",
  },
  {
    icon: "fas fa-calendar-days",
    key: "landing.problem.item_calendars",
    fallback: "Kalendāri",
  },
  {
    icon: "fas fa-folder-open",
    key: "landing.problem.item_files",
    fallback: "Failu mapes",
  },
  {
    icon: "fas fa-layer-group",
    key: "landing.problem.item_tools",
    fallback: "Vairāki uzdevumu rīki",
  },
] as const;

const AUDIENCES = [
  {
    icon: "fas fa-user-group",
    titleKey: "landing.audiences.small.title",
    titleFallback: "Mazas komandas",
    descriptionKey: "landing.audiences.small.description",
    descriptionFallback:
      "Kad darbs jāredz visiem, nevis jātur piezīmēs vai galvā.",
  },
  {
    icon: "fas fa-briefcase",
    titleKey: "landing.audiences.agencies.title",
    titleFallback: "Aģentūras",
    descriptionKey: "landing.audiences.agencies.description",
    descriptionFallback:
      "Klienti, projekti un termiņi vienā kokā, lai nekas nepazūd starp uzdevumiem.",
  },
  {
    icon: "fas fa-chart-line",
    titleKey: "landing.audiences.growing.title",
    titleFallback: "Augoši uzņēmumi",
    descriptionKey: "landing.audiences.growing.description",
    descriptionFallback:
      "Skaidri atbildīgie un statusi, kad komanda kļūst lielāka.",
  },
  {
    icon: "fas fa-globe",
    titleKey: "landing.audiences.remote.title",
    titleFallback: "Attālinātas komandas",
    descriptionKey: "landing.audiences.remote.description",
    descriptionFallback:
      "Viena darbvieta, lai darbs nav izkaisīts pa čatiem dažādās joslās.",
  },
] as const;

export function LandingBelowFold({ productName }: { productName: string }) {
  const { t, languageCode } = useTranslations();
  const { isEnabled } = useFrontendModules();
  const content = useMemo(
    () => resolveLandingPageContent(isEnabled),
    [isEnabled],
  );
  const faqItems = useMemo(
    () => resolveLandingFaqItems(isEnabled),
    [isEnabled],
  );
  const name = { name: productName };
  const signupHref = localePath("/signup", languageCode);
  const loginHref = localePath("/login", languageCode);

  return (
    <div className="landing-lazy-section">
      <section className="border-t border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            {t("landing.problem.title", "Darbs tagad ir izkaisīts")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {t(
              "landing.problem.subtitle",
              "Komandas plāno darbu tabulās, čatā, kalendāros un failu mapēs. Tad neviens nav drošs, kas ir aktuāls.",
            )}
          </p>
          <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-5">
            {PROBLEM_ITEMS.map((item) => (
              <li
                key={item.key}
                className="flex flex-col items-start gap-3 rounded-4xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm font-medium text-zinc-700 sm:flex-row sm:items-center lg:flex-col lg:items-start"
              >
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/70 bg-white text-zinc-400 shadow-sm">
                  <i className={`${item.icon} text-sm`} aria-hidden="true" />
                </span>
                {t(item.key, item.fallback)}
              </li>
            ))}
          </ul>
          <div className="mt-10 max-w-3xl rounded-4xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-white px-6 py-5 shadow-sm">
            <p className="text-base leading-7 font-medium text-zinc-800 sm:text-lg">
              {t(
                "landing.problem.solution",
                "{name} savieno uzdevumus, projektus, cilvēkus, failus, termiņus un darbplūsmas vienā darbvietā.",
                name,
              )}
            </p>
          </div>
        </div>
      </section>

      <section
        className="scroll-mt-20 border-y border-zinc-200/80 bg-zinc-50"
        id="features"
      >
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            {t("landing.features.title", "Viss, kas komandai vajadzīgs darba vadībai")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {t(
              "landing.features.subtitle",
              "Mazāk rīku, skaidrāka atbildība un darbs, ko var pabeigt, nevis tikai apspriest.",
            )}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {content.features.map((feature) => (
              <article
                key={feature.id}
                className="rounded-4xl border border-zinc-200/70 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300/70 hover:shadow-lg hover:shadow-emerald-600/10 sm:p-6"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-600/20 sm:size-11">
                    <i className={`${feature.icon} text-sm`} aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">
                    {t(feature.titleKey, feature.titleFallback)}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {t(feature.descriptionKey, feature.descriptionFallback, name)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            {t("landing.audiences.title", "Veidots komandām, kurām jāpaveic darbs")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {t(
              "landing.audiences.subtitle",
              "Vienkārša darbvieta mazām komandām, aģentūrām un uzņēmumiem, kas aug.",
            )}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {AUDIENCES.map((audience) => (
              <article
                key={audience.titleKey}
                className="rounded-4xl border border-zinc-200/70 bg-zinc-50/70 p-4 transition duration-200 hover:-translate-y-1 hover:border-emerald-300/70 hover:bg-white hover:shadow-lg hover:shadow-emerald-600/10 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 sm:size-11">
                    <i className={`${audience.icon} text-sm`} aria-hidden="true" />
                  </span>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {t(audience.titleKey, audience.titleFallback)}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {t(audience.descriptionKey, audience.descriptionFallback)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-emerald-100 bg-gradient-to-b from-emerald-50/70 via-emerald-50/30 to-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            {t("landing.how.title", "No reģistrācijas līdz pirmajam pabeigtajam darbam")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {t(
              "landing.how.subtitle",
              "Trīs soļi. Komanda var sākt strādāt tajā pašā dienā.",
            )}
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article
                key={step.titleKey}
                className="rounded-4xl border border-emerald-100 bg-white/80 p-6 shadow-sm backdrop-blur-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300/70 hover:bg-white hover:shadow-lg hover:shadow-emerald-600/10"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-base font-bold text-white shadow-md shadow-emerald-600/20">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold text-zinc-900 sm:text-lg">
                    {t(step.titleKey, step.titleFallback)}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-6 text-zinc-600">
                  {t(step.descriptionKey, step.descriptionFallback)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-20 bg-white" id="faq">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-balance text-zinc-900 sm:text-4xl">
            {t("landing.faq.title", "Biežāk uzdotie jautājumi")}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
            {t(
              "landing.faq.subtitle",
              "Īsas atbildes par to, kas {name} ir un kam tas noder.",
              name,
            )}
          </p>
          <div className="mt-10 grid gap-3">
            {faqItems.map((item) => (
              <details
                key={item.id}
                className="landing-faq-item group rounded-4xl border border-zinc-200/70 bg-zinc-50/70 transition open:border-emerald-200 open:bg-white open:shadow-lg open:shadow-emerald-600/10 hover:border-zinc-300"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-zinc-900 sm:px-6">
                  <h3 className="text-sm font-semibold sm:text-base">
                    {t(item.questionKey, item.questionFallback, name)}
                  </h3>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition group-open:border-emerald-200 group-open:bg-emerald-50 group-open:text-emerald-600">
                    <i
                      className="fas fa-chevron-down text-xs transition group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </span>
                </summary>
                <p className="px-5 pb-5 text-sm leading-6 text-zinc-600 sm:px-6">
                  {t(item.answerKey, item.answerFallback, name)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200/80 bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="relative overflow-hidden rounded-4xl bg-zinc-900 px-6 py-14 text-center text-white shadow-2xl shadow-zinc-900/20 sm:px-10">
            <div
              className="pointer-events-none absolute -top-24 left-1/2 size-96 -translate-x-1/2 rounded-full bg-emerald-500/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                {t("landing.cta.title", "Sāc vadīt komandas darbu jau šodien")}
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-zinc-300">
                {t(
                  "landing.cta.subtitle",
                  "Reģistrējies, uzaicini komandu un izveido pirmo sarakstu. Bez instalēšanas un bez nedēļas ilgas ieviešanas.",
                )}
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href={signupHref}
                  className="inline-flex min-h-12 items-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-300 hover:to-emerald-500 hover:shadow-xl hover:shadow-emerald-500/40"
                >
                  {t("landing.hero.cta_signup", "Sākt bez maksas")}
                </Link>
                <Link
                  href={loginHref}
                  className="inline-flex min-h-12 items-center rounded-2xl border border-zinc-600 px-6 text-sm font-semibold text-white transition hover:border-zinc-500 hover:bg-zinc-800"
                >
                  {t("auth.login.title", "Ienākt")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
