import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { CookieConsentProvider } from "@/app/components/cookie-consent-provider";
import { FeedbackToastProvider } from "@/app/components/feedback-toast-provider";
import { TranslationsProvider } from "@/app/components/translations-provider";
import { DEFAULT_LANGUAGE } from "@/app/lib/i18n/messages";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Routine",
  description: "Komandas darāmo darbu saraksts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={DEFAULT_LANGUAGE} className={`${geistSans.variable} h-full`}>
      <body className="min-h-dvh">
        <TranslationsProvider languageCode={DEFAULT_LANGUAGE}>
          <FeedbackToastProvider>
            <CookieConsentProvider>{children}</CookieConsentProvider>
          </FeedbackToastProvider>
        </TranslationsProvider>
      </body>
    </html>
  );
}
