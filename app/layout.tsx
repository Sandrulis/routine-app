import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { DisplayPreferencesProvider } from "@/app/components/display-preferences-provider";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { getActiveUiLanguages, getServerTranslations } from "@/app/lib/i18n/server";
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
  const slogan =
    settings.sloganValues[languageCode]?.trim() ||
    settings.sloganValues.lv?.trim() ||
    t("app.subtitle", "Komandas darāmo darbu saraksts");

  return {
    title: settings.systemName || t("app.name", "Routine"),
    description: slogan,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [{ languageCode, overlay }, languages, effectiveDisplayPreferences] =
    await Promise.all([
      getServerTranslations(),
      getActiveUiLanguages(),
      getEffectiveDisplayPreferences(),
    ]);

  return (
    <html lang={languageCode} className={`${geistSans.variable} h-full`}>
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
