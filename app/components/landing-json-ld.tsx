import { getServerTranslations } from "@/app/lib/i18n/server";
import { resolveSystemName } from "@/app/lib/document-title";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { absoluteUrl } from "@/app/lib/seo/site-url";

export async function LandingJsonLd() {
  const [{ languageCode, t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName, t("app.name", "Routine"));
  const description =
    settings.sloganValues[languageCode]?.trim() ||
    settings.sloganValues.lv?.trim() ||
    t("app.subtitle", "Komandas darāmo darbu saraksts");
  const url = absoluteUrl("/");

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: systemName,
        url,
      },
      {
        "@type": "WebSite",
        name: systemName,
        url,
        description,
        inLanguage: languageCode,
        publisher: { "@type": "Organization", name: systemName, url },
      },
      {
        "@type": "SoftwareApplication",
        name: systemName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url,
        description,
        inLanguage: languageCode,
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
