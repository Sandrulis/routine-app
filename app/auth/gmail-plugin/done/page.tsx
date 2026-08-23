import type { Metadata } from "next";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return translatedPageMetadata(
    "extension.gmail.done.title",
    "Gmail savienots",
  );
}

export default async function GmailPluginDonePage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    connected?: string;
    logged_in?: string;
    login?: string;
  }>;
}) {
  const params = await searchParams;
  const { t } = await getServerTranslations();
  const error = params.error?.trim() || "";
  const connected = params.connected === "1" && !error;
  const loggedIn = params.logged_in === "1" && !error;
  const loginFlow = loggedIn || params.login === "1";
  const title = loggedIn
    ? t("extension.gmail.login_done.title", "Ienāci {SYSTEM_NAME}")
    : connected
      ? t("extension.gmail.done.title", "Gmail savienots")
      : loginFlow
        ? t("extension.gmail.login_done.error_title", "Neizdevās ienākt")
        : t("extension.gmail.done.error_title", "Neizdevās savienot Gmail");
  const body = loggedIn
    ? t(
        "extension.gmail.login_done.body",
        "Vari aizvērt šo logu un atgriezties spraudnī.",
      )
    : connected
      ? t(
          "extension.gmail.done.body",
          "Gmail ir pieslēgts {SYSTEM_NAME}. Vari aizvērt šo logu un atgriezties spraudnī.",
        )
      : loginFlow
        ? t(
            "extension.gmail.login_done.error_body",
            "Mēģini vēlreiz no Gmail spraudņa.",
          )
        : t(
            "extension.gmail.done.error_body",
            "Mēģini vēlreiz no Gmail spraudņa. Pārliecinies, ka Google OAuth un Gmail API ir ieslēgti.",
          );

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center"
      data-routine-gmail-plugin={
        loggedIn ? "logged-in" : connected ? "connected" : error ? "error" : "done"
      }
    >
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-3 text-sm text-zinc-600">{body}</p>
    </main>
  );
}
