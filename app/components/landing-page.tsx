"use client";

import Link from "next/link";
import { LandingAppPreview } from "@/app/components/landing-app-preview";
import { useTranslations } from "@/app/components/translations-provider";

const FEATURES = [
  {
    icon: "fas fa-list-ul",
    titleKey: "landing.features.lists.title",
    titleFallback: "Saraksti, kas atbilst tavam darbam",
    descriptionKey: "landing.features.lists.description",
    descriptionFallback:
      "Projekti, klienti, mapes un faili vienā kokā. Katram uzdevumam ir statuss, termiņš un atbildīgais, nevis vēl viena izklājlapa.",
  },
  {
    icon: "fas fa-users",
    titleKey: "landing.features.team.title",
    titleFallback: "Visa komanda redz to pašu",
    descriptionKey: "landing.features.team.description",
    descriptionFallback:
      "Uzaicini biedrus, piešķir darbus un zini, kas ir tiešsaistē. Nav jāmeklē čatā, kur palika fails vai kurš ko sola.",
  },
  {
    icon: "fas fa-table-columns",
    titleKey: "landing.features.dashboard.title",
    titleFallback: "Sākums ir dienas tāfele",
    descriptionKey: "landing.features.dashboard.description",
    descriptionFallback:
      "Atverot Routine, redzi darāmo, procesā un gatavo. Vilc kartītes un turi fokusu uz to, kas jāpabeidz šodien.",
  },
] as const;

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
      "Uzaicini biedrus, izveido sarakstus projektiem vai klientiem un sadali uzdevumus ar termiņiem.",
  },
  {
    titleKey: "landing.how.step3.title",
    titleFallback: "Dari un redzi, kas gatavs",
    descriptionKey: "landing.how.step3.description",
    descriptionFallback:
      "Katru rītu atver Sākumu. Tur ir dienas bilde: kas vēl jādara, kas ir procesā un kas jau aizvērts.",
  },
] as const;

export function LandingPage() {
  const { t } = useTranslations();

  return (
    <div>
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -top-24 -left-16 size-72 rounded-full bg-orange-100/70 blur-3xl" />
          <div className="absolute top-20 right-0 size-80 rounded-full bg-emerald-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 size-64 rounded-full bg-sky-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-wide text-zinc-500 uppercase">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {t("landing.hero.kicker", "Komandas darba rīks")}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-zinc-900 sm:text-5xl">
              {t("landing.hero.title", "Visa komanda zina, kas jādara šodien")}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-7 text-zinc-500">
              {t(
                "landing.hero.subtitle",
                "Routine savāc sarakstus, uzdevumus un cilvēkus vienā vietā. Redzi statusu, termiņus un atbildīgos bez izklājlapām un čata haosa.",
              )}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex min-h-11 items-center rounded-2xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
              >
                {t("landing.hero.cta_signup", "Izmēģināt bez maksas")}
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center rounded-2xl border border-zinc-200 bg-white/80 px-5 text-sm font-semibold text-zinc-800 transition hover:bg-white"
              >
                {t("auth.login.title", "Ienākt")}
              </Link>
            </div>

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
                  {t(
                    "landing.hero.stat_together",
                    "Atbildīgais, termiņš un fails paliek pie uzdevuma.",
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="pb-10 lg:pb-6">
            <LandingAppPreview />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {t("landing.features.title", "Kāpēc komandas paliek Routine")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
          {t(
            "landing.features.subtitle",
            "Mazāk rīku, skaidrāka atbildība un darbs, ko var pabeigt, nevis tikai apspriest.",
          )}
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              key={feature.titleKey}
              className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-sm"
            >
              <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-600">
                <i className={`${feature.icon} text-sm`} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-zinc-900">
                {t(feature.titleKey, feature.titleFallback)}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {t(feature.descriptionKey, feature.descriptionFallback)}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200/80 bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-3xl bg-zinc-900 px-6 py-12 text-center text-white sm:px-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t("landing.cta.title", "Pārtrauc darbu turēt galvā")}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-zinc-300">
            {t(
              "landing.cta.subtitle",
              "Reģistrējies, uzaicini komandu un izveido pirmo sarakstu. Bez instalēšanas un bez nedēļas ilgas ieviešanas.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex min-h-11 items-center rounded-2xl bg-white px-5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
            >
              {t("landing.hero.cta_signup", "Izmēģināt bez maksas")}
            </Link>
            <Link
              href="/login"
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
