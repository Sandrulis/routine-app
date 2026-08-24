import type { Metadata } from "next";
import { createClient } from "@/app/lib/supabase/server";
import { createGmailBridgeTicket } from "@/app/lib/extension/gmail-bridge-ticket";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { translatedPageMetadata } from "@/app/lib/page-metadata";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function tryCreateBootstrapTicket(input: {
  refreshToken: string;
  userId: string;
}): string {
  try {
    return createGmailBridgeTicket(input);
  } catch {
    return "";
  }
}

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
  const wantsLogin = params.logged_in === "1" && !error;
  const wantsConnect = params.connected === "1" && !error;
  const loginFlow = wantsLogin || params.login === "1";

  let bootstrapTicket = "";
  let hasBrowserSession = false;
  if (wantsLogin || wantsConnect) {
    try {
      const supabase = await createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (
        session?.access_token &&
        session.refresh_token &&
        session.user?.id
      ) {
        hasBrowserSession = true;
        bootstrapTicket = tryCreateBootstrapTicket({
          refreshToken: session.refresh_token,
          userId: session.user.id,
        });
      }
    } catch {
      hasBrowserSession = false;
    }
  }

  const loggedIn = wantsLogin && hasBrowserSession;
  // Gmail connection is stored server-side; success does not depend on browser cookies.
  const connected = wantsConnect;
  const sessionMissing = wantsLogin && !hasBrowserSession;
  const title = sessionMissing
    ? t("extension.gmail.login_done.error_title", "Neizdevās ienākt")
    : loggedIn
      ? t("extension.gmail.login_done.title", "Ienāci {SYSTEM_NAME}")
      : connected
        ? t("extension.gmail.done.title", "Gmail savienots")
        : loginFlow
          ? t("extension.gmail.login_done.error_title", "Neizdevās ienākt")
          : t("extension.gmail.done.error_title", "Neizdevās savienot Gmail");
  const body = sessionMissing
    ? t(
        "extension.gmail.login_done.session_missing",
        "Pārlūkā nav aktīvas sesijas. Mēģini vēlreiz no Gmail spraudņa.",
      )
    : loggedIn
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

  const pluginState = sessionMissing
    ? "error"
    : loggedIn
      ? "logged-in"
      : connected
        ? "connected"
        : error
          ? "error"
          : "done";

  return (
    <main
      className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center"
      data-routine-gmail-plugin={pluginState}
      {...(bootstrapTicket
        ? { "data-routine-bootstrap-ticket": bootstrapTicket }
        : {})}
    >
      <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
      <p className="mt-3 text-sm text-zinc-600">{body}</p>
    </main>
  );
}
