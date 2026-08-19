import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { DisplayPreferencesProvider } from "@/app/components/display-preferences-provider";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { getActiveUiLanguages, getServerTranslations } from "@/app/lib/i18n/server";
import { documentTitleTemplate, resolveSystemName } from "@/app/lib/document-title";
import { brandImageMime, siteHeadIconUrl } from "@/app/lib/site-admin/branding";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { getEffectiveDisplayPreferences } from "@/app/lib/users/display-preferences";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const [{ languageCode, t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName, t("app.name", "Routine"));
  const slogan =
    settings.sloganValues[languageCode]?.trim() ||
    settings.sloganValues.lv?.trim() ||
    t("app.subtitle", "Komandas darāmo darbu saraksts");
  const headIcon = siteHeadIconUrl(
    settings.logoUrl,
    settings.faviconUrl,
    systemName,
    settings.logoColor,
  );

  return {
    title: {
      default: systemName,
      template: documentTitleTemplate(systemName),
    },
    description: slogan,
    icons: {
      icon: [{ url: headIcon, type: brandImageMime(headIcon) }],
      shortcut: headIcon,
      apple: settings.logoUrl || headIcon,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ languageCode, overlay }, languages, effectiveDisplayPreferences, settings] =
    await Promise.all([
      getServerTranslations(),
      getActiveUiLanguages(),
      getEffectiveDisplayPreferences(),
      getSiteSettings(),
    ]);
  const headIcon = siteHeadIconUrl(
    settings.logoUrl,
    settings.faviconUrl,
    settings.systemName,
    settings.logoColor,
  );

  return (
    <html lang={languageCode} className={`${geistSans.variable} h-full`}>
      <head>
        <link rel="icon" href={headIcon} type={brandImageMime(headIcon)} />
        <link rel="shortcut icon" href={headIcon} />
        {settings.logoUrl ? (
          <link rel="apple-touch-icon" href={settings.logoUrl} />
        ) : null}
      </head>
      <body className="min-h-dvh">
        <TranslationsProvider
          languageCode={languageCode}
          overlay={overlay}
          languages={languages}
        >
          <DisplayPreferencesProvider preferences={effectiveDisplayPreferences}>
            <FeedbackToastProvider>
              <CookieConsentProvider>{children}</CookieConsentProvider>
            </FeedbackToastProvider>
          </DisplayPreferencesProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
