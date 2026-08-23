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
      <section className="border-y border-zinc-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("landing.problem.title", "Darbs tagad ir izkaisīts")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {t(
              "landing.problem.subtitle",
              "Komandas plāno darbu tabulās, čatā, kalendāros un failu mapēs. Tad neviens nav drošs, kas ir aktuāls.",
            )}
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {PROBLEM_ITEMS.map((item) => (
              <li
                key={item.key}
                className="flex items-center gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-500 shadow-sm">
                  <i className={`${item.icon} text-sm`} aria-hidden="true" />
                </span>
                {t(item.key, item.fallback)}
              </li>
            ))}
          </ul>
          <div className="mt-8 max-w-3xl rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4">
            <p className="text-base leading-7 text-zinc-800">
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
        className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6"
        id="features"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("landing.features.title", "Viss, kas komandai vajadzīgs darba vadībai")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {t(
            "landing.features.subtitle",
            "Mazāk rīku, skaidrāka atbildība un darbs, ko var pabeigt, nevis tikai apspriest.",
          )}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {content.features.map((feature) => (
            <article
              key={feature.id}
              className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                  <i className={`${feature.icon} text-sm`} aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-zinc-900">
                  {t(feature.titleKey, feature.titleFallback)}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {t(feature.descriptionKey, feature.descriptionFallback, name)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200/80 bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("landing.audiences.title", "Veidots komandām, kurām jāpaveic darbs")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {t(
              "landing.audiences.subtitle",
              "Vienkārša darbvieta mazām komandām, aģentūrām un uzņēmumiem, kas aug.",
            )}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {AUDIENCES.map((audience) => (
              <article
                key={audience.titleKey}
                className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                  <i className={`${audience.icon} text-sm`} aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-base font-semibold text-zinc-900">
                  {t(audience.titleKey, audience.titleFallback)}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-zinc-500">
                  {t(audience.descriptionKey, audience.descriptionFallback)}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("landing.how.title", "No reģistrācijas līdz pirmajam pabeigtajam darbam")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {t(
            "landing.how.subtitle",
            "Trīs soļi. Komanda var sākt strādāt tajā pašā dienā.",
          )}
        </p>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.titleKey} className="flex gap-4">
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-sm font-semibold text-white">
                {index + 1}
              </span>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {t(step.titleKey, step.titleFallback)}
                </h3>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  {t(step.descriptionKey, step.descriptionFallback)}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-mt-20 border-y border-zinc-200/80 bg-white" id="faq">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("landing.faq.title", "Biežāk uzdotie jautājumi")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            {t(
              "landing.faq.subtitle",
              "Īsas atbildes par to, kas {name} ir un kam tas noder.",
              name,
            )}
          </p>
          <div className="mt-8 divide-y divide-zinc-200 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white">
            {faqItems.map((item) => (
              <details key={item.id} className="landing-faq-item group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
                  <h3 className="text-sm font-semibold">
                    {t(item.questionKey, item.questionFallback, name)}
                  </h3>
                  <i
                    className="fas fa-chevron-down text-xs text-zinc-400 transition group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-5 pb-4 text-sm leading-6 text-zinc-500">
                  {t(item.answerKey, item.answerFallback, name)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl bg-zinc-900 px-6 py-12 text-center text-white sm:px-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("landing.cta.title", "Sāc vadīt komandas darbu jau šodien")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-300">
            {t(
              "landing.cta.subtitle",
              "Reģistrējies, uzaicini komandu un izveido pirmo sarakstu. Bez instalēšanas un bez nedēļas ilgas ieviešanas.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href={signupHref}
              className="inline-flex min-h-11 items-center rounded-2xl bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              {t("landing.hero.cta_signup", "Sākt bez maksas")}
            </Link>
            <Link
              href={loginHref}
              className="inline-flex min-h-11 items-center rounded-2xl border border-zinc-600 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              {t("auth.login.title", "Ienākt")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
