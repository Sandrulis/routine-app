import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LandingPage } from "@/app/components/landing-page";
import { LandingJsonLd } from "@/app/components/landing-json-ld";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { resolveSystemName } from "@/app/lib/document-title";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { shouldShowLandingPricing } from "@/app/lib/landing/pricing";
import {
  getEarlyBirdSettings,
  getPaymentPlansEnabledCached,
  getTrialSettings,
  isEarlyBirdOfferAvailable,
  listPaymentPlansCached,
  remainingEarlyBirdSeats,
} from "@/app/lib/payment-plans/repository";
import { canonicalMetadata } from "@/app/lib/seo/metadata";
import { isCrawlerUserAgent } from "@/app/lib/seo/crawler";
import { getSiteSettings } from "@/app/lib/site-admin/repository";

export async function generateMetadata(): Promise<Metadata> {
  const [{ t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const productName = resolveSystemName(settings.systemName, t("app.name", "{SYSTEM_NAME}"));
  const name = { name: productName };
  return canonicalMetadata("/", {
    titleAbsolute: t(
      "landing.seo.title",
      "{name} — vienkārša komandas uzdevumu pārvaldība",
      name,
    ),
    description: t(
      "landing.seo.meta_description",
      "{name}: komandas uzdevumi, projekti un termiņi vienā darbvietā. Skaidri statusi un atbildīgie. Sāc bez maksas — bez instalēšanas.",
      name,
    ),
    ogDescription: t(
      "landing.seo.description",
      "{name} ir komandas uzdevumu pārvaldības rīks mazām un augošām komandām. Plāno uzdevumus, projektus un termiņus vienā darbvietā — bez liekas sarežģītības.",
      name,
    ),
  });
}

export default async function HomePage() {
  const [user, { t }, settings, paymentPlansEnabled, plans, earlyBird, trial] =
    await Promise.all([
      getCurrentUser(),
      getServerTranslations(),
      getSiteSettings(),
      getPaymentPlansEnabledCached(),
      listPaymentPlansCached(),
      getEarlyBirdSettings(),
      getTrialSettings(),
    ]);
  if (user && !isCrawlerUserAgent((await headers()).get("user-agent"))) {
    redirect("/dashboard");
  }

  const productName = resolveSystemName(settings.systemName, t("app.name", "{SYSTEM_NAME}"));
  const showPricing = shouldShowLandingPricing(paymentPlansEnabled, plans);

  return (
    <>
      <LandingJsonLd />
      <LandingPage
        productName={productName}
        pricing={
          showPricing
            ? {
                plans,
                earlyBirdAvailable: isEarlyBirdOfferAvailable(earlyBird),
                earlyBirdRemaining: remainingEarlyBirdSeats(earlyBird),
                earlyBirdLimit: earlyBird.limit,
                trialPlanId: trial.trialPlanId,
                trialDays: trial.trialDays,
              }
            : null
        }
      />
    </>
  );
}
