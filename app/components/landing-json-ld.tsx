import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveSystemName } from "@/app/lib/document-title";
import { getEnabledFrontendModuleKeys } from "@/app/lib/frontend-modules/repository";
import { resolveLandingFaqItems } from "@/app/lib/landing/faq";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { htmlLang, localePath } from "@/app/lib/seo/locale-path";
import { OG_IMAGE_PATH, OG_IMAGE_SIZE } from "@/app/lib/seo/share-image";
import { absoluteUrl } from "@/app/lib/seo/site-url";

function httpUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : null;
}

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
  const homeUrl = absoluteUrl("/");
  const url = absoluteUrl(localePath("/", languageCode));
  const language = htmlLang(languageCode);
  const logoUrl = httpUrl(settings.logoUrl) ?? absoluteUrl(OG_IMAGE_PATH);
  const organizationId = `${homeUrl}#organization`;
  const websiteId = `${url}#website`;
  const faqItems = resolveLandingFaqItems(isEnabled).map((item) => ({
    "@type": "Question",
    name: t(item.questionKey, item.questionFallback, name),
    acceptedAnswer: {
      "@type": "Answer",
      text: t(item.answerKey, item.answerFallback, name),
    },
  }));

  const organization = {
    "@type": "Organization",
    "@id": organizationId,
    name: systemName,
    url: homeUrl,
    logo: {
      "@type": "ImageObject",
      url: logoUrl,
      width: OG_IMAGE_SIZE.width,
      height: OG_IMAGE_SIZE.height,
    },
    image: logoUrl,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organization,
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: systemName,
        url,
        description,
        inLanguage: language,
        publisher: { "@id": organizationId },
      },
      {
        "@type": "SoftwareApplication",
        additionalType: "https://schema.org/WebApplication",
        name: systemName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        description,
        inLanguage: language,
        publisher: { "@id": organizationId },
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
