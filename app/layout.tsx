import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthSessionProvider } from "@/app/lib/auth/auth-session-provider";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { DisplayPreferencesProvider } from "@/app/components/display-preferences-provider";
import { TimezoneSync } from "@/app/components/timezone-sync";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { NowProvider } from "@/app/components/now-provider";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { SentryInit } from "@/app/components/sentry-init";
import { UmamiAnalytics } from "@/app/components/umami-analytics";
import { getSentryPublicConfig } from "@/app/lib/integrations/sentry/config";
import { getUmamiPublicConfig } from "@/app/lib/integrations/umami/config";
import { getActiveUiLanguages, getServerTranslations } from "@/app/lib/i18n/server";
import { documentTitleTemplate, resolveSystemName } from "@/app/lib/document-title";
import { brandImageMime, siteHeadIconUrl } from "@/app/lib/site-admin/branding";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { getEffectiveDisplayPreferences, getCurrentUserDisplayPreferences } from "@/app/lib/users/display-preferences";
import { htmlLang, ogLocale as openGraphLocale } from "@/app/lib/seo/locale-path";
import {
  OG_IMAGE_PATH,
  OG_IMAGE_SIZE,
  OG_IMAGE_TYPE,
  TWITTER_IMAGE_PATH,
} from "@/app/lib/seo/share-image";
import {
  getGoogleSiteVerification,
  getPublicSiteUrl,
} from "@/app/lib/seo/site-url";
import { INDEX_ROBOTS } from "@/app/lib/seo/metadata";
import "./fontawesome.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [{ languageCode, t }, settings] = await Promise.all([
    getServerTranslations(),
    getSiteSettings(),
  ]);
  const systemName = resolveSystemName(settings.systemName);
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

  const googleVerification = getGoogleSiteVerification();
  const siteUrl = getPublicSiteUrl();
  const ogLocale = openGraphLocale(languageCode);

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: systemName,
      template: documentTitleTemplate(systemName),
    },
    description: slogan,
    applicationName: systemName,
    robots: INDEX_ROBOTS,
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
    openGraph: {
      type: "website",
      locale: ogLocale,
      siteName: systemName,
      title: systemName,
      description: slogan,
      url: siteUrl,
      images: [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_SIZE.width,
          height: OG_IMAGE_SIZE.height,
          alt: systemName,
          type: OG_IMAGE_TYPE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: systemName,
      description: slogan,
      images: [TWITTER_IMAGE_PATH],
    },
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
  const [
    { languageCode, overlay, table },
    languages,
    effectiveDisplayPreferences,
    settings,
    user,
    userDisplayPreferences,
    umami,
    sentry,
  ] = await Promise.all([
    getServerTranslations(),
    getActiveUiLanguages(),
    getEffectiveDisplayPreferences(),
    getSiteSettings(),
    getCurrentUser(),
    getCurrentUserDisplayPreferences(),
    getUmamiPublicConfig(),
    getSentryPublicConfig(),
  ]);
  const headIcon = siteHeadIconUrl(
    settings.logoUrl,
    settings.faviconUrl,
    settings.systemName,
    settings.logoColor,
  );

  return (
    <html lang={htmlLang(languageCode)} className={`${geistSans.variable} h-full`} suppressHydrationWarning>
      <head>
        <link rel="icon" href={headIcon} type={brandImageMime(headIcon)} />
        <link rel="shortcut icon" href={headIcon} />
        {settings.logoUrl ? (
          <link rel="apple-touch-icon" href={settings.logoUrl} />
        ) : null}
      </head>
      <body className="min-h-dvh" suppressHydrationWarning>
        {sentry ? (
          <SentryInit dsn={sentry.dsn} environment={sentry.environment} />
        ) : null}
        <AuthSessionProvider initialUser={user}>
          <TimezoneSync userTimezone={userDisplayPreferences.timezone} />
          <NowProvider>
            <TranslationsProvider
              languageCode={languageCode}
              overlay={overlay}
              table={table}
              languages={languages}
              systemName={resolveSystemName(settings.systemName)}
            >
              <DisplayPreferencesProvider preferences={effectiveDisplayPreferences}>
                <FeedbackToastProvider>
                  <CookieConsentProvider>
                    {children}
                    {umami ? (
                      <UmamiAnalytics
                        websiteId={umami.websiteId}
                        scriptSrc={umami.scriptSrc}
                        integrity={umami.integrity}
                      />
                    ) : null}
                  </CookieConsentProvider>
                </FeedbackToastProvider>
              </DisplayPreferencesProvider>
            </TranslationsProvider>
          </NowProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
