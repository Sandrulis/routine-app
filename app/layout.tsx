import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AuthSessionProvider } from "@/app/lib/auth/auth-session-provider";
import { getCurrentUser } from "@/app/lib/auth/get-current-user";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { DisplayPreferencesProvider } from "@/app/components/display-preferences-provider";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { NowProvider } from "@/app/components/now-provider";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { getActiveUiLanguages, getServerTranslations } from "@/app/lib/i18n/server";
import { documentTitleTemplate, resolveSystemName } from "@/app/lib/document-title";
import { brandImageMime, siteHeadIconUrl } from "@/app/lib/site-admin/branding";
import { getSiteSettings } from "@/app/lib/site-admin/repository";
import { getEffectiveDisplayPreferences } from "@/app/lib/users/display-preferences";
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
  const [
    { languageCode, overlay, table },
    languages,
    effectiveDisplayPreferences,
    settings,
    user,
  ] = await Promise.all([
    getServerTranslations(),
    getActiveUiLanguages(),
    getEffectiveDisplayPreferences(),
    getSiteSettings(),
    getCurrentUser(),
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
        <AuthSessionProvider initialUser={user}>
          <NowProvider>
            <TranslationsProvider
              languageCode={languageCode}
              overlay={overlay}
              table={table}
              languages={languages}
            >
              <DisplayPreferencesProvider preferences={effectiveDisplayPreferences}>
                <FeedbackToastProvider>
                  <CookieConsentProvider>{children}</CookieConsentProvider>
                </FeedbackToastProvider>
              </DisplayPreferencesProvider>
            </TranslationsProvider>
          </NowProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
