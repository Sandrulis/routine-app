import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveSystemName } from "@/app/lib/document-title";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import { resolveLandingFaqItems } from "@/app/lib/landing/faq";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { localePath } from "@/app/lib/seo/locale-path";
import { absoluteUrl } from "@/app/lib/seo/site-url";

export async function LandingJsonLd() {
  const [{ languageCode, t }, settings, enabledKeys] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
    getEnabledFrontendModuleKeys(),
  ]);
  const enabled = new Set(enabledKeys);
  const isEnabled = (moduleKey: string) => enabled.has(moduleKey);
  const systemName = resolveSystemName(settings.systemName, t("app.name", "{SYSTEM_NAME}"));
  const name = { name: systemName };
  const description = t(
    "landing.seo.description",
    "{name} is team task management software for small and growing teams. Plan tasks, projects and deadlines in one workspace.",
    name,
  );
  const url = absoluteUrl(localePath("/", languageCode));
  const faqItems = resolveLandingFaqItems(isEnabled).map((item) => ({
    "@type": "Question",
    name: t(item.questionKey, item.questionFallback, name),
    acceptedAnswer: {
      "@type": "Answer",
      text: t(item.answerKey, item.answerFallback, name),
    },
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: systemName,
        url: absoluteUrl("/"),
        ...(settings.logoUrl ? { logo: settings.logoUrl } : {}),
      },
      {
        "@type": "WebSite",
        name: systemName,
        url,
        description,
        inLanguage: languageCode,
        publisher: { "@type": "Organization", name: systemName, url: absoluteUrl("/") },
      },
      {
        "@type": "SoftwareApplication",
        additionalType: "https://schema.org/WebApplication",
        name: systemName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        description,
        inLanguage: languageCode,
      },
      {
        "@type": "FAQPage",
        mainEntity: faqItems,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
