import type { Metadata } from "next";
import { getMfaGate } from "@/app/lib/auth/mfa";
import { createClient } from "@/app/lib/supabase/server";
import { createGmailBridgeTicket } from "@/app/lib/extension/gmail-bridge-ticket";
import { sessionFromRequestCookies } from "@/app/lib/extension/session-from-cookies";
import { getServerTranslations } from "@/app/lib/i18n/server";
import { translatedPageMetadata } from "@/app/lib/page-metadata";
import { GmailPluginMfaGate } from "./gmail-plugin-mfa";
import { GmailPluginHandoffBody } from "./handoff-status";

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
  let needsMfa = false;
  if (wantsLogin || wantsConnect) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      hasBrowserSession = Boolean(user?.id);
      if (user?.id) {
        if ((await getMfaGate(supabase)) === "verify") {
          needsMfa = true;
        } else {
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const refreshToken =
            session?.refresh_token ||
            (await sessionFromRequestCookies())?.refresh_token ||
            "";
          if (refreshToken) {
            bootstrapTicket = tryCreateBootstrapTicket({
              refreshToken,
              userId: user.id,
            });
          }
        }
      }
    } catch {
      hasBrowserSession = false;
    }
  }

  const loggedIn = wantsLogin && hasBrowserSession && !needsMfa;
  // Gmail connection is stored server-side; success does not depend on browser cookies.
  const connected = wantsConnect;
  const sessionMissing = wantsLogin && !hasBrowserSession;
  const title = sessionMissing
    ? t("extension.gmail.login_done.error_title", "Neizdevās ienākt")
    : needsMfa
      ? t("auth.mfa.title", "Divfaktoru autentifikācija")
      : loggedIn
        ? t("extension.gmail.login_done.title", "Ienāci {SYSTEM_NAME}")
        : connected
          ? t("extension.gmail.done.title", "Gmail savienots")
          : loginFlow
            ? t("extension.gmail.login_done.error_title", "Neizdevās ienākt")
            : t("extension.gmail.done.error_title", "Neizdevās savienot Gmail");
  const readyBody = loggedIn
    ? t(
        "extension.gmail.login_done.body",
        "Vari aizvērt šo logu un atgriezties spraudnī.",
      )
    : connected
      ? t(
          "extension.gmail.done.body",
          "Gmail ir pieslēgts {SYSTEM_NAME}. Vari aizvērt šo logu un atgriezties spraudnī.",
        )
      : "";
  const waitingBody =
    !needsMfa && (loggedIn || connected)
      ? t(
          "extension.gmail.handoff.waiting",
          "Pagaidi, kamēr spraudnis saņem sesiju…",
        )
      : "";
  const body = sessionMissing
    ? t(
        "extension.gmail.login_done.session_missing",
        "Pārlūkā nav aktīvas sesijas. Mēģini vēlreiz no Gmail spraudņa.",
      )
    : needsMfa
      ? t(
          "auth.mfa.verify_login",
          "Ievadi Authenticator kodu, lai pabeigtu ielogošanos.",
        )
      : loggedIn || connected
        ? readyBody
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
    : needsMfa
      ? "mfa"
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
      {waitingBody && readyBody && !needsMfa ? (
        <GmailPluginHandoffBody waiting={waitingBody} ready={readyBody} />
      ) : (
        <p className="mt-3 text-sm text-zinc-600">{body}</p>
      )}
      {needsMfa ? <GmailPluginMfaGate /> : null}
    </main>
  );
}
